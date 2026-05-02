import { NextRequest, NextResponse } from "next/server";
import { searchKnowledge } from "@/lib/knowledge-retrieval";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const domain = req.nextUrl.searchParams.get("domain") ?? undefined;

    if (!query) {
      return NextResponse.json({ error: "Parâmetro q é obrigatório" }, { status: 400 });
    }

    const result = await searchKnowledge(query, { domain });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
