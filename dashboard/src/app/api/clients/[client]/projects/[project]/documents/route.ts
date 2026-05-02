import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/clients";
import { createKnowledgeSource, listDocumentsByProject } from "@/lib/knowledge-store";
import type { SourceKind } from "@/types/knowledge";

// GET /api/clients/:client/projects/:project/documents — lista documentos do projeto
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ client: string; project: string }> },
) {
  const { client: clientId, project: projectId } = await params;
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  const project = client.projects.find((p) => p.id === projectId);
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const docs = await listDocumentsByProject(clientId, projectId);
  return NextResponse.json(docs);
}

// POST /api/clients/:client/projects/:project/documents — ingere documento no projeto
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ client: string; project: string }> },
) {
  try {
    const { client: clientId, project: projectId } = await params;
    const client = await getClient(clientId);
    if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    const project = client.projects.find((p) => p.id === projectId);
    if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

    const body = await req.json() as {
      title?: string;
      content?: string;
      kind?: SourceKind;
      domain?: string;
      tags?: string[];
      uri?: string;
    };

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Campos obrigatórios: title, content" },
        { status: 400 },
      );
    }

    const source = await createKnowledgeSource({
      title: body.title,
      content: body.content,
      kind: body.kind ?? "document",
      domain: body.domain ?? project.squad.replace("-squad", "").replace("-masters", ""),
      tags: body.tags ?? [],
      uri: body.uri,
      clientId,
      projectId,
    });

    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
