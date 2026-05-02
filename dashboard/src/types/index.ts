export interface Client {
  id: string;
  name: string;
  status: "active" | "inactive" | "onboarding";
  created_at: string;
  mem0_user_id: string;
}

export interface ApprovalRequest {
  id: string;
  status: string;
  type: string;
  agent_id: string;
  squad_id: string;
  content: string;
  client_id: string;
  created_at: string;
  notes?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "running" | "blocked" | "error";
  tier: 0 | 1 | 2;
  current_task?: string;
}

export interface Squad {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "blocked";
  agents: Agent[];
  mem0_scopes: string[];
  tier_0_model: string;
  tier_1_model: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "awaiting_approval" | "approved" | "rejected" | "completed";
  squad_id: string;
  agent_id: string;
  client_id: string;
  workflow_file?: string;
  mem0_context_loaded?: boolean;
  created_at: string;
  updated_at: string;
}
