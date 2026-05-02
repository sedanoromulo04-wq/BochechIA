import fs from "node:fs";
import path from "node:path";

const isVercel = Boolean(process.env.VERCEL);

function hasProjectShape(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "squads")) ||
    fs.existsSync(path.join(dir, "core")) ||
    fs.existsSync(path.join(dir, "docs"))
  );
}

function resolveRepoRoot(): string {
  const cwd = process.cwd();
  const candidates = [
    cwd,
    path.resolve(cwd, ".."),
    path.resolve(cwd, "../.."),
  ];

  for (const candidate of candidates) {
    if (hasProjectShape(candidate)) {
      return candidate;
    }
  }

  return path.resolve(cwd, "..");
}

// Raiz somente-leitura do repositório.
// Em local e na Vercel tentamos detectar automaticamente o diretório correto.
export const BOCHECHIA_ROOT = resolveRepoRoot();

// Raiz mutável para runtime.
// Localmente gravamos no próprio repositório; na Vercel usamos /tmp para evitar
// falhas de escrita no filesystem somente-leitura.
export const BOCHECHIA_RUNTIME_ROOT = isVercel
  ? path.join("/tmp", "bochechia-runtime")
  : BOCHECHIA_ROOT;

export const PATHS = {
  squads: path.join(BOCHECHIA_ROOT, "squads"),
  routing: path.join(BOCHECHIA_ROOT, "core", "routing", "model-routing.yaml"),
  mem0Schema: path.join(BOCHECHIA_ROOT, "core", "mem0", "schema.yaml"),
  staticClientsRegistry: path.join(BOCHECHIA_ROOT, "core", "clients", "registry.yaml"),
  clientsRegistry: path.join(BOCHECHIA_RUNTIME_ROOT, "core", "clients", "registry.yaml"),
  orchestratorSquad: path.join(BOCHECHIA_ROOT, "squads", "_orchestrator"),
  staticRunsStore: path.join(BOCHECHIA_ROOT, "core", "runs"),
  runsStore: path.join(BOCHECHIA_RUNTIME_ROOT, "core", "runs"),
  staticKnowledgeRoot: path.join(BOCHECHIA_ROOT, "core", "knowledge"),
  knowledgeRoot: path.join(BOCHECHIA_RUNTIME_ROOT, "core", "knowledge"),
  staticKnowledgeStore: path.join(BOCHECHIA_ROOT, "core", "knowledge", "brain-store.json"),
  knowledgeStore: path.join(BOCHECHIA_RUNTIME_ROOT, "core", "knowledge", "brain-store.json"),
} as const;
