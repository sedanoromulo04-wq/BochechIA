import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardShell, EmptyState, KeyValueList, Section, StatusBadge, ModelBadge } from "@/components/dashboard/ui";
import { getClient } from "@/lib/clients";
import { getRunsByClient } from "@/lib/runs-store";
import { listDocumentsByProject } from "@/lib/knowledge-store";
import { ProjectStatusForm } from "@/components/dashboard/project-actions";
import { IngestDocumentForm } from "@/components/dashboard/document-actions";

function RunDate({ iso }: { iso?: string }) {
  if (!iso) return <span>—</span>;
  return (
    <time suppressHydrationWarning dateTime={iso}>
      {new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })}
    </time>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ client: string; project: string }>;
}) {
  const { client: clientId, project: projectId } = await params;

  const [client, allRuns, projectDocs] = await Promise.all([
    getClient(clientId),
    getRunsByClient(clientId),
    listDocumentsByProject(clientId, projectId),
  ]);

  if (!client) notFound();
  const project = client.projects.find((p) => p.id === projectId);
  if (!project) notFound();

  const projectRuns = allRuns.filter((r) => r.projectId === projectId);
  const pendingRuns = projectRuns.filter((r) => r.status === "pending" || r.status === "running");
  const reviewRuns  = projectRuns.filter((r) => r.status === "awaiting_approval");
  const doneRuns    = projectRuns.filter((r) => !["pending", "running", "awaiting_approval"].includes(r.status));

  const totalTokens = projectRuns.reduce((sum, r) => sum + (r.inputTokens ?? 0) + (r.outputTokens ?? 0), 0);
  const totalCost   = projectRuns.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);

  return (
    <DashboardShell
      title={project.name}
      description={`${client.company} · ${project.squad}`}
    >
      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/dashboard/clients" className="hover:text-foreground transition">Clientes</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${clientId}`} className="hover:text-foreground transition">{client.company}</Link>
          <span>/</span>
          <span className="text-foreground">{project.name}</span>
        </nav>

        {/* Resumo */}
        <Section title="Resumo do Projeto">
          <div className="grid gap-4 lg:grid-cols-2">
            <KeyValueList
              items={[
                { label: "ID", value: <code className="text-xs">{project.id}</code> },
                { label: "Status", value: <ProjectStatusForm clientId={clientId} projectId={projectId} current={project.status} /> },
                { label: "Squad responsável", value: project.squad },
                { label: "Criado em", value: <RunDate iso={project.createdAt} /> },
              ]}
            />
            <KeyValueList
              items={[
                { label: "Runs totais", value: projectRuns.length },
                { label: "Tokens consumidos", value: totalTokens.toLocaleString("pt-BR") },
                { label: "Custo estimado", value: `$${totalCost.toFixed(4)}` },
                { label: "Aguardando revisão", value: reviewRuns.length },
              ]}
            />
          </div>

          {(project.description || project.objective) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {project.description && (
                <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-sm text-[var(--muted)]">Descrição</p>
                  <p className="mt-2 text-sm leading-6">{project.description}</p>
                </div>
              )}
              {project.objective && (
                <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-sm text-[var(--muted)]">Objetivo</p>
                  <p className="mt-2 text-sm leading-6">{project.objective}</p>
                </div>
              )}
            </div>
          )}

          {project.tags && project.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span key={tag} className="text-xs border border-[var(--border)] px-2 py-0.5 text-[var(--muted)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Ação rápida */}
        <Section
          title="Nova demanda neste projeto"
          description="Cria um run já vinculado a este projeto."
          action={
            <Link
              href={`/dashboard/runs?clientId=${clientId}&projectId=${projectId}&squadId=${project.squad}`}
              className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white transition hover:opacity-90"
            >
              + Criar demanda
            </Link>
          }
        >
          <p className="text-sm text-[var(--muted)]">
            Use o botão acima para abrir a central de runs com cliente e projeto pré-selecionados.
          </p>
        </Section>

        {/* Runs aguardando aprovação */}
        {reviewRuns.length > 0 && (
          <Section
            title={`Aguardando aprovação (${reviewRuns.length})`}
            description="Agentes concluíram. Acesse Runs para revisar."
          >
            <div className="space-y-3">
              {reviewRuns.map((run) => (
                <div key={run.id} className="border border-[var(--warning)] bg-[var(--surface)] p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium truncate">{run.prompt}</p>
                    <p className="text-xs text-[var(--muted)]"><RunDate iso={run.createdAt} /></p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ModelBadge model={run.modelId} />
                    <Link
                      href="/dashboard/runs"
                      className="text-xs border border-[var(--border)] px-2 py-1 hover:border-[var(--accent)] transition"
                    >
                      Revisar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Runs em execução */}
        {pendingRuns.length > 0 && (
          <Section title={`Em execução (${pendingRuns.length})`}>
            <div className="space-y-3">
              {pendingRuns.map((run) => (
                <div key={run.id} className="border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--accent)]">
                        <span className="animate-pulse">●</span> processando
                      </span>
                      <StatusBadge value={run.status} />
                    </div>
                    <p className="text-sm truncate">{run.prompt}</p>
                  </div>
                  <ModelBadge model={run.modelId} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Documentos e transcrições */}
        <Section
          title={`Documentos e transcrições (${projectDocs.length})`}
          description="Fontes indexadas no knowledge layer com escopo exclusivo deste projeto."
          action={<IngestDocumentForm clientId={clientId} projectId={projectId} />}
        >
          {projectDocs.length === 0 ? (
            <EmptyState
              title="Nenhum documento indexado ainda"
              body="Ingira transcrições de reuniões, briefings e documentos do cliente. O cérebro usará essas fontes ao executar runs deste projeto."
            />
          ) : (
            <div className="space-y-3">
              {projectDocs.map(({ source, document }) => (
                <div key={source.id} className="border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium">{source.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {source.kind} · domínio: {source.domain}
                        {source.tags.length > 0 && ` · ${source.tags.join(", ")}`}
                      </p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <span className="inline-flex items-center border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">
                        {source.status}
                      </span>
                      <p className="text-xs text-[var(--muted)]">
                        {new Date(source.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {source.metadata?.tokenCount !== undefined && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {(source.metadata.tokenCount as number).toLocaleString("pt-BR")} tokens indexados
                      · doc ID: <code className="text-xs">{document?.id ?? "—"}</code>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Histórico */}
        <Section title="Histórico de runs" description="Todas as demandas finalizadas neste projeto.">
          {doneRuns.length === 0 ? (
            <EmptyState
              title="Nenhum run finalizado ainda"
              body="Os runs aprovados ou rejeitados aparecerão aqui com o histórico completo."
            />
          ) : (
            <div className="space-y-3">
              {doneRuns.map((run) => (
                <div key={run.id} className="border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge value={run.status} />
                        <span className="text-xs text-[var(--muted)]">{run.squadId}</span>
                      </div>
                      <p className="text-sm leading-5 text-[var(--muted)] truncate max-w-xl">{run.prompt}</p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <ModelBadge model={run.modelId} />
                      {run.costUsd !== undefined && (
                        <p className="text-xs text-[var(--muted)]">${run.costUsd.toFixed(5)}</p>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    <RunDate iso={run.createdAt} />
                    {run.approvedBy && ` · aprovado por ${run.approvedBy}`}
                    {run.rejectionReason && ` · rejeitado: ${run.rejectionReason}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardShell>
  );
}
