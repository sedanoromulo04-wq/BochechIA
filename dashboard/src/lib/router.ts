import "server-only";
import { PATHS } from "@/config/paths";
import type { ModelId, ModelSpec, ModelTier } from "@/types/model";
import { readYaml } from "./yaml";

// Estrutura interna do model-routing.yaml.
interface RoutingFile {
  version: string;
  privacy: { client_data_model: ModelId; rule: string };
  models: Record<ModelTier, {
    id: ModelId;
    cost_input: number;
    cost_output: number;
    context: number;
    use_for: string;
  }>;
  squads: Record<string, Record<string, ModelTier>>;
  tasks: Array<{ name: string; model: ModelTier }>;
}

let cached: RoutingFile | null = null;

async function loadRouting(): Promise<RoutingFile> {
  if (cached) return cached;
  cached = await readYaml<RoutingFile>(PATHS.routing);
  return cached;
}

export async function getModelSpec(tier: ModelTier): Promise<ModelSpec> {
  const routing = await loadRouting();
  const m = routing.models[tier];
  return {
    id: m.id,
    tier,
    provider: m.id.startsWith("claude-") ? "anthropic" : "alibaba",
    cost_input: m.cost_input,
    cost_output: m.cost_output,
    context: m.context,
    use_for: m.use_for,
  };
}

export async function getAllModels(): Promise<ModelSpec[]> {
  const routing = await loadRouting();
  const tiers: ModelTier[] = ["flash", "pro", "sonnet", "opus"];
  return Promise.all(tiers.map((t) => getModelSpec(t)));
}

// Decisão de roteamento por tarefa.
// Regras (em ordem de precedência):
//   1. hasClientData → claude (sonnet por padrão, opus se task crítica)
//   2. mapeamento explícito em tasks[]
//   3. squad.routing[role] se role informada
//   4. fallback: flash
export interface RouteInput {
  taskName?: string;
  squadId?: string;
  agentRole?: string; // ex: "chief", "offers", "tier_1"
  hasClientData: boolean;
  critical?: boolean;
}

export async function routeTask(input: RouteInput): Promise<ModelSpec> {
  const routing = await loadRouting();

  // 1. Privacidade — dados de cliente forçam Claude.
  if (input.hasClientData) {
    return getModelSpec(input.critical ? "opus" : "sonnet");
  }

  // 2. Mapeamento explícito por nome de tarefa.
  if (input.taskName) {
    const match = routing.tasks.find((t) => t.name === input.taskName);
    if (match) return getModelSpec(match.model);
  }

  // 3. Squad + role.
  if (input.squadId && input.agentRole) {
    const squadRouting = routing.squads[input.squadId];
    const tier = squadRouting?.[input.agentRole];
    if (tier) return getModelSpec(tier);
  }

  // 4. Fallback.
  return getModelSpec("flash");
}

// Custo estimado (USD) de uma execução com a contagem de tokens conhecida.
export function estimateCost(spec: ModelSpec, inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens * spec.cost_input + outputTokens * spec.cost_output) / 1_000_000
  );
}
