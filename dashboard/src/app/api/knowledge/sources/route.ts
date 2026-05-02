import { NextRequest, NextResponse } from "next/server";
import { createKnowledgeSource, listKnowledgeSources } from "@/lib/knowledge-store";

export async function GET() {
  try {
    const sources = await listKnowledgeSources();
    return NextResponse.json(sources);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title?: string;
      content?: string;
      domain?: string;
      kind?: "document" | "policy" | "note" | "meeting" | "seed" | "approved-output" | "legacy-import";
      uri?: string;
      tags?: string[];
    };

    if (!body.title || !body.content || !body.domain || !body.kind) {
      return NextResponse.json(
        { error: "Campos obrigatórios: title, content, domain, kind" },
        { status: 400 },
      );
    }

    const source = await createKnowledgeSource({
      title: body.title,
      content: body.content,
      domain: body.domain,
      kind: body.kind,
      uri: body.uri,
      tags: body.tags,
    });

    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
