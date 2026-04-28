import { NextRequest, NextResponse } from "next/server";
import type { CreateRunInput } from "@/types/run";
import { createRun, executeRun } from "@/lib/engine";
import { getAllRuns } from "@/lib/runs-store";

// GET /api/runs — lista todos os runs (mais recentes primeiro)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    let runs = await getAllRuns();
    if (clientId) runs = runs.filter((r) => r.clientId === clientId);
    if (status) runs = runs.filter((r) => r.status === status);

    return NextResponse.json(runs);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/runs — cria e executa um run
// Body: CreateRunInput
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateRunInput;

    if (!body.clientId || !body.squadId || !body.prompt) {
      return NextResponse.json(
        { error: "Campos obrigatórios: clientId, squadId, prompt" },
        { status: 400 },
      );
    }

    // Cria o run (status: pending) e já dispara a execução.
    const run = await createRun(body);
    // executeRun é async mas não esperamos — retornamos o run criado imediatamente.
    // O cliente pode fazer polling em GET /api/runs/:id para acompanhar.
    executeRun(run.id).catch((err) => {
      console.error(`[engine] Run ${run.id} falhou:`, err);
    });

    return NextResponse.json(run, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
