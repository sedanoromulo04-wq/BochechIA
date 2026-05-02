import "server-only";
import crypto from "node:crypto";
import type { CreateRunInput, Run, RunStep, ThreadMessage } from "@/types/run";
import { estimateCost, getModelSpec } from "./router";
import { callModel } from "./providers";
import { loadContext, saveContext } from "./mem0";
import { saveRun, updateRun, getRunById } from "./runs-store";
import { buildExecutionPlan } from "./policy-engine";
import { searchKnowledge, summarizeCitations } from "./knowledge-retrieval";
import {
  createApprovalRequest,
  createKnowledgeSource,
  recordDecision,
  respondApprovalRequest,
  updateDecisionRecord,
} from "./knowledge-store";

function generateRunId(): string {
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString("hex");
  return `run-${ts}-${rand}`;
}

function now(): string {
  return new Date().toISOString();
}

// Cria o run no store com status "pending" e retorna o objeto imediatamente.
export async function createRun(input: CreateRunInput): Promise<Run> {
  const plan = await buildExecutionPlan(input);

  const run: Run = {
    id: generateRunId(),
    workspaceId: input.workspaceId ?? "workspace-operacoes-internas",
    clientId: input.clientId,
    projectId: input.projectId,
    squadId: input.squadId,
    taskName: input.taskName,
    prompt: input.prompt,
    hasClientData: input.hasClientData,
    critical: input.critical,
    status: "pending",
    modelId: plan.modelId,
    provider: plan.provider,
    createdAt: now(),
    steps: [],
    messages: [{ role: "ceo", content: input.prompt, createdAt: now() }],
    parentRunId: input.parentRunId,
    citations: plan.citations,
    plan,
    knowledgeConfidence: plan.knowledgeConfidence,
  };

  await saveRun(run);
  return run;
}

