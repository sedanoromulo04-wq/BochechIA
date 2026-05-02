import { DashboardShell, EmptyState, ResourceCard, Section, StatCard } from "@/components/dashboard/ui";
import { getBrainStore, listEvalSets } from "@/lib/knowledge-store";

export default async function EvalsPage() {
  const [store, evalSets] = await Promise.all([getBrainStore(), listEvalSets()]);
  const avgConfidence =
    store.retrievalMetrics.length > 0
      ? store.retrievalMetrics.reduce((sum, metric) => sum + metric.confidence, 0) / store.retrievalMetrics.length
      : 0;

  return (
    <DashboardShell
      title="Evals"
      description="Medições iniciais do cérebro: retrieval, citações, approvals e qualidade operacional."
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Eval sets" value={evalSets.length} detail="Conjuntos de avaliação registrados no workspace." />
          <StatCard label="Retrieval metrics" value={store.retrievalMetrics.length} detail="Consultas já medidas pelo motor híbrido." />
          <StatCard label="Avg confidence" value={avgConfidence.toFixed(3)} detail="Confiança média de recuperação registrada." />
        </section>

        <Section title="Eval catalog" description="Espaço reservado para os cenários de avaliação contínua do cérebro.">
          {evalSets.length === 0 ? (
            <EmptyState title="Nenhum eval set encontrado" body="Os conjuntos de avaliação aparecerão aqui conforme o cockpit amadurecer." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {evalSets.map((set) => (
                <ResourceCard key={set.id} title={set.name} subtitle={set.description} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardShell>
  );
}
