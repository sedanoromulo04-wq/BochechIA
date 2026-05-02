import Link from "next/link";
import { DashboardShell, EmptyState, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { listApprovals } from "@/lib/knowledge-store";
import { getAllRuns } from "@/lib/runs-store";

export default async function ApprovalsPage() {
  const [approvals, runs] = await Promise.all([listApprovals(), getAllRuns()]);

  const pending = approvals.filter((approval) => approval.status === "pending");

  return (
    <DashboardShell
      title="Approvals"
      description="Fila de aprovações humanas para outputs críticos, dados de cliente e ações sensíveis."
    >
      <Section
        title={`Pendentes (${pending.length})`}
        description="O cérebro planeja e executa; o humano continua governando os checkpoints de risco."
        action={
          <Link
            href="/dashboard/runs"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--cyan)",
              textDecoration: "none",
              padding: "6px 14px",
              border: "1px solid rgba(124,196,250,0.2)",
              borderRadius: "6px",
              background: "rgba(124,196,250,0.06)",
              transition: "all 0.2s",
            }}
          >
            Abrir runs
          </Link>
        }
      >
        {approvals.length === 0 ? (
          <EmptyState
            title="Nenhuma aprovação registrada ainda"
            body="Quando uma execução exigir validação humana, ela aparece aqui."
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {approvals.map((approval) => {
              const run = runs.find((item) => item.id === approval.runId);
              return (
                <ResourceCard
                  key={approval.id}
                  title={run?.taskName ?? run?.squadId ?? approval.runId}
                  subtitle={approval.decisionRecordId}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      <StatusBadge value={approval.status} />
                      <StatusBadge value={run?.squadId ?? "run"} />
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                      Solicitado por {approval.requestedBy}
                    </p>
                  </div>
                </ResourceCard>
              );
            })}
          </div>
        )}
      </Section>
    </DashboardShell>
  );
}
