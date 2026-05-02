import { NextRequest, NextResponse } from "next/server";
import { getClient, clearClientsCache } from "@/lib/clients";
import { updateProject } from "@/lib/clients-store";
import type { Project } from "@/types/client";

// GET /api/clients/:client/projects/:project — detalhe do projeto
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ client: string; project: string }> },
) {
  const { client: clientId, project: projectId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  const project = client.projects.find((p) => p.id === projectId);
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  return NextResponse.json(project);
}

// PATCH /api/clients/:client/projects/:project — atualiza projeto
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ client: string; project: string }> },
) {
  try {
    const { client: clientId, project: projectId } = await params;
    const body = await req.json() as Partial<Project>;

    const updated = await updateProject(clientId, projectId, body);
    clearClientsCache();

    const project = updated.projects.find((p) => p.id === projectId)!;
    return NextResponse.json(project);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message.includes("não encontrado") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
