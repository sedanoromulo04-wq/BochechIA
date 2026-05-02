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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {squads.map((squad) => (
            <ResourceCard
              key={squad.id}
              href={`/dashboard/squads/${squad.id}`}
              title={squad.short_title}
              subtitle={squad.description}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(squad.tags ?? []).slice(0, 5).map((tag) => (
                    <StatusBadge key={tag} value={tag} />
                  ))}
                </div>

                {/* Counters */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { count: squad.components.agents.length, label: "agentes" },
                    { count: squad.components.tasks?.length ?? 0, label: "tarefas" },
                    { count: squad.components.workflows?.length ?? 0, label: "workflows" },
                    { count: squad.components.checklists?.length ?? 0, label: "checklists" },
                  ].map(({ count, label }) => (
                    <div key={label} style={{
                      background: "rgba(124,196,250,0.04)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "8px 10px",
                    }}>
                      <span style={{
                        display: "block",
                        fontFamily: "var(--font-mono)",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        lineHeight: 1,
                        marginBottom: "4px",
                      }}>
                        {count}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                      }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Model badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
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
