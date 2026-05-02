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
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
          <Link
            href="/dashboard/clients"
            style={{ color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Clientes
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span style={{ color: "var(--text-primary)" }}>{client.company}</span>
        </nav>

        {/* Resumo */}
        <Section title="Resumo" description="Snapshot do registry local para este cliente.">
          <KeyValueList
            items={[
              { label: "ID", value: <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)" }}>{client.id}</code> },
              { label: "Status", value: <StatusBadge value={client.status} /> },
              { label: "Mem0 user_id", value: <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)" }}>{client.mem0_user_id}</code> },
              { label: "Início", value: client.start_date ?? "Não informado" },
            ]}
          />
        </Section>

        {/* Squads ativos */}
        <Section title="Squads ativos" description="Alocação atual prevista no registry.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {client.squads_active.map((squadId) => (
              <StatusBadge key={squadId} value={squadId} />
            ))}
          </div>
        </Section>

        {/* Projetos */}
        <Section
          title="Projetos"
          description="Projetos rastreados para este cliente. Cada projeto agrega seus runs e documentos."
          action={<NewProjectForm clientId={clientId} squads={client.squads_active} />}
        >
          {client.projects.length === 0 ? (
            <div style={{
              background: "var(--bg-card)",
              border: "1px dashed var(--border)",
              borderRadius: "10px",
              padding: "40px 24px",
              textAlign: "center",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                Nenhum projeto cadastrado
              </h3>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                Crie o primeiro projeto para começar a organizar as demandas deste cliente.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {client.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/clients/${clientId}/projects/${project.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "18px 20px",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,196,250,0.3)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px rgba(124,196,250,0.08), 0 4px 24px rgba(124,196,250,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }}
                  >
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                          {project.name}
                        </h3>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                          {project.squad}
                        </p>
                        {project.description && (
                          <p style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {project.description}
                          </p>
                        )}
                      </div>
                      <StatusBadge value={project.status} label={STATUS_LABEL[project.status]} />
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
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
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

      </div>
    </DashboardShell>
  );
}
