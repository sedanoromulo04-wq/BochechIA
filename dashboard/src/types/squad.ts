import type { ModelId } from "./model";

export interface AgentRef {
  id: string;
  squadId: string;
  filename: string;
}

export interface SquadComponents {
  agents: string[];
  tasks: string[];
  workflows: string[];
  checklists: string[];
}

export interface SquadRouting {
  tier_0?: ModelId;
  tier_1?: ModelId;
  task_simple?: ModelId;
  task_complex?: ModelId;
  client_data?: ModelId;
  default?: ModelId;
  critical?: ModelId;
  [key: string]: ModelId | undefined;
}

export interface SquadMem0 {
  scope?: string[];
  load_on_start?: boolean;
  save_on_complete?: boolean;
}

export interface SquadPrivacy {
  client_data_model?: string;
  internal_tasks_model?: string;
}

export interface Squad {
  id: string;
  name: string;
  version: string;
  short_title: string;
  description: string;
  tags: string[];
  components: SquadComponents;
  routing?: SquadRouting;
  mem0?: SquadMem0;
  privacy?: SquadPrivacy;
  path: string;
}
