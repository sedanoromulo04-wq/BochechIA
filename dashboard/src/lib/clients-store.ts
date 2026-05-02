import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { PATHS } from "@/config/paths";
import type { Client } from "@/types/client";
import { isSupabaseRuntimeEnabled } from "./db";
import { ensureDir, ensureFileFromSeed, fileExists } from "./storage";
import { readState, writeState } from "./supabase-state";

interface Registry { version: string; clients: Client[] }

async function readRegistry(): Promise<Registry> {
  if (isSupabaseRuntimeEnabled()) {
    const clients = await readState<Client[]>("clients");
    if (clients) return { version: "1.0.0", clients };
  }

  await ensureFileFromSeed(PATHS.clientsRegistry, PATHS.staticClientsRegistry);
  const sourcePath = (await fileExists(PATHS.clientsRegistry))
    ? PATHS.clientsRegistry
    : PATHS.staticClientsRegistry;
  try {
    const raw = await fs.readFile(sourcePath, "utf8");
    return (yaml.load(raw) as Registry) ?? { version: "1.0.0", clients: [] };
  } catch {
    return { version: "1.0.0", clients: [] };
  }
}

async function writeRegistry(reg: Registry): Promise<void> {
  if (isSupabaseRuntimeEnabled()) {
    await writeState("clients", reg.clients);
    return;
  }

  const out = yaml.dump(reg, { lineWidth: 120, quotingType: '"' });
  await ensureDir(path.dirname(PATHS.clientsRegistry));
  await fs.writeFile(PATHS.clientsRegistry, out, "utf8");
}

export async function addClient(client: Client): Promise<void> {
  const reg = await readRegistry();
  const exists = reg.clients.some((c) => c.id === client.id);
  if (exists) throw new Error(`Cliente com id "${client.id}" já existe.`);
  reg.clients.push(client);
  await writeRegistry(reg);
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  const reg = await readRegistry();
  const idx = reg.clients.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error(`Cliente "${id}" não encontrado.`);
  reg.clients[idx] = { ...reg.clients[idx], ...patch };
  await writeRegistry(reg);
  return reg.clients[idx];
}

export async function addProject(clientId: string, project: import("@/types/client").Project): Promise<Client> {
  const reg = await readRegistry();
  const idx = reg.clients.findIndex((c) => c.id === clientId);
  if (idx < 0) throw new Error(`Cliente "${clientId}" não encontrado.`);
  const exists = reg.clients[idx].projects.some((p) => p.id === project.id);
  if (exists) throw new Error(`Projeto "${project.id}" já existe neste cliente.`);
  reg.clients[idx].projects.push(project);
  await writeRegistry(reg);
  return reg.clients[idx];
}

export async function updateProject(
  clientId: string,
  projectId: string,
  patch: Partial<import("@/types/client").Project>,
): Promise<Client> {
  const reg = await readRegistry();
  const cIdx = reg.clients.findIndex((c) => c.id === clientId);
  if (cIdx < 0) throw new Error(`Cliente "${clientId}" não encontrado.`);
  const pIdx = reg.clients[cIdx].projects.findIndex((p) => p.id === projectId);
  if (pIdx < 0) throw new Error(`Projeto "${projectId}" não encontrado.`);
  reg.clients[cIdx].projects[pIdx] = { ...reg.clients[cIdx].projects[pIdx], ...patch };
  await writeRegistry(reg);
  return reg.clients[cIdx];
}
