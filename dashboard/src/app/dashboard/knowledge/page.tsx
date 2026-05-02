import { KnowledgeSearchPanel, SourceIngestForm } from "@/components/dashboard/knowledge-actions";
import { DashboardShell, ResourceCard, Section, StatusBadge } from "@/components/dashboard/ui";
import { listFacts, listKnowledgeSources } from "@/lib/knowledge-store";

export default async function KnowledgePage() {
  const [sources, facts] = await Promise.all([listKnowledgeSources(), listFacts()]);

  return (
    <DashboardShell
      title="Knowledge Base"
      description="Fonte da verdade operacional: documentos, fatos aprovados, indexação e busca."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

        {/* Ingest + Search panels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          <SourceIngestForm />
          <KnowledgeSearchPanel />
        </div>

        {/* Fontes indexadas */}
        <Section
          title={`Fontes indexadas (${sources.length})`}
          description="Cada fonte gera versões, chunks, fatos e proveniência para o cérebro."
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {sources.map((source) => (
              <ResourceCard
                key={source.id}
                title={source.title}
                subtitle={`${source.domain} · ${source.kind}`}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <StatusBadge value={source.status} />
                  <StatusBadge value={source.trustLevel} />
                </div>
              </ResourceCard>
            ))}
            {sources.length === 0 && (
              <div style={{
                gridColumn: "1 / -1",
                background: "var(--bg-card)",
                border: "1px dashed var(--border)",
                borderRadius: "10px",
                padding: "40px 24px",
                textAlign: "center",
              }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Nenhuma fonte indexada ainda
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* Fatos estruturados */}
        <Section
          title={`Fatos estruturados (${facts.length})`}
          description="Claims aprovadas extraídas dos documentos e utilizadas no retrieval estruturado."
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {facts.slice(0, 20).map((fact) => (
              <ResourceCard
                key={fact.id}
                title={fact.subject}
                subtitle={`${fact.type} · confiança ${fact.confidence.toFixed(2)}`}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {fact.claim}
                </p>
              </ResourceCard>
            ))}
            {facts.length === 0 && (
              <div style={{
                gridColumn: "1 / -1",
                background: "var(--bg-card)",
                border: "1px dashed var(--border)",
                borderRadius: "10px",
                padding: "40px 24px",
                textAlign: "center",
              }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Nenhum fato estruturado ainda
                </p>
              </div>
            )}
          </div>
        </Section>

      </div>
    </DashboardShell>
  );
}
