import "server-only";
import type { Citation, ExecutionPlan } from "@/types/knowledge";
import type { CreateRunInput } from "@/types/run";
import { getModelSpec, routeTask } from "./router";
import { listPolicies } from "./knowledge-store";
import { searchKnowledge } from "./knowledge-retrieval";

function nowId(): string {
  return `plan-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function inferAction(confidence: number, hasClientData: boolean): "clarify" | "execute" | "escalate" | "answer" {
  if (confidence < 0.08) return "escalate";
  if (confidence < 0.18) return "clarify";
  if (hasClientData) return "execute";
  return "answer";
}

function inferAllowedTools(dataScope: ExecutionPlan["dataScope"]): string[] {
  if (dataScope === "restricted") return ["knowledge.search"];
  if (dataScope === "client") return ["knowledge.search", "memory.load", "memory.save"];
  return ["knowledge.search", "memory.load"];
}

function requireApproval(input: {
  action: ExecutionPlan["action"];
  hasClientData: boolean;
  critical?: boolean;
}): boolean {
  if (input.critical) return true;
  if (input.hasClientData) return true;
  return input.action === "execute" || input.action === "escalate";
}

function formatRationale(opts: {
  confidence: number;
  citations: Citation[];
  action: ExecutionPlan["action"];
  hasClientData: boolean;
  critical?: boolean;
}): string[] {
  const lines = [
    `knowledgeConfidence=${opts.confidence.toFixed(3)}`,
    `${opts.citations.length} citação(ões) operacional(is) encontradas`,
    `ação escolhida: ${opts.action}`,
  ];
  if (opts.hasClientData) lines.push("dados de cliente detectados; política de privacidade acionada");
  if (opts.critical) lines.push("demanda marcada como crítica; approval obrigatório");
  if (opts.confidence < 0.18) lines.push("base pouco confiável; cérebro deve pedir contexto adicional ou escalar");
  return lines;
}

export async function buildExecutionPlan(input: CreateRunInput): Promise<ExecutionPlan> {
  const retrieval = await searchKnowledge(input.prompt, {
    workspaceId: input.workspaceId,
  });
  const policies = await listPolicies();
  const action = inferAction(retrieval.confidence, input.hasClientData);
  const dataScope: ExecutionPlan["dataScope"] = input.hasClientData ? "client" : "internal";
  const routedModel = await routeTask({
    taskName: input.taskName,
    squadId: input.squadId,
    hasClientData: input.hasClientData,
    critical: input.critical,
  });
  const spec = await getModelSpec(routedModel.tier);

  return {
    id: nowId(),
    workspaceId: input.workspaceId ?? "workspace-operacoes-internas",
    processId: input.taskName ?? "general-operational-request",
    squadId: input.squadId,
    action,
    dataScope,
    modelId: spec.id,
    provider: spec.provider,
    requiresApproval: requireApproval({
      action,
      hasClientData: input.hasClientData,
      critical: input.critical,
    }),
    allowedTools: inferAllowedTools(dataScope),
    knowledgeConfidence: retrieval.confidence,
    rationale: formatRationale({
      confidence: retrieval.confidence,
      citations: retrieval.citations,
      action,
      hasClientData: input.hasClientData,
      critical: input.critical,
    }).concat(`políticas carregadas: ${policies.length}`),
    citations: retrieval.citations,
  };
}
