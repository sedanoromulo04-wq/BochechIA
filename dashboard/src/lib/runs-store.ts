import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { Run } from "@/types/run";
import { PATHS } from "@/config/paths";
import { isSupabaseRuntimeEnabled } from "./db";
import { ensureFileFromSeed } from "./storage";
import { readState, writeState } from "./supabase-state";

const RUNS_PATH = path.join(PATHS.knowledgeRoot, "runs.json");
const LEGACY_RUNS_PATH = path.join(PATHS.staticRunsStore, "runs.json");

async function readRuns(): Promise<Run[]> {
  if (isSupabaseRuntimeEnabled()) {
    const stateRuns = await readState<Run[]>("runs");
    if (stateRuns) return stateRuns;
  }

  await ensureFileFromSeed(RUNS_PATH, LEGACY_RUNS_PATH);
  try {
    const raw = await fs.readFile(RUNS_PATH, "utf8");
    return JSON.parse(raw) as Run[];
  } catch {
    try {
      const legacyRaw = await fs.readFile(LEGACY_RUNS_PATH, "utf8");
      const legacyRuns = JSON.parse(legacyRaw) as Run[];
      await fs.mkdir(PATHS.knowledgeRoot, { recursive: true });
      await fs.writeFile(RUNS_PATH, JSON.stringify(legacyRuns, null, 2), "utf8");
      return legacyRuns;
    } catch {
      return [];
    }
  }
}

async function writeRuns(runs: Run[]): Promise<void> {
  if (isSupabaseRuntimeEnabled()) {
    await writeState("runs", runs);
    return;
  }

  await fs.mkdir(PATHS.knowledgeRoot, { recursive: true });
  await fs.writeFile(RUNS_PATH, JSON.stringify(runs, null, 2), "utf8");
}

export async function getAllRuns(): Promise<Run[]> {
  const runs = await readRuns();
  return runs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getRunsByClient(clientId: string): Promise<Run[]> {
  const runs = await getAllRuns();
  return runs.filter((r) => r.clientId === clientId);
}

export async function getRunById(id: string): Promise<Run | null> {
  const runs = await readRuns();
  return runs.find((r) => r.id === id) ?? null;
}

export async function saveRun(run: Run): Promise<void> {
  const runs = await readRuns();
  const idx = runs.findIndex((r) => r.id === run.id);
  if (idx >= 0) {
    runs[idx] = run;
  } else {
    runs.push(run);
  }
  await writeRuns(runs);
}

export async function updateRun(
  id: string,
  patch: Partial<Run>,
): Promise<Run | null> {
  const runs = await readRuns();
  const idx = runs.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  runs[idx] = { ...runs[idx], ...patch };
  await writeRuns(runs);
  return runs[idx];
}
