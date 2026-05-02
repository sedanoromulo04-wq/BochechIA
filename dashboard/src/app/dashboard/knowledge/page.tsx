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
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-2">
          <SourceIngestForm />
          <KnowledgeSearchPanel />
        </div>

        <Section
          title={`Fontes indexadas (${sources.length})`}
          description="Cada fonte gera versões, chunks, fatos e proveniência para o cérebro."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {sources.map((source) => (
              <ResourceCard
                key={source.id}
                title={source.title}
                subtitle={`${source.domain} · ${source.kind}`}
              >
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={source.status} />
                  <StatusBadge value={source.trustLevel} />
                </div>
              </ResourceCard>
            ))}
          </div>
        </Section>

        <Section
          title={`Fatos estruturados (${facts.length})`}
          description="Claims aprovadas extraídas dos documentos e utilizadas no retrieval estruturado."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {facts.slice(0, 20).map((fact) => (
              <ResourceCard
                key={fact.id}
                title={fact.subject}
                subtitle={`${fact.type} · confiança ${fact.confidence.toFixed(2)}`}
              >
                <p className="text-sm text-[var(--muted)]">{fact.claim}</p>
              </ResourceCard>
            ))}
          </div>
        </Section>
      </div>
    </DashboardShell>
  );
}
