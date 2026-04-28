const path = require("path");
const {
  getAgentIds,
  getTaskIds,
  hasHeading,
  indexProject,
  parseMarkdownFrontmatter,
  slugFromFile,
  sortBy,
} = require("./lib/aios-utils.cjs");

const REQUIRED_TASK_HEADINGS = [
  "Inputs",
  "Preconditions",
  "Execution Phases",
  "Output Format",
  "Completion Criteria",
];

const allowedModels = new Set([
  "qwen3.5-flash",
  "qwen3.5-plus",
  "claude-sonnet-4-6",
  "claude-opus-4-6",
]);

function pushIssue(issues, severity, code, message, meta = {}) {
  issues.push({ severity, code, message, ...meta });
}

function validateManifest(squad, issues) {
  const manifest = squad.manifest;
  const where = `${squad.id}/squad.yaml`;

  for (const field of ["name", "version", "short-title", "description"]) {
    if (!manifest?.[field]) {
      pushIssue(issues, "error", "manifest.missing-field", `${where} missing '${field}'`, {
        squad: squad.id,
      });
    }
  }

  if (!manifest?.routing) {
    pushIssue(issues, "error", "manifest.missing-routing", `${where} missing routing`, {
      squad: squad.id,
    });
  } else {
    for (const [key, value] of Object.entries(manifest.routing)) {
      if (value && !allowedModels.has(value)) {
        pushIssue(
          issues,
          "error",
          "manifest.invalid-routing-model",
          `${where} has invalid routing model '${value}' in '${key}'`,
          { squad: squad.id },
        );
      }
    }
  }

  if (!manifest?.mem0?.scope?.length) {
    pushIssue(issues, "error", "manifest.invalid-mem0", `${where} missing mem0.scope`, {
      squad: squad.id,
    });
  }

  if (!manifest?.privacy?.client_data_model || !manifest?.privacy?.internal_tasks_model) {
    pushIssue(issues, "error", "manifest.invalid-privacy", `${where} missing privacy fields`, {
      squad: squad.id,
    });
  }

  for (const bucket of ["agents", "tasks", "workflows", "checklists"]) {
    const entries = squad[bucket];
    const missing = entries.filter((entry) => !entry.exists);
    for (const entry of missing) {
      pushIssue(
        issues,
        "error",
        "manifest.missing-reference",
        `${where} references missing ${bucket.slice(0, -1)} '${entry.file}'`,
        { squad: squad.id },
      );
    }
  }
}

