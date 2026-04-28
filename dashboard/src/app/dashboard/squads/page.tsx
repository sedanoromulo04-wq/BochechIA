import { DashboardShell, ModelBadge, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { getAllSquads } from "@/lib/squads";

export default async function SquadsPage() {
  const squads = await getAllSquads();

  return (
    <DashboardShell
      title="Squads"
      description="Catalogo dos squads top-level reconhecidos pelo dashboard. Cada card deriva diretamente do manifest e serve como ponto de entrada para auditoria estrutural."
    >
      <Section
        title="Todos os squads"
        description="A contagem de agentes, tarefas e workflows ja e lida dos manifests existentes."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {squads.map((squad) => (
            <ResourceCard
              key={squad.id}
              href={`/dashboard/squads/${squad.id}`}
              title={squad.short_title}
              subtitle={squad.description}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(squad.tags ?? []).slice(0, 5).map((tag) => (
                    <StatusBadge key={tag} value={tag} />
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="text-sm text-[var(--muted)]">
                    <span className="block text-foreground">{squad.components.agents.length}</span>
                    agentes
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    <span className="block text-foreground">{squad.components.tasks?.length ?? 0}</span>
                    tarefas
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    <span className="block text-foreground">{squad.components.workflows?.length ?? 0}</span>
                    workflows
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    <span className="block text-foreground">{squad.components.checklists?.length ?? 0}</span>
                    checklists
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {squad.routing?.tier_0 ? <ModelBadge model={squad.routing.tier_0} /> : null}
                  {squad.routing?.tier_1 ? <ModelBadge model={squad.routing.tier_1} /> : null}
                </div>
              </div>
            </ResourceCard>
          ))}
        </div>
      </Section>
    </DashboardShell>
  );
}
