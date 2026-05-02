import "server-only";
import { PATHS } from "@/config/paths";
import type { Client } from "@/types/client";
import { isSupabaseRuntimeEnabled } from "./db";
import { fileExists as fileExistsOnDisk } from "./storage";
import { readState } from "./supabase-state";
import { readYaml } from "./yaml";

interface ClientsRegistry {
  version: string;
  clients: Client[];
}

let cached: Client[] | null = null;

export async function getAllClients(): Promise<Client[]> {
  if (cached) return cached;

  if (isSupabaseRuntimeEnabled()) {
    const stateClients = await readState<Client[]>("clients");
    if (stateClients) {
      cached = stateClients;
      return cached;
    }

    const registryPath = (await fileExistsOnDisk(PATHS.clientsRegistry))
      ? PATHS.clientsRegistry
      : PATHS.staticClientsRegistry;
    if (!(await fileExistsOnDisk(registryPath))) {
      cached = [];
      return cached;
    }

    const data = await readYaml<ClientsRegistry>(registryPath);
    cached = data.clients ?? [];
    return cached;
  }

  const registryPath = (await fileExistsOnDisk(PATHS.clientsRegistry))
    ? PATHS.clientsRegistry
    : PATHS.staticClientsRegistry;
  if (!(await fileExistsOnDisk(registryPath))) {
    cached = [];
    return cached;
  }
  const data = await readYaml<ClientsRegistry>(registryPath);
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
