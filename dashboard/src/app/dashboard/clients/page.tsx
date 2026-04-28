import Link from "next/link";
import { DashboardShell, EmptyState, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { getAllClients } from "@/lib/clients";

export default async function ClientsPage() {
  const clients = await getAllClients();

  const activeClients = clients.filter((c) => c.status === "active");
  const otherClients  = clients.filter((c) => c.status !== "active");

  return (
    <DashboardShell
      title="Clientes"
      description="Gerencie os clientes cadastrados e os projetos em andamento."
    >
      <div className="space-y-8">
        <Section
          title={`Clientes ativos (${activeClients.length})`}
          action={
            <Link
              href="/dashboard/clients/new"
              className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white transition hover:opacity-90"
            >
              + Novo cliente
            </Link>
          }
        >
          {activeClients.length === 0 ? (
            <EmptyState
              title="Nenhum cliente ativo ainda"
              body="Cadastre o primeiro cliente para começar a enviar demandas para os agentes."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeClients.map((client) => (
                <ResourceCard
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  title={client.company}
                  subtitle={`${client.name} · ${client.niche}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge value={client.status} />
                      <span className="text-sm text-[var(--muted)]">
                        {client.projects.length} projeto(s)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {client.squads_active.map((s) => (
                        <span key={s} className="text-xs border border-[var(--border)] px-2 py-0.5 text-[var(--muted)]">
                          {s.replace("-squad","").replace("-masters","").replace("c-level","c-level")}
                        </span>
                      ))}
                    </div>
                  </div>
                </ResourceCard>
              ))}
            </div>
          )}
        </Section>

        {otherClients.length > 0 && (
          <Section
            title="Pausados / Concluídos"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {otherClients.map((client) => (
                <ResourceCard
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  title={client.company}
                  subtitle={`${client.name} · ${client.niche}`}
                >
                  <StatusBadge value={client.status} />
                </ResourceCard>
              ))}
            </div>
          </Section>
        )}
      </div>
    </DashboardShell>
  );
}
