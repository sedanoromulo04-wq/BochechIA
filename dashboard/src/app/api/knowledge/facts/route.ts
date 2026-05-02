import { NextResponse } from "next/server";
import { listFacts } from "@/lib/knowledge-store";

export async function GET() {
  try {
    const facts = await listFacts();
    return NextResponse.json(facts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
