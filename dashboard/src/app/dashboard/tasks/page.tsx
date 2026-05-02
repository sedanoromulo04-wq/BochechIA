import { DashboardShell, ModelBadge, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { getTaskCatalog } from "@/lib/tasks";

export default async function TasksPage() {
  const tasks = await getTaskCatalog();

  // Group tasks by squad
  const bySquad = tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
    const key = task.squadName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <DashboardShell
      title="Catalogo de tarefas"
      description="Esta tela ainda nao mostra execucoes em tempo real. Ela lista as tarefas disponiveis nos squads e o modelo estimado pelo roteador atual para tarefas sem dados sensiveis."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Summary bar */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}>
          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Total
            </span>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, marginTop: "4px" }}>
              {tasks.length}
            </p>
          </div>
          <div style={{ width: "1px", height: "40px", background: "var(--border)" }} />
          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Squads
            </span>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, marginTop: "4px" }}>
              {Object.keys(bySquad).length}
            </p>
          </div>
        </div>

        {/* All tasks flat view */}
        <Section
          title="Tarefas por squad"
          description="Boa base para conectar futuras runs, aprovacoes e custos."
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {tasks.map((task) => (
              <ResourceCard
                key={task.id}
                title={task.title}
                subtitle={`${task.squadName} · ${task.fileName}`}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <StatusBadge value={task.squadId} />
                  <ModelBadge model={task.estimatedModel} />
                </div>
              </ResourceCard>
            ))}
            {tasks.length === 0 && (
              <div style={{
                gridColumn: "1 / -1",
                background: "var(--bg-card)",
                border: "1px dashed var(--border)",
                borderRadius: "10px",
                padding: "40px 24px",
                textAlign: "center",
              }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Nenhuma tarefa encontrada nos manifests
                </p>
              </div>
            )}
          </div>
        </Section>

      </div>
    </DashboardShell>
  );
}
