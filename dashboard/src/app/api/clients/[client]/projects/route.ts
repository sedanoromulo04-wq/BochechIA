import { NextRequest, NextResponse } from "next/server";
import type { Project } from "@/types/client";
import { getClient, clearClientsCache } from "@/lib/clients";
import { addProject } from "@/lib/clients-store";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/clients/:client/projects — lista projetos do cliente
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ client: string }> },
) {
  const { client: clientId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  return NextResponse.json(client.projects);
}

// POST /api/clients/:client/projects — cria novo projeto
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ client: string }> },
) {
  try {
    const { client: clientId } = await params;
    const client = await getClient(clientId);
    if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    const body = await req.json() as {
      name?: string;
      description?: string;
      objective?: string;
      squad?: string;
      tags?: string[];
    };

    if (!body.name || !body.squad) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, squad" },
        { status: 400 },
      );
    }

    const project: Project = {
      id: `proj-${slugify(body.name)}-${Date.now().toString(36)}`,
      name: body.name,
      description: body.description,
      objective: body.objective,
      squad: body.squad,
      status: "pending",
      tags: body.tags ?? [],
      createdAt: new Date().toISOString(),
    };

    const updated = await addProject(clientId, project);
    clearClientsCache();

    return NextResponse.json(
      updated.projects.find((p) => p.id === project.id)!,
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
