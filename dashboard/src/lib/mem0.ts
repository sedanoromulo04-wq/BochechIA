import "server-only";

// Mem0 client para o BochechIA.
//
// SDK mem0ai v1+ mudou a assinatura:
//   - add()    → opções top-level (userId, agentId, appId) são passadas diretamente
//   - search() → userId, agentId, appId, runId devem ir em filters: {}
//
// Stub mode: opera sem erros quando MEM0_API_KEY não está configurada.

interface Mem0AddOpts {
  userId?: string;
  agentId?: string;
  appId?: string;
  runId?: string;
  [k: string]: unknown;
}

interface Mem0SearchOpts {
  filters?: Record<string, unknown>;
  [k: string]: unknown;
}

type RawMem0Client = {
  add: (
    messages: Array<{ role: string; content: string }>,
    opts?: Mem0AddOpts,
  ) => Promise<unknown>;
  search: (
    query: string,
    opts?: Mem0SearchOpts,
  ) => Promise<{ results: Array<{ id: string; memory: string; score?: number }> }>;
};

export interface Mem0Memory {
  id: string;
  memory: string;
  score?: number;
}

let _client: RawMem0Client | null = null;
let _stubMode = false;

async function getClient(): Promise<{ client: RawMem0Client; stub: boolean }> {
  if (_client) return { client: _client, stub: _stubMode };

  const apiKey = process.env.MEM0_API_KEY;
  if (!apiKey) {
    _stubMode = true;
    _client = {
      async add() { return null; },
      async search() { return { results: [] }; },
    };
    return { client: _client, stub: true };
  }

  const mod = await import("mem0ai").catch(() => null);
  if (!mod) {
    _stubMode = true;
    _client = {
      async add() { return null; },
      async search() { return { results: [] }; },
    };
    return { client: _client, stub: true };
  }

  const MemoryClient = mod.default ?? mod.MemoryClient ?? mod;
  _client = new MemoryClient({ apiKey }) as unknown as RawMem0Client;
  return { client: _client, stub: false };
}

// Carrega contexto antes de iniciar uma tarefa.
export async function loadContext(
  clientId: string,
  squadId: string,
  query: string,
  runId?: string,
): Promise<{ memories: Mem0Memory[]; contextBlock: string; stubMode: boolean }> {
  const { client, stub } = await getClient();

  if (stub) return { memories: [], contextBlock: "", stubMode: true };

  const res = await client.search(query, {
    filters: {
      AND: [
        { user_id: clientId },
        { agent_id: squadId },
        { app_id: "bochechia" },
        ...(runId ? [{ run_id: runId }] : []),
      ],
    },
  });

  const memories = (res.results ?? []).map((m) => ({
    id: m.id,
    memory: m.memory,
    score: m.score,
  }));

  const contextBlock =
    memories.length > 0
      ? `## Contexto do cliente (Mem0)\n\n${memories.map((m) => `- ${m.memory}`).join("\n")}`
      : "";

  return { memories, contextBlock, stubMode: false };
}

// Salva fatos aprovados no Mem0.
export async function saveContext(
  clientId: string,
  squadId: string,
  facts: string,
  runId?: string,
): Promise<{ saved: boolean; stubMode: boolean }> {
  const { client, stub } = await getClient();

  if (stub) return { saved: false, stubMode: true };

  await client.add([{ role: "assistant", content: facts }], {
    userId: clientId,
    agentId: squadId,
    appId: "bochechia",
    ...(runId ? { runId } : {}),
  });

  return { saved: true, stubMode: false };
}
