import "server-only";
import path from "node:path";
import type { ModelSpec } from "@/types/model";
import { routeTask } from "./router";
import { getAllSquads } from "./squads";

export interface TaskCatalogEntry {
  id: string;
  squadId: string;
  squadName: string;
  slug: string;
  fileName: string;
  title: string;
  estimatedModel: ModelSpec;
}

let cached: TaskCatalogEntry[] | null = null;

function humanizeTaskName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getTaskCatalog(): Promise<TaskCatalogEntry[]> {
  if (cached) return cached;

  const squads = await getAllSquads();
  const entries = await Promise.all(
    squads.flatMap((squad) =>
      (squad.components.tasks ?? []).map(async (fileName) => {
        const slug = path.basename(fileName, ".md");
        const estimatedModel = await routeTask({
          taskName: slug,
          squadId: squad.id,
          hasClientData: false,
        });

        return {
          id: `${squad.id}:${slug}`,
          squadId: squad.id,
          squadName: squad.short_title,
          slug,
          fileName,
          title: humanizeTaskName(slug),
          estimatedModel,
        };
      }),
    ),
  );

  cached = entries.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  return cached;
}

export function clearTasksCache(): void {
  cached = null;
}