// Executa o run de ponta a ponta:
//   1. Enforce privacidade (bloqueia Alibaba/Qwen se hasClientData=true)
//   2. Carrega contexto do Mem0
//   3. Chama o provider
//   4. Calcula custo
//   5. Persiste resultado com status "awaiting_approval"
export async function executeRun(runId: string): Promise<Run> {
  let run = await updateRun(runId, { status: "running", startedAt: now() });
  if (!run) throw new Error(`Run não encontrado: ${runId}`);

  try {
    const plan = run.plan ?? (await buildExecutionPlan({
      workspaceId: run.workspaceId,
      clientId: run.clientId,
      squadId: run.squadId,
      taskName: run.taskName,
      prompt: run.prompt,
      hasClientData: run.hasClientData,
      critical: run.critical,
      parentRunId: run.parentRunId,
    }));
    const retrieval = await searchKnowledge(run.prompt, {
      workspaceId: run.workspaceId,
      clientId: run.clientId,
      projectId: run.projectId,
    });

    let decisionId = run.decisionRecordId;
    if (!decisionId) {
      const decision = await recordDecision({
        workspaceId: run.workspaceId,
        runId,
        processId: plan.processId,
        squadId: run.squadId,
        action: plan.action,
        rationale: plan.rationale,
        citations: plan.citations,
        policyIds: ["policy-privacy-client-data", "policy-approval-critical", "policy-knowledge-confidence"],
        modelId: plan.modelId,
        knowledgeConfidence: plan.knowledgeConfidence,
        status: plan.requiresApproval ? "awaiting_approval" : "planned",
      });
      decisionId = decision.id;
    }

    // — Enforcement de privacidade —
    // Se o run tem dados de cliente e o modelo escolhido é Alibaba/Qwen, bloqueia.
    if (run.hasClientData && run.provider === "alibaba") {
      const safeSpec = await getModelSpec(run.critical ? "opus" : "sonnet");
      run = (await updateRun(runId, {
        modelId: safeSpec.id,
        provider: safeSpec.provider,
      }))!;
    }

    // — Mem0: carregar contexto —
    const { contextBlock, stubMode: mem0Stub } = await loadContext(
      run.clientId,
      run.squadId,
      run.prompt,
      run.id,
      run.projectId,
    );

    await updateRun(runId, { mem0Loaded: true });

    // — Construir system prompt —
    const systemLines = [
      `Você é um worker especializado do squad ${run.squadId} no BochechIA.`,
      `O cérebro central já planejou a execução antes de você responder.`,
      `Tarefa: ${run.taskName ?? "general-operational-request"}`,
      `Cliente: ${run.clientId}`,
      `Ação planejada: ${plan.action}`,
      `Data scope: ${plan.dataScope}`,
      `Knowledge confidence: ${plan.knowledgeConfidence.toFixed(3)}`,
      `Ferramentas permitidas: ${plan.allowedTools.join(", ")}`,
      `Racional do cérebro:`,
      ...plan.rationale.map((line) => `- ${line}`),
      "",
      "Responda sempre ancorado na base disponível. Se o contexto estiver insuficiente, peça clarificação explicitamente.",
      "Quando usar conhecimento do sistema, cite as fontes no formato [1], [2], [3].",
      "",
      "Evidências operacionais:",
      summarizeCitations(retrieval.citations),
    ];
    if (contextBlock) systemLines.push("", contextBlock);
    const systemPrompt = systemLines.join("\n");

    // — Construir histórico de mensagens para o provider —
    // Usa a thread acumulada para dar ao agente memória da conversa.
    const historyMessages = (run.messages ?? []).map((m) => ({
      role: m.role === "ceo" ? "user" : "assistant",
      content: m.content,
    })) as Array<{ role: "user" | "assistant"; content: string }>;

    // — Chamar provider —
    const stepStart = now();
    const result = await callModel(run.modelId, systemPrompt, historyMessages);
    const stepEnd = now();

    // — Calcular custo —
    const modelSpec = await getModelSpec(
      run.modelId.startsWith("claude-")
        ? run.modelId.includes("opus")
          ? "opus"
          : "sonnet"
        : run.modelId.includes("plus")
          ? "pro"
          : "flash",
    );
    const costUsd = estimateCost(modelSpec, result.inputTokens, result.outputTokens);

    const agentMessage: ThreadMessage = {
      role: "agent",
      content: result.output,
      createdAt: stepEnd,
      modelId: run.modelId,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd,
    };

    const step: RunStep = {
      squadId: run.squadId,
      agentId: "orchestrator",
      modelId: run.modelId,
      startedAt: stepStart,
      finishedAt: stepEnd,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd,
      output: result.output,
    };

    const totalInputTokens = (run.inputTokens ?? 0) + result.inputTokens;
    const totalOutputTokens = (run.outputTokens ?? 0) + result.outputTokens;
    const totalCost = (run.costUsd ?? 0) + costUsd;

    let approvalId = run.approvalId;
    if (plan.requiresApproval && !approvalId && decisionId) {
      const approval = await createApprovalRequest({
        workspaceId: run.workspaceId,
        runId,
        decisionRecordId: decisionId,
        status: "pending",
        requestedBy: "brain-orchestrator",
      });
      approvalId = approval.id;
    }

    const updated = await updateRun(runId, {
      status: plan.requiresApproval ? "awaiting_approval" : "approved",
      finishedAt: stepEnd,
      output: result.output,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      costUsd: totalCost,
      steps: [...run.steps, step],
      messages: [...(run.messages ?? []), agentMessage],
      mem0Loaded: !mem0Stub,
      citations: retrieval.citations,
      retrieval,
      plan,
      decisionRecordId: decisionId,
      approvalId,
      knowledgeConfidence: retrieval.confidence,
      approvedAt: plan.requiresApproval ? undefined : stepEnd,
      approvedBy: plan.requiresApproval ? undefined : "brain-orchestrator",
    });

    if (decisionId) {
      await updateDecisionRecord(decisionId, {
        status: plan.requiresApproval ? "awaiting_approval" : "completed",
        citations: retrieval.citations,
        knowledgeConfidence: retrieval.confidence,
      });
    }

    if (!plan.requiresApproval && updated?.output) {
      await createKnowledgeSource({
        title: `${run.squadId} · ${run.taskName ?? "run"} · output aprovado`,
        kind: "approved-output",
        domain: run.taskName ?? run.squadId,
        tags: [run.squadId, "approved-output"],
        content: updated.output,
        uri: `runs/${run.id}`,
        clientId: run.clientId,
        projectId: run.projectId,
      });
    }

    return updated!;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateRun(runId, {
      status: "error",
      finishedAt: now(),
      error: message,
    });
    throw err;
  }
}

