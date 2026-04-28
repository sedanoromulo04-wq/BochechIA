export interface Client {
  id: string;
  company: string;
  name: string;
  niche: string;
  status: "active" | "inactive" | "onboarding";
  projects: Project[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  squadId: string;
  status: "active" | "completed" | "paused";
  createdAt: string;
  updatedAt: string;
}