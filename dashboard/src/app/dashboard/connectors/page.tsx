import { DashboardShell, EmptyState, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { getBrainStore, listConnectors } from "@/lib/knowledge-store";

export default async function ConnectorsPage() {
  const [connectors, store] = await Promise.all([listConnectors(), getBrainStore()]);

  return (
    <DashboardShell
      title="Connectors"
      description="Conectores, jobs de sync e pontos de integração do cérebro com o ambiente operacional."
    >
      <div className="space-y-8">
        <Section title="Connectors" description="Integrações planejadas ou ativas do workspace.">
          <div className="grid gap-4 lg:grid-cols-2">
            {connectors.map((connector) => (
              <ResourceCard key={connector.id} title={connector.name} subtitle={connector.description}>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge value={connector.status} />
                  <StatusBadge value={connector.kind} />
                </div>
              </ResourceCard>
            ))}
          </div>
        </Section>

        <Section title="Sync jobs" description="Jobs de sincronização que futuramente alimentarão a base própria.">
          {store.syncJobs.length === 0 ? (
            <EmptyState title="Nenhum sync job ativo" body="Os conectores ainda estão em fase de fundação do cérebro." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {store.syncJobs.map((job) => (
                <ResourceCard key={job.id} title={job.connectorId} subtitle={`${job.recordsProcessed} registros processados`}>
                  <StatusBadge value={job.status} />
                </ResourceCard>
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardShell>
  );
}
