import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { BOCHECHIA_ROOT, PATHS } from "@/config/paths";
import type { Client } from "@/types/client";
import type {
  ApprovalRequest,
  BrainStore,
  ConnectorRecord,
  DecisionRecord,
  DocumentChunk,
  DocumentRecord,
  DocumentVersion,
  EntityRecord,
  EvalSet,
  FactRecord,
  KnowledgeSource,
  PolicyRule,
  RetrievalMetric,
  SourceKind,
  Workspace,
} from "@/types/knowledge";
import { isSupabaseRuntimeEnabled } from "./db";
import { checksum, chunkText, embedText, extractFacts, slugify, tokenize } from "./knowledge-text";
import { ensureFileFromSeed, readJsonFile, writeJsonFile } from "./storage";
import { readState, writeState } from "./supabase-state";

const DEFAULT_ORG_ID = "org-bochechia";
const DEFAULT_WORKSPACE_ID = "workspace-operacoes-internas";
const DEFAULT_OPERATOR_ID = "operator-ceo";

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

function defaultPolicies(): PolicyRule[] {
  const createdAt = now();
  return [
    {
      id: "policy-privacy-client-data",
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: "Client data requires Claude",
      category: "privacy",
      description: "Dados de cliente nunca podem sair para modelos Alibaba/Qwen.",
      conditions: { hasClientData: true },
      actions: { modelTier: "sonnet", provider: "anthropic" },
      priority: 100,
      active: true,
      createdAt,
    },
    {
      id: "policy-approval-critical",
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: "Critical actions require approval",
      category: "approval",
      description: "Ações críticas ou outputs com dados de cliente exigem aprovação humana.",
      conditions: { critical: true },
      actions: { requiresApproval: true },
      priority: 90,
      active: true,
      createdAt,
    },
    {
      id: "policy-knowledge-confidence",
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: "Low-confidence queries require clarification",
      category: "knowledge",
      description: "Sem contexto confiável, o cérebro deve pedir clarificação ou escalar.",
      conditions: { minKnowledgeConfidence: 0.18 },
      actions: { lowConfidenceAction: "clarify", hardFailBelow: 0.08 },
      priority: 80,
      active: true,
      createdAt,
    },
  ];
}

function defaultConnectors(): ConnectorRecord[] {
  const createdAt = now();
  return [
    {
      id: "connector-docs",
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: "Internal Docs",
      kind: "filesystem",
      status: "ready",
      description: "Documentação operacional e arquivos da base local.",
      createdAt,
    },
    {
      id: "connector-mem0",
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: "Mem0",
      kind: "memory",
      status: "planned",
      description: "Memória curta auxiliar subordinada ao knowledge layer.",
      createdAt,
    },
    {
      id: "connector-supabase",
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: "Supabase",
      kind: "database",
      status: "planned",
      description: "Banco canônico planejado para produção com pgvector e storage.",
      createdAt,
    },
  ];
}

function emptyStore(): BrainStore {
  const createdAt = now();
  const workspace: Workspace = {
    id: DEFAULT_WORKSPACE_ID,
    organizationId: DEFAULT_ORG_ID,
    name: "Operações Internas",
    slug: "operacoes-internas",
    focus: "SOPs, políticas, decisões e execução operacional supervisionada.",
    createdAt,
  };
  const evalSet: EvalSet = {
    id: "evalset-operacoes-v1",
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: "Operações Internas v1",
    description: "Avalia retrieval, citações e aprovação nas rotinas internas.",
    createdAt,
  };

  return {
    meta: {
      version: "1.0.0",
      storageMode: isSupabaseRuntimeEnabled() ? "supabase" : "file",
      initializedAt: createdAt,
      lastUpdatedAt: createdAt,
    },
    organizations: [
      {
        id: DEFAULT_ORG_ID,
        name: "BochechIA",
        slug: "bochechia",
        createdAt,
      },
    ],
    workspaces: [workspace],
    operators: [
      {
        id: DEFAULT_OPERATOR_ID,
        workspaceId: DEFAULT_WORKSPACE_ID,
        name: "CEO",
        role: "human-supervisor",
        createdAt,
      },
    ],
    knowledgeSources: [],
    documents: [],
    documentVersions: [],
    documentChunks: [],
    facts: [],
    entities: [
      {
        id: "entity-process-operacoes-internas",
        workspaceId: DEFAULT_WORKSPACE_ID,
        kind: "process",
        name: "Operações Internas",
        slug: "operacoes-internas",
        aliases: ["operations", "sops"],
        createdAt,
      },
    ],
    relationships: [],
    decisionRecords: [],
    policies: defaultPolicies(),
    approvals: [],
    connectors: defaultConnectors(),
    syncJobs: [],
    ingestionEvents: [],
    evalSets: [evalSet],
    evalRuns: [],
    retrievalMetrics: [],
  };
}