function validateTaskFiles(squad, issues) {
  const agentIds = getAgentIds(squad);

  for (const task of squad.tasks) {
    const rel = path.relative(process.cwd(), task.path);
    const { frontmatter, body } = parseMarkdownFrontmatter(task.path);

    if (!frontmatter) {
      pushIssue(issues, "error", "task.missing-frontmatter", `${rel} missing YAML frontmatter`, {
        squad: squad.id,
        task: task.id,
      });
      continue;
    }

    const expectedCommand = `*${task.id}`;
    const rawTaskName = String(frontmatter.task || "");
    const responsavel = String(frontmatter.responsavel || "");

    if (!rawTaskName) {
      pushIssue(issues, "error", "task.missing-task-signature", `${rel} missing frontmatter.task`, {
        squad: squad.id,
        task: task.id,
      });
    }

    if (!responsavel.startsWith("@")) {
      pushIssue(issues, "error", "task.invalid-responsavel", `${rel} has invalid responsavel`, {
        squad: squad.id,
        task: task.id,
      });
    } else {
      const ownerId = responsavel.slice(1);
      if (!agentIds.has(ownerId)) {
        pushIssue(
          issues,
          "warning",
          "task.owner-not-in-squad",
          `${rel} responsavel '${ownerId}' is not a top-level agent in ${squad.id}`,
          { squad: squad.id, task: task.id },
        );
      }
    }

    const commandMatch = body.match(/\*\*Command:\*\*\s*`([^`]+)`/i);
    if (!commandMatch) {
      pushIssue(issues, "error", "task.missing-command", `${rel} missing '**Command:**' section`, {
        squad: squad.id,
        task: task.id,
      });
    } else if (commandMatch[1] !== expectedCommand) {
      pushIssue(
        issues,
        "error",
        "task.command-mismatch",
        `${rel} command '${commandMatch[1]}' does not match expected '${expectedCommand}'`,
        { squad: squad.id, task: task.id },
      );
    }

    if (!Array.isArray(frontmatter.Entrada) || frontmatter.Entrada.length === 0) {
      pushIssue(issues, "error", "task.missing-inputs", `${rel} missing frontmatter.Entrada`, {
        squad: squad.id,
        task: task.id,
      });
    }

    if (!Array.isArray(frontmatter.Saida) || frontmatter.Saida.length === 0) {
      pushIssue(issues, "error", "task.missing-outputs", `${rel} missing frontmatter.Saida`, {
        squad: squad.id,
        task: task.id,
      });
    }

    if (!Array.isArray(frontmatter.Checklist) || frontmatter.Checklist.length === 0) {
      pushIssue(issues, "error", "task.missing-checklist", `${rel} missing frontmatter.Checklist`, {
        squad: squad.id,
        task: task.id,
      });
    }

    for (const heading of REQUIRED_TASK_HEADINGS) {
      if (!hasHeading(body, heading)) {
        pushIssue(
          issues,
          "error",
          "task.missing-heading",
          `${rel} missing '## ${heading}' heading`,
          { squad: squad.id, task: task.id },
        );
      }
    }
  }
}

function validateWorkflows(squad, issues) {
  const agentIds = getAgentIds(squad);
  const taskIds = getTaskIds(squad);

  for (const workflow of squad.workflows) {
    const rel = path.relative(process.cwd(), workflow.path);
    const data = require("./lib/aios-utils.cjs").readYaml(workflow.path);
    const wf = data.workflow;

    if (!wf?.id || !wf?.entry_agent || !wf?.type) {
      pushIssue(issues, "error", "workflow.missing-core-fields", `${rel} missing workflow core fields`, {
        squad: squad.id,
        workflow: workflow.id,
      });
      continue;
    }

    if (!agentIds.has(wf.entry_agent)) {
      pushIssue(
        issues,
        "error",
        "workflow.invalid-entry-agent",
        `${rel} entry_agent '${wf.entry_agent}' not found in ${squad.id}`,
        { squad: squad.id, workflow: workflow.id },
      );
    }

    const phaseIds = new Set((data.phases || []).map((phase) => phase.id));
    for (const phase of data.phases || []) {
      if (!phase.id || !phase.agent || !phase.task) {
        pushIssue(
          issues,
          "error",
          "workflow.invalid-phase",
          `${rel} has phase with missing id/agent/task`,
          { squad: squad.id, workflow: workflow.id },
        );
        continue;
      }

      const agentLooksDynamic = String(phase.agent).includes("{");
      if (!agentLooksDynamic && !agentIds.has(phase.agent)) {
        pushIssue(
          issues,
          "error",
          "workflow.invalid-phase-agent",
          `${rel} phase '${phase.id}' references unknown agent '${phase.agent}'`,
          { squad: squad.id, workflow: workflow.id },
        );
      }

      const taskValue = String(phase.task);
      const taskLooksDynamic = taskValue.includes("{");
      if (!taskLooksDynamic) {
        const taskSlug = slugFromFile(taskValue);
        if (!taskIds.has(taskSlug)) {
          pushIssue(
            issues,
            "error",
            "workflow.invalid-phase-task",
            `${rel} phase '${phase.id}' references unknown task '${taskValue}'`,
            { squad: squad.id, workflow: workflow.id },
          );
        }
      }

      for (const dep of phase.depends_on || []) {
        if (!phaseIds.has(dep)) {
          pushIssue(
            issues,
            "error",
            "workflow.invalid-dependency",
            `${rel} phase '${phase.id}' depends on unknown phase '${dep}'`,
            { squad: squad.id, workflow: workflow.id },
          );
        }
      }
    }
  }
}

function validateRoutingCoverage(project, issues) {
  const taskToSquad = new Map();
  for (const squad of project.squads) {
    for (const task of squad.tasks) {
      taskToSquad.set(task.id, squad.id);
    }
  }

  const routingTasks = new Set((project.routing.tasks || []).map((entry) => entry.name));
  for (const [taskId, squadId] of [...taskToSquad.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))) {
    if (!routingTasks.has(taskId)) {
      pushIssue(
        issues,
        "error",
        "routing.task-missing",
        `Routing missing explicit model mapping for task '${taskId}' from ${squadId}`,
        { squad: squadId, task: taskId },
      );
    }
  }

  for (const entry of project.routing.tasks || []) {
    if (!taskToSquad.has(entry.name)) {
      pushIssue(
        issues,
        "warning",
        "routing.orphan-task",
        `Routing defines task '${entry.name}' but no top-level squad task uses it`,
        { task: entry.name },
      );
    }
  }
}

function printSummary(issues) {
  const grouped = {
    error: issues.filter((issue) => issue.severity === "error"),
    warning: issues.filter((issue) => issue.severity === "warning"),
  };

  console.log("== BochechIA Validator ==");
  console.log(`Errors: ${grouped.error.length}`);
  console.log(`Warnings: ${grouped.warning.length}`);
  console.log("");

  for (const severity of ["error", "warning"]) {
    if (grouped[severity].length === 0) continue;
    console.log(`${severity.toUpperCase()}S`);
    for (const issue of grouped[severity]) {
      console.log(`- [${issue.code}] ${issue.message}`);
    }
    console.log("");
  }
}

function main() {
  const project = indexProject();
  const issues = [];

  for (const squad of project.squads) {
    validateManifest(squad, issues);
    validateTaskFiles(squad, issues);
    validateWorkflows(squad, issues);
  }

  validateRoutingCoverage(project, issues);
  printSummary(issues);

  if (issues.some((issue) => issue.severity === "error")) {
    process.exitCode = 1;
  }
}

main();
