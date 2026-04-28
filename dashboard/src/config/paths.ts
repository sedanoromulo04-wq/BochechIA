import path from "node:path";

// Raiz do projeto BochechIA (um nível acima de dashboard/).
// Resolvido via process.cwd() porque next dev/build sempre roda de dentro de dashboard/.
export const BOCHECHIA_ROOT = path.resolve(process.cwd(), "..");

export const PATHS = {
  squads: path.join(BOCHECHIA_ROOT, "squads"),
  routing: path.join(BOCHECHIA_ROOT, "core", "routing", "model-routing.yaml"),
  mem0Schema: path.join(BOCHECHIA_ROOT, "core", "mem0", "schema.yaml"),
  clientsRegistry: path.join(BOCHECHIA_ROOT, "core", "clients", "registry.yaml"),
  orchestratorSquad: path.join(BOCHECHIA_ROOT, "squads", "_orchestrator"),
  runsStore: path.join(BOCHECHIA_ROOT, "core", "runs"),
} as const;
