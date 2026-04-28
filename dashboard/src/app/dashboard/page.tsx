import Link from "next/link";
import {
  DashboardShell,
  ResourceCard,
  Section,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/ui";
import { getAllClients } from "@/lib/clients";
import { getAllRuns } from "@/lib/runs-store";
import { getAllSquads } from "@/lib/squads";
import { getTaskCatalog } from "@/lib/tasks";

export default async function DashboardPage() {
  const [squads, clients, tasks, runs] = await Promise.all([
    getAllSquads(),
    getAllClients(),
    getTaskCatalog(),
    getAllRuns(),
  ]);

  const activeClients = clients.filter((client) => client.status === "active");
  const pendingApproval = runs.filter((r) => r.status === "awaiting_approval");
  const totalCost = runs.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);

  return (
    <DashboardShell
      title="Visao geral operacional"
      description="Painel do BochechIA — squads, clientes, runs e aprovacoes humanas em um lugar so."
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Squads ativos"
            value={squads.length}
            detail="Lidos diretamente de squads/*/squad.yaml."
          />
          <StatCard
            label="Clientes ativos"
            value={activeClients.length}
            detail="Base para os fluxos com Mem0 e execucao real."
          />
          <StatCard
            label="Aguardando aprovacao"
            value={pendingApproval.length}
            detail={pendingApproval.length > 0 ? "Acesse Runs para revisar." : "Nenhum run pendente."}
          />
          <StatCard
            label="Custo total"
            value={`$${totalCost.toFixed(4)}`}
            detail={`${runs.length} run(s) registrado(s).`}
          />
        </section>

        <Section
          title="Squads"
          description="Visao rapida dos squads principais, com foco em cobertura operacional e campos obrigatorios."
          action={
            <Link className="text-sm font-medium text-[var(--accent)]" href="/dashboard/squads">
              Ver todos os squads
            </Link>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {squads.map((squad) => (
              <ResourceCard
                key={squad.id}
                href={`/dashboard/squads/${squad.id}`}
                title={squad.short_title}
                subtitle={squad.description}
              >
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={squad.routing ? "ready" : "incomplete"} />
                  <StatusBadge value={squad.mem0 ? "mem0" : "no-mem0"} />
                  <StatusBadge value={squad.privacy ? "privacy" : "no-privacy"} />
                </div>
              </ResourceCard>
            ))}
          </div>
        </Section>

        <Section
          title="Clientes"
          description="O registry atual ainda e local, mas ja estrutura status, squads ativos e projetos por cliente."
          action={
            <Link className="text-sm font-medium text-[var(--accent)]" href="/dashboard/clients">
              Abrir clientes
            </Link>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {clients.map((client) => (
              <ResourceCard
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                title={client.company}
                subtitle={`${client.name} · ${client.niche}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge value={client.status} />
                  <span className="text-sm text-[var(--muted)]">
                    {client.projects.length} projeto(s)
                  </span>
                </div>
              </ResourceCard>
            ))}
          </div>
        </Section>

        {pendingApproval.length > 0 && (
          <Section
            title={`Aprovacoes pendentes (${pendingApproval.length})`}
            description="Runs que geraram output e aguardam revisao humana."
            action={
              <Link className="text-sm font-medium text-[var(--accent)]" href="/dashboard/runs">
                Ver runs
              </Link>
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {pendingApproval.slice(0, 4).map((run) => (
                <ResourceCard
                  key={run.id}
                  href="/dashboard/runs"
                  title={run.taskName}
                  subtitle={`${run.clientId} · ${run.squadId} · ${run.modelId}`}
                >
                  <StatusBadge value={run.status} />
                </ResourceCard>
              ))}
            </div>
          </Section>
        )}
      </div>
    </DashboardShell>
  );
}