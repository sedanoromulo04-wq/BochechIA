import { NextRequest, NextResponse } from "next/server";
import { approveRun, rejectRun } from "@/lib/engine";
import { getRunById } from "@/lib/runs-store";
import { getApprovalRequest } from "@/lib/knowledge-store";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      action?: "approve" | "reject";
      respondedBy?: string;
      reason?: string;
    };

    if (!body.action) {
      return NextResponse.json({ error: "action é obrigatório" }, { status: 400 });
    }

    const approval = await getApprovalRequest(id);
    if (!approval) {
      return NextResponse.json({ error: "Approval não encontrado" }, { status: 404 });
    }
    const run = await getRunById(approval.runId);
    if (!run) {
      return NextResponse.json({ error: "Run vinculado não encontrado" }, { status: 404 });
    }

    const result = body.action === "approve"
      ? await approveRun(run.id, body.respondedBy ?? "human")
      : await rejectRun(run.id, body.reason ?? "Sem motivo informado");

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
