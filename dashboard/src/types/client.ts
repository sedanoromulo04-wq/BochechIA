export interface Project {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  squad: string;
  status: "pending" | "active" | "review" | "completed" | "paused";
  tags?: string[];
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  niche: string;
  status: "active" | "inactive" | "onboarding" | "paused" | "completed";
  mem0_user_id: string;
  squads_active: string[];
  primary_contact?: string;
  start_date?: string;
  projects: Project[];
}
