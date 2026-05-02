import type { Citation, ExecutionPlan, RetrievalResult } from "./knowledge";
import type { ModelId } from "./model";

export type RunStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "error";

export interface ThreadMessage {
  role: "ceo" | "agent";
  content: string;
  createdAt: string;
  modelId?: ModelId;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

export interface RunStep {
  squadId: string;
  agentId: string;
  modelId: ModelId;
  startedAt: string;
  finishedAt?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  output?: string;
}

export interface Run {
  id: string;
  workspaceId: string;
  clientId: string;
  projectId?: string;
  squadId: string;
  taskName?: string;
  prompt: string;
  hasClientData: boolean;
  critical?: boolean;
  status: RunStatus;
  modelId: ModelId;
  provider: "anthropic" | "alibaba";
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  output?: string;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  mem0Loaded?: boolean;
  mem0Saved?: boolean;
  steps: RunStep[];
  messages: ThreadMessage[];
  parentRunId?: string;
  childRunIds?: string[];
  citations?: Citation[];
  plan?: ExecutionPlan;
  retrieval?: RetrievalResult;
  approvalId?: string;
  decisionRecordId?: string;
  knowledgeConfidence?: number;
}

export interface CreateRunInput {
  workspaceId?: string;
  clientId: string;
  projectId?: string;
  squadId: string;
  taskName?: string;
  prompt: string;
  hasClientData: boolean;
  critical?: boolean;
  parentRunId?: string;
}

export interface ReviewRunInput {
  action: "approve" | "reject" | "reply" | "dispatch";
  approvedBy?: string;
  rejectionReason?: string;
  replyText?: string;
  targetSquadId?: string;
  dispatchNote?: string;
}
