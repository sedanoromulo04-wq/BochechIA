import { DashboardShell, EmptyState, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { listDecisionRecords } from "@/lib/knowledge-store";

export default async function DecisionsPage() {
  const decisions = await listDecisionRecords();

  return (
    <DashboardShell
      title="Decisions"
      description="Registro das decisões do cérebro: ação escolhida, confiança, políticas e evidências."
    >
      <Section
        title={`Decision log (${decisions.length})`}
        description="Toda decisão relevante precisa deixar trilha de evidência."
      >
        {decisions.length === 0 ? (
          <EmptyState
            title="Nenhuma decisão registrada ainda"
            body="Assim que o cérebro planejar ou executar, os registros aparecem aqui."
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {decisions.map((decision) => (
              <ResourceCard
                key={decision.id}
                title={`${decision.processId} · ${decision.squadId}`}
                subtitle={`confiança ${decision.knowledgeConfidence.toFixed(3)} · ${decision.modelId}`}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Badges */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <StatusBadge value={decision.status} />
                    <StatusBadge value={decision.action} />
                  </div>

                  {/* Rationale lines */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {decision.rationale.slice(0, 3).map((line, index) => (
                      <div
                        key={`${decision.id}-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: "var(--border)", flexShrink: 0, marginTop: "1px" }}>›</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResourceCard>
            ))}
          </div>
        )}
      </Section>
    </DashboardShell>
  );
}
