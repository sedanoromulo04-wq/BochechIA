import { DashboardShell, EmptyState, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { listDecisionRecords } from "@/lib/knowledge-store";

export default async function DecisionsPage() {
  const decisions = await listDecisionRecords();

  return (
    <DashboardShell
      title="Decisions"
      description="Registro das decisões do cérebro: ação escolhida, confiança, políticas e evidências."
    >
      <Section title={`Decision log (${decisions.length})`} description="Toda decisão relevante precisa deixar trilha de evidência.">
        {decisions.length === 0 ? (
          <EmptyState title="Nenhuma decisão registrada ainda" body="Assim que o cérebro planejar ou executar, os registros aparecem aqui." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {decisions.map((decision) => (
              <ResourceCard
                key={decision.id}
                title={`${decision.processId} · ${decision.squadId}`}
                subtitle={`confiança ${decision.knowledgeConfidence.toFixed(3)} · ${decision.modelId}`}
              >
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <StatusBadge value={decision.status} />
                    <StatusBadge value={decision.action} />
                  </div>
                  <ul className="text-sm text-[var(--muted)] space-y-1">
                    {decision.rationale.slice(0, 3).map((line, index) => (
                      <li key={`${decision.id}-${index}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              </ResourceCard>
            ))}
          </div>
        )}
      </Section>
    </DashboardShell>
  );
}
