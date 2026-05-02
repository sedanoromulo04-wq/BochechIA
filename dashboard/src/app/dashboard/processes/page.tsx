import { DashboardShell, ModelBadge, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { listPolicies } from "@/lib/knowledge-store";
import { getAllSquads } from "@/lib/squads";
import { getTaskCatalog } from "@/lib/tasks";

export default async function ProcessesPage() {
  const [squads, tasks, policies] = await Promise.all([
    getAllSquads(),
    getTaskCatalog(),
    listPolicies(),
  ]);

  return (
    <DashboardShell
      title="Processes"
      description="Catálogo dos processos operacionais, workers disponíveis e políticas que governam a execução."
    >
      <div className="space-y-8">
        <Section title="Policies" description="Regras que definem privacidade, approvals e fallback do cérebro.">
          <div className="grid gap-4 lg:grid-cols-2">
            {policies.map((policy) => (
              <ResourceCard key={policy.id} title={policy.name} subtitle={policy.description}>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge value={policy.category} />
                  <StatusBadge value={policy.active ? "active" : "inactive"} />
                </div>
              </ResourceCard>
            ))}
          </div>
        </Section>

        <Section title="Workers por squad" description="Os squads permanecem como executores especializados do cérebro central.">
          <div className="grid gap-4 lg:grid-cols-2">
            {squads.map((squad) => (
              <ResourceCard key={squad.id} title={squad.short_title} subtitle={squad.description}>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="text-sm text-[var(--muted)]">
                      <span className="block text-foreground">{squad.components.agents.length}</span>
                      agentes
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      <span className="block text-foreground">{squad.components.tasks.length}</span>
                      processos
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {squad.routing?.tier_0 ? <ModelBadge model={squad.routing.tier_0} /> : null}
                    {squad.routing?.tier_1 ? <ModelBadge model={squad.routing.tier_1} /> : null}
                  </div>
                </div>
              </ResourceCard>
            ))}
          </div>
        </Section>

        <Section title={`Task catalog (${tasks.length})`} description="Processos explícitos disponíveis para planejamento e execução.">
          <div className="grid gap-4 lg:grid-cols-2">
            {tasks.map((task) => (
              <ResourceCard key={task.id} title={task.title} subtitle={`${task.squadName} · ${task.fileName}`}>
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge value={task.squadId} />
                  <ModelBadge model={task.estimatedModel} />
                </div>
              </ResourceCard>
            ))}
          </div>
        </Section>
      </div>
    </DashboardShell>
  );
}
