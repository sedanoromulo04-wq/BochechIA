import { NextRequest, NextResponse } from "next/server";
import type { ReviewRunInput } from "@/types/run";
import { approveRun, rejectRun, replyRun, dispatchRun } from "@/lib/engine";
import { getRunById } from "@/lib/runs-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const run = await getRunById(id);
    if (!run) return NextResponse.json({ error: "Run não encontrado" }, { status: 404 });
    return NextResponse.json(run);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/runs/:id
// action: "approve" | "reject" | "reply" | "dispatch"
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json()) as ReviewRunInput;

    if (!body.action || !["approve", "reject", "reply", "dispatch"].includes(body.action)) {
      return NextResponse.json(
        { error: 'action deve ser "approve", "reject", "reply" ou "dispatch"' },
        { status: 400 },
      );
    }

    if (body.action === "reply") {
      if (!body.replyText?.trim()) {
        return NextResponse.json({ error: "replyText é obrigatório" }, { status: 400 });
      }
      const run = await replyRun(id, body.replyText.trim());
      return NextResponse.json(run, { status: 202 });
    }

    if (body.action === "dispatch") {
      if (!body.targetSquadId) {
        return NextResponse.json({ error: "targetSquadId é obrigatório" }, { status: 400 });
      }
      const child = await dispatchRun(id, body.targetSquadId, body.dispatchNote ?? "");
      return NextResponse.json(child, { status: 202 });
    }

    const run =
      body.action === "approve"
        ? await approveRun(id, body.approvedBy)
        : await rejectRun(id, body.rejectionReason ?? "Sem motivo informado");

    return NextResponse.json(run);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
