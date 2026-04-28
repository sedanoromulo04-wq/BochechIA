import "server-only";
import crypto from "node:crypto";
import type { CreateRunInput, Run, RunStep, ThreadMessage } from "@/types/run";
import { routeTask, estimateCost, getModelSpec } from "./router";
import { callModel } from "./providers";
import { loadContext, saveContext } from "./mem0";
import { saveRun, updateRun, getRunById } from "./runs-store";

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
  const modelSpec = await routeTask({
    taskName: input.taskName,
    squadId: input.squadId,
    hasClientData: input.hasClientData,
    critical: input.critical,
  });

  const run: Run = {
    id: generateRunId(),
    clientId: input.clientId,
    squadId: input.squadId,
    taskName: input.taskName,
    prompt: input.prompt,
    hasClientData: input.hasClientData,
    critical: input.critical,
    status: "pending",
    modelId: modelSpec.id,
    provider: modelSpec.provider,
    createdAt: now(),
    steps: [],
    messages: [{ role: "ceo", content: input.prompt, createdAt: now() }],
    parentRunId: input.parentRunId,
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
    );

    await updateRun(runId, { mem0Loaded: true });

    // — Construir system prompt —
    const systemLines = [
      `Você é um agente especializado do squad ${run.squadId} no BochechIA.`,
      `Tarefa: ${run.taskName}`,
      `Cliente: ${run.clientId}`,
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

    const updated = await updateRun(runId, {
      status: "awaiting_approval",
      finishedAt: stepEnd,
      output: result.output,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      costUsd: totalCost,
      steps: [...run.steps, step],
      messages: [...(run.messages ?? []), agentMessage],
      mem0Loaded: !mem0Stub,
    });

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
    );
    await updateRun(runId, { mem0Saved: !stubMode });
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
