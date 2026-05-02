import { DashboardShell, EmptyState, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { getBrainStore, listConnectors } from "@/lib/knowledge-store";

export default async function ConnectorsPage() {
  const [connectors, store] = await Promise.all([listConnectors(), getBrainStore()]);

  return (
    <DashboardShell
      title="Connectors"
      description="Conectores, jobs de sync e pontos de integração do cérebro com o ambiente operacional."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

        {/* Connectors */}
        <Section
          title="Connectors"
          description="Integrações planejadas ou ativas do workspace."
        >
          {connectors.length === 0 ? (
            <EmptyState
              title="Nenhum conector configurado"
              body="Os conectores alimentam a base de conhecimento com dados externos."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {connectors.map((connector) => (
                <ResourceCard
                  key={connector.id}
                  title={connector.name}
                  subtitle={connector.description}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <StatusBadge value={connector.status} />
                    <StatusBadge value={connector.kind} />
                  </div>
                </ResourceCard>
              ))}
            </div>
          )}
        </Section>

        {/* Sync jobs */}
        <Section
          title="Sync jobs"
          description="Jobs de sincronização que futuramente alimentarão a base própria."
        >
          {store.syncJobs.length === 0 ? (
            <EmptyState
              title="Nenhum sync job ativo"
              body="Os conectores ainda estão em fase de fundação do cérebro."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {store.syncJobs.map((job) => (
                <ResourceCard
                  key={job.id}
                  title={job.connectorId}
                  subtitle={`${job.recordsProcessed} registros processados`}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <StatusBadge value={job.status} />
                    {job.lastRunAt && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        Último sync: {new Date(job.lastRunAt).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                </ResourceCard>
              ))}
            </div>
          )}
        </Section>

      </div>
    </DashboardShell>
  );
}
