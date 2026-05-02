import { notFound } from "next/navigation";
import { DashboardShell, KeyValueList, ModelBadge, Section, StatusBadge } from "@/components/dashboard/ui";
import { getSquad } from "@/lib/squads";

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  marginBottom: "10px",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "18px 20px",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "10px",
};

const codeItem: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  color: "var(--text-primary)",
  padding: "5px 8px",
  background: "rgba(124,196,250,0.04)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  display: "block",
};

import React from "react";

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ squad: string }>;
}) {
  const { squad: squadId } = await params;
  const squad = await getSquad(squadId);

  if (!squad) notFound();

  return (
    <DashboardShell title={squad.short_title} description={squad.description}>
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Resumo */}
        <Section
          title="Resumo"
          description="Leitura direta do `squad.yaml` atual. Esta tela e util para verificar se o manifest esta pronto para orquestracao e dashboard."
        >
          <KeyValueList
            items={[
              { label: "ID", value: squad.id },
              { label: "Versao", value: squad.version },
              { label: "Path", value: <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)" }}>{squad.path}</code> },
              {
                label: "Tags",
                value: (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {squad.tags.map((tag) => (
                      <StatusBadge key={tag} value={tag} />
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </Section>

        {/* Componentes */}
        <Section title="Componentes" description="Inventario basico do squad.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {/* Agentes */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Agentes</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {squad.components.agents.map((agent) => (
                  <span key={agent} style={codeItem}>{agent}</span>
                ))}
              </div>
            </div>

            {/* Tarefas */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Tarefas</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(squad.components.tasks ?? []).map((task) => (
                  <span key={task} style={codeItem}>{task}</span>
                ))}
                {(squad.components.tasks ?? []).length === 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nenhuma tarefa</span>
                )}
              </div>
            </div>

            {/* Workflows */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Workflows</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(squad.components.workflows ?? []).map((workflow) => (
                  <span key={workflow} style={codeItem}>{workflow}</span>
                ))}
                {(squad.components.workflows ?? []).length === 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nenhum workflow</span>
                )}
              </div>
            </div>

            {/* Checklists */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Checklists</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(squad.components.checklists ?? []).map((checklist) => (
                  <span key={checklist} style={codeItem}>{checklist}</span>
                ))}
                {(squad.components.checklists ?? []).length === 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nenhum checklist</span>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Roteamento e memoria */}
        <Section
          title="Roteamento e memoria"
          description="Campos obrigatorios adicionados para sustentar a proxima camada de execucao."
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
            {/* Routing */}
            <div style={cardStyle}>
              <p style={monoLabel}>Routing</p>
              {squad.routing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {Object.entries(squad.routing).map(([key, value]) =>
                    value ? (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>{key}</span>
                        <ModelBadge model={value} />
                      </div>
                    ) : null,
                  )}
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nao configurado.</p>
              )}
            </div>

            {/* Mem0 */}
            <div style={cardStyle}>
              <p style={monoLabel}>Mem0</p>
              {squad.mem0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(squad.mem0.scope ?? []).map((item) => (
                      <StatusBadge key={item} value={item} />
                    ))}
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    load_on_start: {String(squad.mem0.load_on_start)} · save_on_complete:{" "}
                    {String(squad.mem0.save_on_complete)}
                  </p>
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nao configurado.</p>
              )}
            </div>

            {/* Privacy */}
            <div style={cardStyle}>
              <p style={monoLabel}>Privacy</p>
              {squad.privacy ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      client_data_model
                    </span>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", marginTop: "4px" }}>
                      {squad.privacy.client_data_model}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      internal_tasks_model
                    </span>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", marginTop: "4px" }}>
                      {squad.privacy.internal_tasks_model}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nao configurado.</p>
              )}
            </div>
          </div>
        </Section>

      </div>
    </DashboardShell>
  );
}
