import { notFound } from "next/navigation";
import { DashboardShell, KeyValueList, Section, StatusBadge } from "@/components/dashboard/ui";
import { getClient } from "@/lib/clients";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientId } = await params;
  const client = await getClient(clientId);

  if (!client) notFound();

  return (
    <DashboardShell
      title={client.company}
      description={`Cliente ${client.name} · ${client.niche}`}
    >
      <div className="space-y-8">
        <Section title="Resumo" description="Snapshot do registry local para este cliente.">
          <KeyValueList
            items={[
              { label: "ID", value: client.id },
              { label: "Status", value: <StatusBadge value={client.status} /> },
              { label: "Mem0 user_id", value: <code>{client.mem0_user_id}</code> },
              { label: "Inicio", value: client.start_date ?? "Nao informado" },
            ]}
          />
        </Section>

        <Section title="Squads ativos" description="Alocacao atual prevista no registry.">
          <div className="flex flex-wrap gap-2">
            {client.squads_active.map((squadId) => (
              <StatusBadge key={squadId} value={squadId} />
            ))}
          </div>
        </Section>

        <Section title="Projetos" description="Projetos rastreados hoje para este cliente.">
          <div className="grid gap-4 lg:grid-cols-2">
            {client.projects.map((project) => (
              <div key={project.id} className="border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{project.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{project.squad}</p>
                  </div>
                  <StatusBadge value={project.status} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </DashboardShell>
  );
}
