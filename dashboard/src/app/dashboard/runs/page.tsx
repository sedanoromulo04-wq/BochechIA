import {
  DashboardShell,
  EmptyState,
  ModelBadge,
  Section,
  StatusBadge,
} from "@/components/dashboard/ui";
import {
  CeoActions,
  ConversationThread,
  NewDemandForm,
  RunPoller,
} from "@/components/dashboard/run-actions";
import { getAllClients } from "@/lib/clients";
import { getAllRuns } from "@/lib/runs-store";
import { getAllSquads } from "@/lib/squads";
import { getTaskCatalog } from "@/lib/tasks";
import type { Run } from "@/types/run";

const SQUAD_LABELS: Record<string, string> = {
  "copy-squad":      "Copywriting",
  "brand-squad":     "Marca & Posicionamento",
  "hormozi-squad":   "Ofertas & Crescimento",
  "content-squad":   "Conteúdo & Storytelling",
  "traffic-masters": "Tráfego & Distribuição",
  "data-squad":      "Dados & Relatórios",
  "c-level-squad":   "Estratégia C-Level",
};

const STATUS_LABEL: Record<string, string> = {
  pending:           "Aguardando",
  running:           "Processando...",
  awaiting_approval: "Aguarda sua decisão",
  approved:          "Aprovado",
  rejected:          "Rejeitado",
  error:             "Erro",
};

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

function RunCard({
  run,
  squadOptions,
  allRuns,
}: {
  run: Run;
  squadOptions: Array<{ id: string; label: string }>;
  allRuns: Run[];
}) {
  const needsAction = run.status === "awaiting_approval";
  const isActive    = run.status === "pending" || run.status === "running";
  const children    = allRuns.filter((r) => run.childRunIds?.includes(r.id));
  const parent      = run.parentRunId ? allRuns.find((r) => r.id === run.parentRunId) : null;

  return (
    <div className={`border bg-[var(--surface)] ${
      needsAction ? "border-[var(--warning)]" : "border-[var(--border)]"
    }`}>
      {/* Cabeçalho */}
      <div className="p-5 space-y-4">
        {/* Breadcrumb de cadeia */}
        {parent && (
          <p className="text-xs text-[var(--muted)]">
            Despachado de: <span className="font-medium">{parent.squadId}</span>
          </p>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge value={run.status} label={STATUS_LABEL[run.status]} />
              <span className="text-xs text-[var(--muted)] border border-[var(--border)] px-2 py-0.5">
                {SQUAD_LABELS[run.squadId] ?? run.squadId}
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--accent)]">
                  <span className="animate-pulse">●</span> processando
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--muted)]">{run.clientId}</p>
          </div>
          <div className="text-right space-y-1 shrink-0">
            <ModelBadge model={run.modelId} />
            {run.costUsd !== undefined && (
              <p className="text-xs text-[var(--muted)]">${run.costUsd.toFixed(5)}</p>
            )}
          </div>
        </div>

        {/* Thread de conversa */}
        {run.messages && run.messages.length > 0 && (
          <ConversationThread messages={run.messages} />
        )}

        {/* Erro */}
        {run.error && (
          <div className="border border-[var(--danger)] bg-[color:color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--danger)] mb-1">Erro na execução</p>
            <p className="text-sm text-[var(--danger)]">{run.error}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <div className="flex gap-4 flex-wrap">
            <span>Criado: <RunDate iso={run.createdAt} /></span>
            {run.finishedAt && <span>Finalizado: <RunDate iso={run.finishedAt} /></span>}
            {run.inputTokens !== undefined && (
              <span>{((run.inputTokens) + (run.outputTokens ?? 0)).toLocaleString()} tokens totais</span>
            )}
            {run.mem0Loaded && <span className="text-[var(--accent)]">memória carregada</span>}
          </div>
          {run.approvedAt && (
            <span className="text-[var(--success)]">
              Aprovado por {run.approvedBy ?? "ceo"} · <RunDate iso={run.approvedAt} />
            </span>
          )}
          {run.rejectionReason && (
            <span className="text-[var(--danger)]">Rejeitado: {run.rejectionReason}</span>
          )}
        </div>

        {/* Ações CEO — só quando aguarda decisão */}
        {needsAction && (
          <CeoActions runId={run.id} squadOptions={squadOptions} />
        )}
      </div>

      {/* Runs filhos (cadeia de handoff) */}
      {children.length > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-3">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-2">
            Despachado para
          </p>
          <div className="space-y-2">
            {children.map((child) => (
              <div key={child.id} className="flex items-center gap-3 text-sm">
                <StatusBadge value={child.status} label={STATUS_LABEL[child.status]} />
                <span className="font-medium">{SQUAD_LABELS[child.squadId] ?? child.squadId}</span>
                <span className="text-[var(--muted)]">
                  {child.messages?.length ?? 0} mensagens
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function RunsPage() {
  const [runs, clients, squads, taskCatalog] = await Promise.all([
    getAllRuns(),
    getAllClients(),
    getAllSquads(),
    getTaskCatalog(),
  ]);

  const toReview  = runs.filter((r) => r.status === "awaiting_approval");
  const active    = runs.filter((r) => r.status === "pending" || r.status === "running");
  const history   = runs.filter((r) => !["pending", "running", "awaiting_approval"].includes(r.status));
  const activeIds = active.map((r) => r.id);

  const clientOptions = clients.map((c) => ({ id: c.id, company: c.company }));
  const squadOptions  = squads.map((s) => ({
    id: s.id,
    short_title: s.short_title,
  }));
  const taskOptions = taskCatalog.map((t) => ({ slug: t.slug, title: t.title, squadId: t.squadId }));

  // Squad options para o painel de dispatch (com label legível)
  const dispatchOptions = squads.map((s) => ({
    id: s.id,
    label: SQUAD_LABELS[s.id] ?? s.short_title,
  }));

  return (
    <DashboardShell
      title="Central de Operações"
      description="Envie demandas, converse com os agentes, aprove resultados e despache para o próximo squad."
    >
      <RunPoller activeIds={activeIds} />

      <div className="space-y-8">
        <NewDemandForm clients={clientOptions} squads={squadOptions} tasks={taskOptions} />

        {toReview.length > 0 && (
          <Section
            title={`Aguardando sua decisão (${toReview.length})`}
            description="Os agentes concluíram. Responda, aprove ou despache para o próximo squad."
          >
            <div className="space-y-4">
              {toReview.map((run) => (
                <RunCard key={run.id} run={run} squadOptions={dispatchOptions} allRuns={runs} />
              ))}
            </div>
          </Section>
        )}

        {active.length > 0 && (
          <Section
            title={`Em execução (${active.length})`}
            description="A página atualiza automaticamente quando os agentes terminam."
          >
            <div className="space-y-4">
              {active.map((run) => (
                <RunCard key={run.id} run={run} squadOptions={dispatchOptions} allRuns={runs} />
              ))}
            </div>
          </Section>
        )}

        <Section title="Histórico" description="Todas as demandas finalizadas.">
          {history.length === 0 ? (
            <EmptyState
              title="Nenhuma demanda finalizada ainda"
              body="Após aprovação ou rejeição, as demandas aparecem aqui."
            />
          ) : (
            <div className="space-y-4">
              {history.map((run) => (
                <RunCard key={run.id} run={run} squadOptions={dispatchOptions} allRuns={runs} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardShell>
  );
}
