import { DashboardShell, ModelBadge, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { getTaskCatalog } from "@/lib/tasks";

export default async function TasksPage() {
  const tasks = await getTaskCatalog();

  return (
    <DashboardShell
      title="Catalogo de tarefas"
      description="Esta tela ainda nao mostra execucoes em tempo real. Ela lista as tarefas disponiveis nos squads e o modelo estimado pelo roteador atual para tarefas sem dados sensiveis."
    >
      <Section
        title="Tarefas por squad"
        description="Boa base para conectar futuras runs, aprovacoes e custos."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {tasks.map((task) => (
            <ResourceCard
              key={task.id}
              title={task.title}
              subtitle={`${task.squadName} · ${task.fileName}`}
            >
              <div className="flex items-center justify-between gap-3">
                <StatusBadge value={task.squadId} />
                <ModelBadge model={task.estimatedModel} />
              </div>
            </ResourceCard>
          ))}
        </div>
      </Section>
    </DashboardShell>
  );
}