async function readLegacyClients(): Promise<Client[]> {
  try {
    const sourcePath = PATHS.staticClientsRegistry;
    const raw = await fs.readFile(sourcePath, "utf8");
    const parsed = (yaml.load(raw) as { clients?: Client[] }) ?? {};
    return parsed.clients ?? [];
  } catch {
    return [];
  }
}

async function bootstrapSource(
  store: BrainStore,
  opts: { title: string; relativePath: string; kind?: SourceKind; domain?: string; tags?: string[] },
): Promise<BrainStore> {
  const absolutePath = path.join(BOCHECHIA_ROOT, opts.relativePath);
  try {
    const content = await fs.readFile(absolutePath, "utf8");
    return ingestSourceIntoStore(store, {
      title: opts.title,
      kind: opts.kind ?? "seed",
      domain: opts.domain ?? "operations",
      tags: opts.tags ?? ["seed", "internal"],
      uri: opts.relativePath.replace(/\\/g, "/"),
      content,
    });
  } catch {
    return store;
  }
}

function addEntityIfMissing(store: BrainStore, entity: EntityRecord): void {
  if (!store.entities.some((existing) => existing.id === entity.id)) {
    store.entities.push(entity);
  }
}

async function seedStoreIfNeeded(store: BrainStore): Promise<BrainStore> {
  if (store.knowledgeSources.length > 0) return store;

  for (const client of await readLegacyClients()) {
    addEntityIfMissing(store, {
      id: `entity-client-${slugify(client.id)}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      kind: "client",
      name: client.company,
      slug: slugify(client.id),
      aliases: [client.id, client.name],
      metadata: {
        niche: client.niche,
        status: client.status,
      },
      createdAt: now(),
    });
  }

  let seeded = store;
  const files = [
    { title: "Visão Geral Arquitetural", relativePath: "docs/architecture/overview.md", domain: "architecture" },
    { title: "Progresso de Implementação", relativePath: "docs/progress.md", domain: "operations" },
    { title: "Validação Operacional", relativePath: "docs/operations/agent-validation.md", domain: "operations" },
    { title: "Gate do Dashboard", relativePath: "docs/operations/dashboard-gating.md", domain: "operations" },
    { title: "Routing de Modelos", relativePath: "core/routing/model-routing.yaml", domain: "policy", kind: "policy" as const },
    { title: "Schema Mem0", relativePath: "core/mem0/schema.yaml", domain: "memory", kind: "policy" as const },
  ];

  for (const file of files) {
    seeded = await bootstrapSource(seeded, file);
  }
  return seeded;
}

export function ingestSourceIntoStore(
  store: BrainStore,
  input: {
    title: string;
    content: string;
    domain: string;
    kind: SourceKind;
    uri?: string;
    tags?: string[];
    workspaceId?: string;
    clientId?: string;
    projectId?: string;
    createdBy?: string;
  },
): BrainStore {
  const createdAt = now();
  const workspaceId = input.workspaceId ?? DEFAULT_WORKSPACE_ID;
  const sourceId = createId("source");
  const source: KnowledgeSource = {
    id: sourceId,
    workspaceId,
    clientId: input.clientId,
    projectId: input.projectId,
    kind: input.kind,
    title: input.title,
    domain: input.domain,
    status: "indexed",
    trustLevel: input.kind === "seed" || input.kind === "policy" ? "system" : "approved",
    uri: input.uri,
    tags: input.tags ?? [],
    createdBy: input.createdBy ?? DEFAULT_OPERATOR_ID,
    metadata: {
      tokenCount: tokenize(input.content).length,
    },
    createdAt,
    updatedAt: createdAt,
  };
  store.knowledgeSources.push(source);

  const documentId = createId("doc");
  const versionId = createId("docver");
  const versionChecksum = checksum(input.content);
  const document: DocumentRecord = {
    id: documentId,
    sourceId,
    workspaceId,
    clientId: input.clientId,
    projectId: input.projectId,
    title: input.title,
    domain: input.domain,
    currentVersionId: versionId,
    createdAt,
  };
  const version: DocumentVersion = {
    id: versionId,
    documentId,
    version: 1,
    content: input.content,
    checksum: versionChecksum,
    status: "approved",
    extractedAt: createdAt,
  };
  store.documents.push(document);
  store.documentVersions.push(version);

  const chunks = chunkText(input.content);
  chunks.forEach((content, index) => {
    const chunkId = createId("chunk");
    const chunk: DocumentChunk = {
      id: chunkId,
      documentVersionId: versionId,
      documentId,
      sourceId,
      workspaceId,
      clientId: input.clientId,
      projectId: input.projectId,
      ordinal: index,
      content,
      tokenCount: tokenize(content).length,
      lexicalTerms: tokenize(content).slice(0, 32),
      embedding: embedText(content),
      metadata: {
        domain: input.domain,
        tags: input.tags ?? [],
        process: input.domain,
      },
    };
    store.documentChunks.push(chunk);

    for (const extracted of extractFacts(content)) {
      const fact: FactRecord = {
        id: createId("fact"),
        workspaceId,
        clientId: input.clientId,
        projectId: input.projectId,
        sourceId,
        documentId,
        versionId,
        chunkId,
        type: input.kind === "policy" ? "policy" : "fact",
        subject: extracted.subject,
        claim: extracted.claim,
        confidence: input.kind === "seed" || input.kind === "policy" ? 0.82 : 0.7,
        status: "approved",
        createdAt,
      };
      store.facts.push(fact);
    }
  });

  store.ingestionEvents.push({
    id: createId("ingest"),
    workspaceId,
    sourceId,
    status: "completed",
    summary: `${chunks.length} chunk(s) indexados de ${input.title}.`,
    createdAt,
  });

  addEntityIfMissing(store, {
    id: `entity-document-${slugify(document.title)}`,
    workspaceId,
    kind: "document",
    name: document.title,
    slug: slugify(document.title),
    aliases: [sourceId],
    metadata: {
      domain: input.domain,
      sourceKind: input.kind,
    },
    createdAt,
  });

  store.meta.lastUpdatedAt = createdAt;
  return store;
}

export async function getBrainStore(): Promise<BrainStore> {
  if (isSupabaseRuntimeEnabled()) {
    const stateStore = await readState<BrainStore>("brain-store");
    const base =
      stateStore ??
      await readJsonFile<BrainStore>(PATHS.staticKnowledgeStore, emptyStore());
    const seeded = await seedStoreIfNeeded(base);
    seeded.meta.storageMode = "supabase";
    await writeState("brain-store", seeded);
    return seeded;
  }

  await ensureFileFromSeed(PATHS.knowledgeStore, PATHS.staticKnowledgeStore);
  const base = await readJsonFile<BrainStore>(PATHS.knowledgeStore, emptyStore());
  const seeded = await seedStoreIfNeeded(base);
  await writeJsonFile(PATHS.knowledgeStore, seeded);
  return seeded;
}

export async function saveBrainStore(store: BrainStore): Promise<void> {
  store.meta.lastUpdatedAt = now();
  store.meta.storageMode = isSupabaseRuntimeEnabled() ? "supabase" : "file";

  if (isSupabaseRuntimeEnabled()) {
    await writeState("brain-store", store);
    return;
  }

  await writeJsonFile(PATHS.knowledgeStore, store);
}

export async function updateBrainStore(
  mutator: (store: BrainStore) => BrainStore | void | Promise<BrainStore | void>,
): Promise<BrainStore> {
  const store = await getBrainStore();
  const result = await mutator(store);
  const next = result ?? store;
  await saveBrainStore(next);
  return next;
}

export async function createKnowledgeSource(input: {
  title: string;
  content: string;
  domain: string;
  kind: SourceKind;
  uri?: string;
  tags?: string[];
  clientId?: string;
  projectId?: string;
}): Promise<KnowledgeSource> {
  const store = await updateBrainStore((draft) => ingestSourceIntoStore(draft, input));
  return store.knowledgeSources[store.knowledgeSources.length - 1];
}

export async function listDocumentsByProject(
  clientId: string,
  projectId: string,
): Promise<{ source: KnowledgeSource; document: DocumentRecord }[]> {
  const store = await getBrainStore();
  const sources = store.knowledgeSources.filter(
    (s) => s.clientId === clientId && s.projectId === projectId,
  );
  return sources.map((source) => {
    const document = store.documents.find((d) => d.sourceId === source.id)!;
    return { source, document };
  }).filter((entry) => entry.document != null);
}

export async function listKnowledgeSources(): Promise<KnowledgeSource[]> {
  const store = await getBrainStore();
  return [...store.knowledgeSources].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listFacts(): Promise<FactRecord[]> {
  const store = await getBrainStore();
  return [...store.facts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listDecisionRecords(): Promise<DecisionRecord[]> {
  const store = await getBrainStore();
  return [...store.decisionRecords].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listApprovals(): Promise<ApprovalRequest[]> {
  const store = await getBrainStore();
  return [...store.approvals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApprovalRequest(approvalId: string): Promise<ApprovalRequest | null> {
  const store = await getBrainStore();
  return store.approvals.find((approval) => approval.id === approvalId) ?? null;
}

export async function listPolicies(): Promise<PolicyRule[]> {
  const store = await getBrainStore();
  return store.policies.filter((policy) => policy.active);
}

export async function listConnectors(): Promise<ConnectorRecord[]> {
  const store = await getBrainStore();
  return [...store.connectors];
}

export async function listEvalSets(): Promise<EvalSet[]> {
  const store = await getBrainStore();
  return [...store.evalSets];
}

export async function recordDecision(input: Omit<DecisionRecord, "id" | "createdAt" | "updatedAt">): Promise<DecisionRecord> {
  const createdAt = now();
  const record: DecisionRecord = {
    ...input,
    id: createId("decision"),
    createdAt,
    updatedAt: createdAt,
  };
  await updateBrainStore((store) => {
    store.decisionRecords.push(record);
  });
  return record;
}

export async function updateDecisionRecord(
  id: string,
  patch: Partial<DecisionRecord>,
): Promise<DecisionRecord | null> {
  let updated: DecisionRecord | null = null;
  await updateBrainStore((store) => {
    const idx = store.decisionRecords.findIndex((record) => record.id === id);
    if (idx < 0) return;
    store.decisionRecords[idx] = {
      ...store.decisionRecords[idx],
      ...patch,
      updatedAt: now(),
    };
    updated = store.decisionRecords[idx];
  });
  return updated;
}

export async function createApprovalRequest(input: Omit<ApprovalRequest, "id" | "createdAt">): Promise<ApprovalRequest> {
  const approval: ApprovalRequest = {
    ...input,
    id: createId("approval"),
    createdAt: now(),
  };
  await updateBrainStore((store) => {
    store.approvals.push(approval);
  });
  return approval;
}

export async function respondApprovalRequest(
  approvalId: string,
  input: { status: "approved" | "rejected"; respondedBy: string; reason?: string },
): Promise<ApprovalRequest | null> {
  let updated: ApprovalRequest | null = null;
  await updateBrainStore((store) => {
    const idx = store.approvals.findIndex((approval) => approval.id === approvalId);
    if (idx < 0) return;
    store.approvals[idx] = {
      ...store.approvals[idx],
      status: input.status,
      respondedBy: input.respondedBy,
      reason: input.reason,
      respondedAt: now(),
    };
    updated = store.approvals[idx];
  });
  return updated;
}

export async function recordRetrievalMetric(input: Omit<RetrievalMetric, "id" | "createdAt">): Promise<void> {
  await updateBrainStore((store) => {
    store.retrievalMetrics.push({
      ...input,
      id: createId("retrieval"),
      createdAt: now(),
    });
  });
}
