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
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

        {/* Clientes ativos */}
        <Section
          title={`Clientes ativos (${activeClients.length})`}
          action={
            <Link
              href="/dashboard/clients/new"
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: "rgba(124,196,250,0.1)",
                color: "var(--cyan)",
                border: "1px solid rgba(124,196,250,0.25)",
                borderRadius: "6px",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {activeClients.map((client) => (
                <ResourceCard
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  title={client.company}
                  subtitle={`${client.name} · ${client.niche}`}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Status + projects count */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <StatusBadge value={client.status} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        {client.projects.length} projeto(s)
                      </span>
                    </div>
                    {/* Active squads */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {client.squads_active.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                            borderRadius: "4px",
                            padding: "2px 7px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {s.replace("-squad", "").replace("-masters", "").replace("c-level", "c-level")}
                        </span>
                      ))}
                    </div>
                  </div>
                </ResourceCard>
              ))}
            </div>
          )}
        </Section>

        {/* Pausados / Concluídos */}
        {otherClients.length > 0 && (
          <Section title="Pausados / Concluídos">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
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
