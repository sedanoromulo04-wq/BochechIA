import { NextResponse } from "next/server";
import { getBrainStore, listEvalSets } from "@/lib/knowledge-store";

export async function GET() {
  try {
    const [store, evalSets] = await Promise.all([getBrainStore(), listEvalSets()]);
    const avgConfidence =
      store.retrievalMetrics.length > 0
        ? store.retrievalMetrics.reduce((sum, metric) => sum + metric.confidence, 0) / store.retrievalMetrics.length
        : 0;

    return NextResponse.json({
      evalSets,
      retrievalMetricsCount: store.retrievalMetrics.length,
      avgRetrievalConfidence: Number(avgConfidence.toFixed(3)),
      pendingApprovals: store.approvals.filter((approval) => approval.status === "pending").length,
      decisionsLogged: store.decisionRecords.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
