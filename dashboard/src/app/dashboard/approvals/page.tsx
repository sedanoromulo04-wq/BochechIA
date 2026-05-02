import Link from "next/link";
import { DashboardShell, EmptyState, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { listApprovals } from "@/lib/knowledge-store";
import { getAllRuns } from "@/lib/runs-store";

export default async function ApprovalsPage() {
  const [approvals, runs] = await Promise.all([listApprovals(), getAllRuns()]);

  return (
    <DashboardShell
      title="Approvals"
      description="Fila de aprovações humanas para outputs críticos, dados de cliente e ações sensíveis."
    >
      <Section
        title={`Pendentes (${approvals.filter((approval) => approval.status === "pending").length})`}
        description="O cérebro planeja e executa; o humano continua governando os checkpoints de risco."
        action={
          <Link className="text-sm font-medium text-[var(--accent)]" href="/dashboard/runs">
            Abrir runs
          </Link>
        }
      >
        {approvals.length === 0 ? (
          <EmptyState title="Nenhuma aprovação registrada ainda" body="Quando uma execução exigir validação humana, ela aparece aqui." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {approvals.map((approval) => {
              const run = runs.find((item) => item.id === approval.runId);
              return (
                <ResourceCard
                  key={approval.id}
                  title={run?.taskName ?? run?.squadId ?? approval.runId}
                  subtitle={approval.decisionRecordId}
                >
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      <StatusBadge value={approval.status} />
                      <StatusBadge value={run?.squadId ?? "run"} />
                    </div>
                    <p className="text-sm text-[var(--muted)]">Solicitado por {approval.requestedBy}</p>
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
