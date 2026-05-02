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
import type { Run, RunStatus } from "@/types/run";

const SQUAD_LABELS: Record<string, string> = {
  "copy-squad": "Copywriting",
  "brand-squad": "Marca & Posicionamento",
  "hormozi-squad": "Ofertas & Crescimento",
  "content-squad": "Conteudo & Storytelling",
  "traffic-masters": "Trafego & Distribuicao",
  "data-squad": "Dados & Relatorios",
  "c-level-squad": "Estrategia C-Level",
  _orchestrator: "Orquestrador",
};

const STATUS_LABEL: Record<RunStatus, string> = {
  pending: "Na fila",
  running: "Em execucao",
  awaiting_approval: "Aguardando voce",
  approved: "Aprovado",
  rejected: "Rejeitado",
  error: "Erro",
};

const STATUS_COLUMN_CONFIG: Array<{
  status: RunStatus;
  title: string;
  description: string;
}> = [
  {
    status: "awaiting_approval",
    title: "Aprovacao",
    description: "Demandas bloqueadas esperando decisao humana.",
  },
  {
    status: "running",
    title: "Executando",
    description: "Runs em processamento agora.",
  },
  {
    status: "pending",
    title: "Fila",
    description: "Runs criados aguardando inicio da execucao.",
  },
  {
    status: "approved",
    title: "Concluido",
    description: "Entregas aprovadas e encerradas.",
  },
];