// Aprova um run: salva no Mem0 e marca como "approved".
export async function approveRun(
  runId: string,
  approvedBy = "human",
): Promise<Run> {
  const run = await updateRun(runId, {
    status: "approved",
    approvedAt: now(),
    approvedBy,
  });
  if (!run) throw new Error(`Run não encontrado: ${runId}`);

  // Salva o output aprovado no Mem0 para uso futuro.
  if (run.output) {
    const { stubMode } = await saveContext(
      run.clientId,
      run.squadId,
      run.output,
      run.id,
      run.projectId,
    );
    await updateRun(runId, { mem0Saved: !stubMode });

    await createKnowledgeSource({
      title: `${run.squadId} · ${run.taskName ?? "run"} · output aprovado`,
      kind: "approved-output",
      domain: run.taskName ?? run.squadId,
      tags: [run.squadId, "approved-output"],
      content: run.output,
      uri: `runs/${run.id}`,
      clientId: run.clientId,
      projectId: run.projectId,
    });
  }

  if (run.approvalId) {
    await respondApprovalRequest(run.approvalId, {
      status: "approved",
      respondedBy: approvedBy,
    });
  }
  if (run.decisionRecordId) {
    await updateDecisionRecord(run.decisionRecordId, {
      status: "completed",
    });
  }

  return (await updateRun(runId, {}))!;
}

// Rejeita um run com motivo.
export async function rejectRun(
  runId: string,
  reason: string,
): Promise<Run> {
  const run = await updateRun(runId, {
    status: "rejected",
    rejectedAt: now(),
    rejectionReason: reason,
  });
  if (!run) throw new Error(`Run não encontrado: ${runId}`);
  if (run.approvalId) {
    await respondApprovalRequest(run.approvalId, {
      status: "rejected",
      respondedBy: "human",
      reason,
    });
  }
  if (run.decisionRecordId) {
    await updateDecisionRecord(run.decisionRecordId, {
      status: "rejected",
    });
  }
  return run;
}

// CEO responde ao agente — adiciona a mensagem na thread e re-executa.
export async function replyRun(
  runId: string,
  replyText: string,
): Promise<Run> {
  const run = await getRunById(runId);
  if (!run) throw new Error(`Run não encontrado: ${runId}`);

  const ceoMessage: ThreadMessage = {
    role: "ceo",
    content: replyText,
    createdAt: now(),
  };

  // Adiciona a resposta do CEO na thread e volta para "pending" para re-executar.
  await updateRun(runId, {
    status: "pending",
    messages: [...(run.messages ?? []), ceoMessage],
    output: undefined,
    finishedAt: undefined,
    approvalId: undefined,
  });

  // Dispara a execução novamente (assíncrono — quem chama não precisa aguardar).
  executeRun(runId).catch((err) => {
    console.error(`[engine] replyRun ${runId} falhou:`, err);
  });

  return (await getRunById(runId))!;
}

// CEO despacha o output aprovado para outro squad.
// Cria um novo run filho com o output atual como contexto.
export async function dispatchRun(
  runId: string,
  targetSquadId: string,
  dispatchNote: string,
): Promise<Run> {
  const parent = await getRunById(runId);
  if (!parent) throw new Error(`Run não encontrado: ${runId}`);

  // Monta o prompt do novo run: contexto do parent + instrução do CEO.
  const contextSummary = parent.output
    ? `## Output do ${parent.squadId} (aprovado)\n\n${parent.output}`
    : "";
  const fullPrompt = [contextSummary, dispatchNote].filter(Boolean).join("\n\n---\n\n");

  const child = await createRun({
    clientId: parent.clientId,
    projectId: parent.projectId,
    squadId: targetSquadId,
    taskName: parent.taskName,
    prompt: fullPrompt,
    hasClientData: parent.hasClientData,
    critical: parent.critical,
    parentRunId: runId,
  });

  // Registra o filho no parent.
  await updateRun(runId, {
    childRunIds: [...(parent.childRunIds ?? []), child.id],
  });

  // Dispara execução do filho.
  executeRun(child.id).catch((err) => {
    console.error(`[engine] dispatchRun filho ${child.id} falhou:`, err);
  });

  return child;
}
