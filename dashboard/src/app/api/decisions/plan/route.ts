import { NextRequest, NextResponse } from "next/server";
import type { CreateRunInput } from "@/types/run";
import { buildExecutionPlan } from "@/lib/policy-engine";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateRunInput;
    if (!body.clientId || !body.squadId || !body.prompt) {
      return NextResponse.json(
        { error: "Campos obrigatórios: clientId, squadId, prompt" },
        { status: 400 },
      );
    }
    const plan = await buildExecutionPlan(body);
    return NextResponse.json(plan);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