function RunDate({ iso }: { iso?: string }) {
  if (!iso) return <span>-</span>;
  return (
    <time suppressHydrationWarning dateTime={iso}>
      {new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </time>
  );
}

function formatTaskName(taskName?: string) {
  if (!taskName) return "Demanda aberta";
  return taskName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function summarizeBySquad(runs: Run[]) {
  return Object.entries(
    runs.reduce<Record<string, number>>((acc, run) => {
      acc[run.squadId] = (acc[run.squadId] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
}

function RunCard({
  run,
  squadOptions,
  allRuns,
  compact = false,
}: {
  run: Run;
  squadOptions: Array<{ id: string; label: string }>;
  allRuns: Run[];
  compact?: boolean;
}) {
  const needsAction = run.status === "awaiting_approval";
  const isActive = run.status === "pending" || run.status === "running";
  const children = allRuns.filter((r) => run.childRunIds?.includes(r.id));
  const parent = run.parentRunId ? allRuns.find((r) => r.id === run.parentRunId) : null;

  return (
    <div
      className={`border bg-[var(--surface)] ${
        needsAction ? "border-[var(--warning)]" : "border-[var(--border)]"
      } ${compact ? "shadow-[0_10px_24px_rgba(15,23,42,0.04)]" : ""}`}
    >
      <div className={`space-y-4 ${compact ? "p-4" : "p-5"}`}>
        {parent && (
          <p className="text-xs text-[var(--muted)]">
            Despachado de: <span className="font-medium">{SQUAD_LABELS[parent.squadId] ?? parent.squadId}</span>
          </p>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={run.status} label={STATUS_LABEL[run.status]} />
              <span className="border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">
                {SQUAD_LABELS[run.squadId] ?? run.squadId}
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--accent)]">
                  <span className="animate-pulse">●</span> ativo
                </span>
              )}
            </div>
            <p className="text-sm font-medium">{formatTaskName(run.taskName)}</p>
            <p className="text-sm text-[var(--muted)]">{run.clientId}</p>
          </div>

          <div className="space-y-1 text-right">
            <ModelBadge model={run.modelId} />
            {run.costUsd !== undefined && <p className="text-xs text-[var(--muted)]">${run.costUsd.toFixed(5)}</p>}
          </div>
        </div>

        {run.messages && run.messages.length > 0 && !compact && (
          <ConversationThread messages={run.messages} />
        )}

        {run.error && (
          <div className="border border-[var(--danger)] bg-[color:color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3">
            <p className="mb-1 text-xs font-medium text-[var(--danger)]">Erro na execucao</p>
            <p className="text-sm text-[var(--danger)]">{run.error}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <div className="flex flex-wrap gap-4">
            <span>Criado: <RunDate iso={run.createdAt} /></span>
            {run.finishedAt && <span>Finalizado: <RunDate iso={run.finishedAt} /></span>}
            {run.mem0Loaded && <span className="text-[var(--accent)]">memoria carregada</span>}
          </div>
          {run.approvedAt && (
            <span className="text-[var(--success)]">
              Aprovado por {run.approvedBy ?? "ceo"} · <RunDate iso={run.approvedAt} />
            </span>
          )}
          {run.rejectionReason && <span className="text-[var(--danger)]">Rejeitado: {run.rejectionReason}</span>}
        </div>

        {needsAction && !compact && <CeoActions runId={run.id} squadOptions={squadOptions} />}
      </div>

      {children.length > 0 && !compact && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Despachado para</p>
          <div className="space-y-2">
            {children.map((child) => (
              <div key={child.id} className="flex items-center gap-3 text-sm">
                <StatusBadge value={child.status} label={STATUS_LABEL[child.status]} />
                <span className="font-medium">{SQUAD_LABELS[child.squadId] ?? child.squadId}</span>
                <span className="text-[var(--muted)]">{child.messages?.length ?? 0} mensagens</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  title,
  description,
  status,
  runs,
  allRuns,
  squadOptions,
}: {
  title: string;
  description: string;
  status: RunStatus;
  runs: Run[];
  allRuns: Run[];
  squadOptions: Array<{ id: string; label: string }>;
}) {
  const squadSummary = summarizeBySquad(runs);

  return (
    <div className="flex min-w-[20rem] max-w-[24rem] flex-col border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
          </div>
          <span className="inline-flex min-w-10 justify-center bg-[var(--surface)] px-3 py-1 text-sm font-semibold">
            {runs.length}
          </span>
        </div>

        {squadSummary.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {squadSummary.slice(0, 4).map(([squadId, count]) => (
              <span
                key={`${status}-${squadId}`}
                className="inline-flex items-center gap-2 bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted)]"
              >
                <span className="font-medium text-foreground">{SQUAD_LABELS[squadId] ?? squadId}</span>
                <span>{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 p-4">
        {runs.length === 0 ? (
          <EmptyState title="Coluna vazia" body="Nenhuma sessao neste status agora." />
        ) : (
          runs.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              squadOptions={squadOptions}
              allRuns={allRuns}
              compact={status !== "awaiting_approval"}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default async function RunsPage({
  searchParams,
}: {
  searchParams?: Promise<{ clientId?: string; projectId?: string; squadId?: string }>;
}) {
  const sp = await (searchParams ?? Promise.resolve({} as { clientId?: string; projectId?: string; squadId?: string }));
  const [runs, clients, squads, taskCatalog] = await Promise.all([
    getAllRuns(),
    getAllClients(),
    getAllSquads(),
    getTaskCatalog(),
  ]);

  const activeIds = runs
    .filter((r) => r.status === "pending" || r.status === "running")
    .map((r) => r.id);

  const clientOptions = clients.map((c) => ({
    id: c.id,
    company: c.company,
    projects: c.projects.map((p) => ({ id: p.id, name: p.name })),
  }));
  const squadOptions = squads.map((s) => ({
    id: s.id,
    short_title: s.short_title,
  }));
  const taskOptions = taskCatalog.map((t) => ({ slug: t.slug, title: t.title, squadId: t.squadId }));
  const dispatchOptions = squads.map((s) => ({
    id: s.id,
    label: SQUAD_LABELS[s.id] ?? s.short_title,
  }));

  const boardColumns = STATUS_COLUMN_CONFIG.map((column) => ({
    ...column,
    runs: runs.filter((run) => run.status === column.status),
  }));
  const archivedRuns = runs.filter((run) => run.status === "rejected" || run.status === "error");

  return (
    <DashboardShell
      title="Sessoes Operacionais"
      description="Kanban por status com leitura imediata da carga por squad, aprovacoes e execucoes em andamento."
    >
      <RunPoller activeIds={activeIds} />

      <div className="space-y-8">
        <NewDemandForm
          clients={clientOptions}
          squads={squadOptions}
          tasks={taskOptions}
          defaultClientId={sp.clientId}
          defaultProjectId={sp.projectId}
          defaultSquadId={sp.squadId}
        />

        <Section
          title="Kanban operacional"
          description="As colunas mostram o estagio da sessao; os chips no topo de cada coluna mostram quais squads estao concentrando a demanda."
        >
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {boardColumns.map((column) => (
                <KanbanColumn
                  key={column.status}
                  title={column.title}
                  description={column.description}
                  status={column.status}
                  runs={column.runs}
                  allRuns={runs}
                  squadOptions={dispatchOptions}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="Arquivadas e com erro"
          description="Itens fora do fluxo principal ficam abaixo do kanban para nao competir com a operacao atual."
        >
          {archivedRuns.length === 0 ? (
            <EmptyState
              title="Nenhuma sessao arquivada"
              body="Rejeicoes e erros aparecem aqui, isolados da operacao ativa."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {archivedRuns.map((run) => (
                <RunCard
                  key={run.id}
                  run={run}
                  squadOptions={dispatchOptions}
                  allRuns={runs}
                  compact
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </DashboardShell>
  );
}
