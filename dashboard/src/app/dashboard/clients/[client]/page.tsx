import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell, KeyValueList, Section, StatusBadge } from "@/components/dashboard/ui";
import { getClient } from "@/lib/clients";
import { NewProjectForm } from "@/components/dashboard/project-actions";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: clientId } = await params;
  const client = await getClient(clientId);

  if (!client) notFound();

  const STATUS_LABEL: Record<string, string> = {
    pending:   "Pendente",
    active:    "Ativo",
    review:    "Em revisão",
    completed: "Concluído",
    paused:    "Pausado",
  };

  return (
    <DashboardShell
      title={client.company}
      description={`Cliente ${client.name} · ${client.niche}`}
    >
      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/dashboard/clients" className="hover:text-foreground transition">Clientes</Link>
          <span>/</span>
          <span className="text-foreground">{client.company}</span>
        </nav>

        <Section title="Resumo" description="Snapshot do registry local para este cliente.">
          <KeyValueList
            items={[
              { label: "ID", value: <code className="text-xs">{client.id}</code> },
              { label: "Status", value: <StatusBadge value={client.status} /> },
              { label: "Mem0 user_id", value: <code className="text-xs">{client.mem0_user_id}</code> },
              { label: "Início", value: client.start_date ?? "Não informado" },
            ]}
          />
        </Section>

        <Section title="Squads ativos" description="Alocação atual prevista no registry.">
          <div className="flex flex-wrap gap-2">
            {client.squads_active.map((squadId) => (
              <StatusBadge key={squadId} value={squadId} />
            ))}
          </div>
        </Section>

        <Section
          title="Projetos"
          description="Projetos rastreados para este cliente. Cada projeto agrega seus runs e documentos."
          action={
            <NewProjectForm clientId={clientId} squads={client.squads_active} />
          }
        >
          {client.projects.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8">
              <h3 className="text-base font-semibold">Nenhum projeto cadastrado</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Crie o primeiro projeto para começar a organizar as demandas deste cliente.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {client.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/clients/${clientId}/projects/${project.id}`}
                  className="block border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base font-semibold">{project.name}</h3>
                      <p className="text-sm text-[var(--muted)]">{project.squad}</p>
                      {project.description && (
                        <p className="text-xs text-[var(--muted)] truncate">{project.description}</p>
                      )}
                    </div>
                    <StatusBadge value={project.status} label={STATUS_LABEL[project.status]} />
                  </div>
                  {project.tags && project.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-xs border border-[var(--border)] px-2 py-0.5 text-[var(--muted)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardShell>
  );
}
