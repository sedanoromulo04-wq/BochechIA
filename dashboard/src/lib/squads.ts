import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "@/config/paths";
import type { AgentRef, Squad, SquadComponents, SquadMem0, SquadPrivacy, SquadRouting } from "@/types/squad";
import { fileExists, readYaml } from "./yaml";

// Forma bruta do squad.yaml — mais permissiva que o tipo Squad.
interface RawSquadYaml {
  name?: string;
  version?: string;
  "short-title"?: string;
  description?: string;
  tags?: string[];
  components?: Partial<SquadComponents>;
  routing?: SquadRouting;
  mem0?: SquadMem0;
  privacy?: SquadPrivacy;
}

let cached: Squad[] | null = null;

export async function getAllSquads(): Promise<Squad[]> {
  if (cached) return cached;

  const entries = await fs.readdir(PATHS.squads, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith("_"));

  const squads: Squad[] = [];
  for (const dir of dirs) {
    const squadPath = path.join(PATHS.squads, dir.name);
    const yamlPath = path.join(squadPath, "squad.yaml");
    if (!(await fileExists(yamlPath))) continue;

    const raw = await readYaml<RawSquadYaml>(yamlPath);
    squads.push({
      id: dir.name,
      name: raw.name ?? dir.name,
      version: raw.version ?? "0.0.0",
      short_title: raw["short-title"] ?? dir.name,
      description: raw.description ?? "",
      tags: raw.tags ?? [],
      components: {
        agents: raw.components?.agents ?? [],
        tasks: raw.components?.tasks ?? [],
        workflows: raw.components?.workflows ?? [],
        checklists: raw.components?.checklists ?? [],
      },
      routing: raw.routing,
      mem0: raw.mem0,
      privacy: raw.privacy,
      path: squadPath,
    });
  }

  // Inclui o orquestrador (_orchestrator) se existir.
  const orchYaml = path.join(PATHS.orchestratorSquad, "squad.yaml");
  if (await fileExists(orchYaml)) {
    const raw = await readYaml<RawSquadYaml>(orchYaml);
    squads.unshift({
      id: "_orchestrator",
      name: raw.name ?? "_orchestrator",
      version: raw.version ?? "0.0.0",
      short_title: raw["short-title"] ?? "Master Orchestrator",
      description: raw.description ?? "",
      tags: raw.tags ?? [],
      components: {
        agents: raw.components?.agents ?? [],
        tasks: raw.components?.tasks ?? [],
        workflows: raw.components?.workflows ?? [],
        checklists: raw.components?.checklists ?? [],
      },
      routing: raw.routing,
      mem0: raw.mem0,
      privacy: raw.privacy,
      path: PATHS.orchestratorSquad,
    });
  }

  cached = squads;
  return squads;
}

export async function getSquad(squadId: string): Promise<Squad | null> {
  const squads = await getAllSquads();
  return squads.find((s) => s.id === squadId) ?? null;
}

// Lê o markdown de um agente do squad. Caminho: squads/<squadId>/agents/<filename>.
export async function readAgentMarkdown(squadId: string, agentFilename: string): Promise<string> {
  const squad = await getSquad(squadId);
  if (!squad) throw new Error(`Squad não encontrado: ${squadId}`);
  const agentPath = path.join(squad.path, "agents", agentFilename);
  return fs.readFile(agentPath, "utf8");
}

// Lista agentes de um squad como AgentRef[].
export async function listAgents(squadId: string): Promise<AgentRef[]> {
  const squad = await getSquad(squadId);
  if (!squad) return [];
  return squad.components.agents.map((filename) => ({
    id: filename.replace(/\.md$/, ""),
    squadId,
    filename,
  }));
}

// Para invalidar o cache em desenvolvimento (HMR).
export function clearSquadsCache(): void {
  cached = null;
}
