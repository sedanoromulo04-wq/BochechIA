import "server-only";
import { PATHS } from "@/config/paths";
import type { Client } from "@/types/client";
import { fileExists, readYaml } from "./yaml";

interface ClientsRegistry {
  version: string;
  clients: Client[];
}

let cached: Client[] | null = null;

export async function getAllClients(): Promise<Client[]> {
  if (cached) return cached;
  if (!(await fileExists(PATHS.clientsRegistry))) {
    cached = [];
    return cached;
  }
  const data = await readYaml<ClientsRegistry>(PATHS.clientsRegistry);
  cached = data.clients ?? [];
  return cached;
}

export async function getClient(clientId: string): Promise<Client | null> {
  const all = await getAllClients();
  return all.find((c) => c.id === clientId) ?? null;
}

export function clearClientsCache(): void {
  cached = null;
}
