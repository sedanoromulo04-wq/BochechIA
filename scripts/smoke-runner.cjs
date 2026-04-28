const fs = require("fs");
const path = require("path");
const {
  getAgentIds,
  getTaskIds,
  indexProject,
  readYaml,
  slugFromFile,
} = require("./lib/aios-utils.cjs");

const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, "smoke-fixtures.json"), "utf8"),
);

function resolveValue(rawValue, resolutions) {
  if (typeof rawValue !== "string") return rawValue;
  if (resolutions[rawValue]) return resolutions[rawValue];

  const simpleTemplate = rawValue.match(/^\{([^}]+)\}$/);
  if (simpleTemplate) {
    const key = simpleTemplate[1];
    if (resolutions[key]) return resolutions[key];
  }

  return rawValue;
}

function topologicalPhases(phases) {
  const remaining = [...phases];
  const done = new Set();
  const sorted = [];

  while (remaining.length > 0) {
    const readyIndex = remaining.findIndex((phase) =>
      (phase.depends_on || []).every((dep) => done.has(dep)),
    );

    if (readyIndex === -1) {
      throw new Error("Workflow phases contain a dependency cycle or unresolved dependency");
    }

    const [phase] = remaining.splice(readyIndex, 1);
    sorted.push(phase);
    done.add(phase.id);
  }

  return sorted;
}

function simulateWorkflow(squad, workflowFile, resolutions) {
  const workflowData = readYaml(workflowFile.path);
  const agentIds = getAgentIds(squad);
  const taskIds = getTaskIds(squad);
  const phases = topologicalPhases(workflowData.phases || []);
  const timeline = [];

  for (const phase of phases) {
    const resolvedAgent = resolveValue(phase.agent, resolutions);
    const resolvedTask = resolveValue(phase.task, resolutions);
    const taskSlug = typeof resolvedTask === "string" ? slugFromFile(resolvedTask) : "";

    if (typeof resolvedAgent !== "string" || resolvedAgent.includes("{")) {
      throw new Error(`Phase '${phase.id}' has unresolved agent '${phase.agent}'`);
    }

    if (!agentIds.has(resolvedAgent)) {
      throw new Error(`Phase '${phase.id}' resolved to unknown agent '${resolvedAgent}'`);
    }

    if (typeof resolvedTask !== "string" || resolvedTask.includes("{")) {
      throw new Error(`Phase '${phase.id}' has unresolved task '${phase.task}'`);
    }

    if (!taskIds.has(taskSlug)) {
      throw new Error(`Phase '${phase.id}' resolved to unknown task '${resolvedTask}'`);
    }

    timeline.push({
      phaseId: phase.id,
      name: phase.name,
      agent: resolvedAgent,
      task: resolvedTask,
      dependsOn: phase.depends_on || [],
      outputs: Object.keys(phase.outputs || {}),
    });
  }

  return {
    workflowId: workflowData.workflow.id,
    workflowName: workflowData.workflow.name,
    phases: timeline,
    completionCriteriaCount: (workflowData.completion_criteria || []).length,
  };
}

function main() {
  const project = indexProject();
  const reports = [];
  const failures = [];

  for (const squad of project.squads) {
    const fixture = fixtures[squad.id];
    if (!fixture) {
      failures.push(`${squad.id}: missing smoke fixture`);
      continue;
    }

    const workflowFile = squad.workflows.find((workflow) => workflow.id === fixture.workflow);
    if (!workflowFile) {
      failures.push(`${squad.id}: fixture workflow '${fixture.workflow}' not found`);
      continue;
    }

    try {
      const report = simulateWorkflow(squad, workflowFile, fixture.resolutions || {});
      reports.push({
        squad: squad.id,
        workflow: report.workflowId,
        phases: report.phases.length,
        completionCriteria: report.completionCriteriaCount,
        path: path.relative(process.cwd(), workflowFile.path),
      });
    } catch (error) {
      failures.push(`${squad.id}: ${error.message}`);
    }
  }

  console.log("== BochechIA Smoke Runner ==");
  for (const report of reports) {
    console.log(
      `- ${report.squad} -> ${report.workflow} | phases=${report.phases} | criteria=${report.completionCriteria} | ${report.path}`,
    );
  }

  if (failures.length > 0) {
    console.log("");
    console.log("FAILURES");
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
    process.exitCode = 1;
  } else {
    console.log("");
    console.log(`Smoke passed for ${reports.length} squad(s).`);
  }
}

main();
