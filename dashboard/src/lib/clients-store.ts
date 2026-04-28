import "server-only";
import fs from "node:fs/promises";
import yaml from "js-yaml";
import { PATHS } from "@/config/paths";
import type { Client } from "@/types/client";

interface Registry { version: string; clients: Client[] }

async function readRegistry(): Promise<Registry> {
  try {
    const raw = await fs.readFile(PATHS.clientsRegistry, "utf8");
    return (yaml.load(raw) as Registry) ?? { version: "1.0.0", clients: [] };
  } catch {
    return { version: "1.0.0", clients: [] };
  }
}

async function writeRegistry(reg: Registry): Promise<void> {
  const out = yaml.dump(reg, { lineWidth: 120, quotingType: '"' });
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
