import type { ModelId } from "./model";

export type SourceKind =
  | "document"
  | "policy"
  | "note"
  | "meeting"
  | "seed"
  | "approved-output"
  | "legacy-import";

export type RecordStatus =
  | "draft"
  | "indexed"
  | "approved"
  | "rejected"
  | "archived"
  | "pending";

export interface Citation {
  sourceId: string;
  title: string;
  excerpt: string;
  uri?: string;
  documentId?: string;
  versionId?: string;
  chunkId?: string;
  factId?: string;
  score?: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  focus: string;
  createdAt: string;
}

export interface Operator {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface KnowledgeSource {
  id: string;
  workspaceId: string;
  clientId?: string;
  projectId?: string;
  kind: SourceKind;
  title: string;
  domain: string;
  status: RecordStatus;
  trustLevel: "system" | "approved" | "draft";
  uri?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  sourceId: string;
  workspaceId: string;
  clientId?: string;
  projectId?: string;
  title: string;
  domain: string;
  currentVersionId: string;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  checksum: string;
  status: RecordStatus;
  extractedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentVersionId: string;
  documentId: string;
  sourceId: string;
  workspaceId: string;
  clientId?: string;
  projectId?: string;
  ordinal: number;
  content: string;
  tokenCount: number;
  lexicalTerms: string[];
  embedding: number[];
  metadata: {
    domain: string;
    tags: string[];
    process?: string;
  };
}

export interface FactRecord {
  id: string;
  workspaceId: string;
  clientId?: string;
  projectId?: string;
  sourceId: string;
  documentId: string;
  versionId: string;
  chunkId: string;
  type: "policy" | "process" | "decision" | "fact" | "metric";
  subject: string;
  claim: string;
  confidence: number;
  status: RecordStatus;
  createdAt: string;
}

export interface EntityRecord {
  id: string;
  workspaceId: string;
  kind: "client" | "process" | "squad" | "tool" | "metric" | "policy" | "document";
  name: string;
  slug: string;
  aliases: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface RelationshipRecord {
  id: string;
  workspaceId: string;
  fromEntityId: string;
  toEntityId: string;
  type: string;
  weight: number;
  sourceId?: string;
  createdAt: string;
}

export interface PolicyRule {
  id: string;
  workspaceId: string;
  name: string;
  category: "privacy" | "approval" | "routing" | "knowledge" | "safety";
  description: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority: number;
  active: boolean;
  createdAt: string;
}

export interface DecisionRecord {
  id: string;
  workspaceId: string;
  runId?: string;
  processId: string;
  squadId: string;
  action: "clarify" | "execute" | "escalate" | "answer";
  rationale: string[];
  citations: Citation[];
  policyIds: string[];
  modelId: ModelId;
  knowledgeConfidence: number;
  status: "planned" | "awaiting_approval" | "approved" | "rejected" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorRecord {
  id: string;
  workspaceId: string;
  name: string;
  kind: string;
  status: "planned" | "ready" | "disconnected";
  description: string;
  createdAt: string;
}

export interface SyncJobRecord {
  id: string;
  connectorId: string;
  workspaceId: string;
  status: "idle" | "running" | "error" | "completed";
  lastRunAt?: string;
  recordsProcessed: number;
}

export interface IngestionEvent {
  id: string;
  workspaceId: string;
  sourceId: string;
  status: "queued" | "processing" | "completed" | "failed";
  summary: string;
  createdAt: string;
}

export interface EvalSet {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface EvalRun {
  id: string;
  evalSetId: string;
  workspaceId: string;
  status: "pending" | "passed" | "failed";
  score: number;
  createdAt: string;
}

export interface RetrievalMetric {
  id: string;
  workspaceId: string;
  query: string;
  confidence: number;
  citationsCount: number;
  createdAt: string;
}

export interface RetrievalFilters {
  workspaceId?: string;
  clientId?: string;
  projectId?: string;
  domain?: string;
  sourceKinds?: SourceKind[];
  entityIds?: string[];
  statuses?: RecordStatus[];
}

export interface RetrievalResult {
  query: string;
  confidence: number;
  citations: Citation[];
  chunks: DocumentChunk[];
  facts: FactRecord[];
  policies: PolicyRule[];
  decisions: DecisionRecord[];
}

export interface ApprovalRequest {
  id: string;
  workspaceId: string;
  runId: string;
  decisionRecordId: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  requestedBy: string;
  respondedBy?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface ExecutionPlan {
  id: string;
  workspaceId: string;
  processId: string;
  squadId: string;
  action: "clarify" | "execute" | "escalate" | "answer";
  dataScope: "internal" | "client" | "restricted";
  modelId: ModelId;
  provider: "anthropic" | "alibaba";
  requiresApproval: boolean;
  allowedTools: string[];
  knowledgeConfidence: number;
  rationale: string[];
  citations: Citation[];
}

export interface BrainStore {
  meta: {
    version: string;
    storageMode: "file" | "supabase";
    initializedAt: string;
    lastUpdatedAt: string;
  };
  organizations: Organization[];
  workspaces: Workspace[];
  operators: Operator[];
  knowledgeSources: KnowledgeSource[];
  documents: DocumentRecord[];
  documentVersions: DocumentVersion[];
  documentChunks: DocumentChunk[];
  facts: FactRecord[];
  entities: EntityRecord[];
  relationships: RelationshipRecord[];
  decisionRecords: DecisionRecord[];
  policies: PolicyRule[];
  approvals: ApprovalRequest[];
  connectors: ConnectorRecord[];
  syncJobs: SyncJobRecord[];
  ingestionEvents: IngestionEvent[];
  evalSets: EvalSet[];
  evalRuns: EvalRun[];
  retrievalMetrics: RetrievalMetric[];
}
