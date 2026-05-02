import Link from "next/link";
import {
  DashboardShell,
  EmptyState,
  ModelBadge,
  Section,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/ui";
import { getAllClients } from "@/lib/clients";
import { listApprovals, listDecisionRecords, listKnowledgeSources } from "@/lib/knowledge-store";
import { getAllRuns } from "@/lib/runs-store";
import { getAllSquads } from "@/lib/squads";
import { getTaskCatalog } from "@/lib/tasks";
import type { Run } from "@/types/run";
import type { Squad } from "@/types/squad";

const SQUAD_TITLES: Record<string, string> = {
  "copy-squad": "Copywriting",
  "brand-squad": "Marca",
  "hormozi-squad": "Ofertas",
  "content-squad": "Conteudo",
  "traffic-masters": "Trafego",
  "data-squad": "Dados",
  "c-level-squad": "C-Level",
  _orchestrator: "Orquestrador",
};

const RUN_STATUS_LABELS: Record<Run["status"], string> = {
  pending: "Na fila",
  running: "Executando",
  awaiting_approval: "Bloqueado por aprovacao",
  approved: "Aprovado",
  rejected: "Rejeitado",
  error: "Erro",
};

function formatRelativeTask(taskName?: string) {
  if (!taskName) return "Demanda aberta";
  return taskName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSquadLabel(squad: Squad) {
  return SQUAD_TITLES[squad.id] ?? squad.short_title;
}

function summarizeSquad(squad: Squad, runs: Run[]) {
  const activeRuns = runs.filter((run) => run.squadId === squad.id && ["pending", "running"].includes(run.status));
  const approvalRuns = runs.filter((run) => run.squadId === squad.id && run.status === "awaiting_approval");

  return {
    activeRuns,
    approvalRuns,
    totalProcesses: squad.components.tasks.length,
    totalAgents: squad.components.agents.length,
    memoryReady: squad.mem0?.load_on_start ?? false,
  };
}

function OrgNode({
  squad,
  runs,
}: {
  squad: Squad;
  runs: Run[];
}) {
  const summary = summarizeSquad(squad, runs);

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold">{getSquadLabel(squad)}</p>
            <StatusBadge value={summary.activeRuns.length > 0 ? "active" : summary.approvalRuns.length > 0 ? "review" : "ready"} />
          </div>
          <p className="text-sm leading-6 text-[var(--muted)]">{squad.description}</p>
        </div>
        <Link
          href={`/dashboard/squads/${squad.id}`}
          className="text-xs font-medium text-[var(--accent)]"
        >
          Abrir
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div className="bg-[var(--surface-subtle)] px-3 py-2">
          <span className="block text-lg font-semibold text-foreground">{summary.totalAgents}</span>
          <span className="text-[var(--muted)]">agentes</span>
        </div>
        <div className="bg-[var(--surface-subtle)] px-3 py-2">
          <span className="block text-lg font-semibold text-foreground">{summary.totalProcesses}</span>
          <span className="text-[var(--muted)]">processos</span>
        </div>
        <div className="bg-[var(--surface-subtle)] px-3 py-2">
          <span className="block text-lg font-semibold text-foreground">{summary.activeRuns.length}</span>
          <span className="text-[var(--muted)]">sessoes ativas</span>
        </div>
        <div className="bg-[var(--surface-subtle)] px-3 py-2">
          <span className="block text-lg font-semibold text-foreground">{summary.approvalRuns.length}</span>
          <span className="text-[var(--muted)]">aguardando voce</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {squad.routing?.tier_0 ? <ModelBadge model={squad.routing.tier_0} /> : null}
        {squad.routing?.tier_1 ? <ModelBadge model={squad.routing.tier_1} /> : null}
        <StatusBadge value={summary.memoryReady ? "ready" : "paused"} label={summary.memoryReady ? "Mem0 on" : "Mem0 off"} />
      </div>

      {summary.activeRuns.length > 0 ? (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Em foco</p>
          <div className="mt-2 space-y-2">
            {summary.activeRuns.slice(0, 2).map((run) => (
              <div key={run.id} className="flex items-center justify-between gap-3 bg-[var(--surface-subtle)] px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{formatRelativeTask(run.taskName)}</p>
                  <p className="truncate text-[var(--muted)]">{run.clientId}</p>
                </div>
                <StatusBadge value={run.status} label={RUN_STATUS_LABELS[run.status]} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QueueCard({
  title,
  description,
  runs,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  runs: Run[];
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
        <Link href={ctaHref} className="text-sm font-medium text-[var(--accent)]">
          {ctaLabel}
        </Link>
      </div>

      {runs.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Nada aqui agora" body="Quando surgirem itens nesta fila, eles aparecem com prioridade." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {runs.slice(0, 5).map((run) => (
            <div key={run.id} className="flex items-start justify-between gap-3 border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{formatRelativeTask(run.taskName)}</p>
                <p className="text-sm text-[var(--muted)]">{run.clientId} · {SQUAD_TITLES[run.squadId] ?? run.squadId}</p>
              </div>
              <StatusBadge value={run.status} label={RUN_STATUS_LABELS[run.status]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const [squads, realRuns, decisions, approvals, sources, clients, tasks] = await Promise.all([
    getAllSquads(),
    getAllRuns(),
    listDecisionRecords(),
    listApprovals(),
    listKnowledgeSources(),
    getAllClients(),
    getTaskCatalog(),
  ]);

  const activeRuns = realRuns.filter((run) => run.status === "pending" || run.status === "running");
  const pendingApprovals = realRuns.filter((run) => run.status === "awaiting_approval");
  const completedToday = realRuns.filter((run) => {
    if (!run.finishedAt || run.status !== "approved") return false;
    return run.finishedAt.slice(0, 10) === new Date().toISOString().slice(0, 10);
  });
  const activeClients = clients.filter((client) => client.status === "active" || client.status === "onboarding");
  const memoryCoverage = squads.filter((squad) => squad.mem0?.load_on_start).length;
  const totalCost = realRuns.reduce((sum, run) => sum + (run.costUsd ?? 0), 0);

  const topSquads = [...squads].sort((a, b) => {
    const aDemand = summarizeSquad(a, realRuns).activeRuns.length + summarizeSquad(a, realRuns).approvalRuns.length;
    const bDemand = summarizeSquad(b, realRuns).activeRuns.length + summarizeSquad(b, realRuns).approvalRuns.length;
    return bDemand - aDemand;
  });

  return (
    <DashboardShell
      title="Central Operacional"
      description="Um painel unico para enxergar sessao, organograma, filas e carga do sistema sem poluir a tela com historico desnecessario."
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Sessoes em andamento"
            value={activeRuns.length}
            detail="Tudo que esta em execucao agora, independente do squad."
          />
          <StatCard
            label="Aguardando aprovacao"
            value={pendingApprovals.length}
            detail="Bloqueios humanos que merecem a maior prioridade visual."
          />
          <StatCard
            label="Clientes ativos"
            value={activeClients.length}
            detail={`${clients.length} clientes registrados e ${tasks.length} processos catalogados.`}
          />
          <StatCard
            label="Base e decisoes"
            value={`${sources.length} / ${decisions.length}`}
            detail={`Knowledge e logica vivas. Custo acumulado: $${totalCost.toFixed(4)}.`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Modo de operacao</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Superficie unica para decidir e despachar</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  O foco da home agora e mostrar estrutura, capacidade e gargalos. Historico detalhado continua existindo, mas fora do centro da atencao.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/runs" className="bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">
                  Abrir sessoes
                </Link>
                <Link href="/dashboard/approvals" className="border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)]">
                  Revisar aprovacoes
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Orquestracao</p>
                <p className="mt-2 text-sm font-medium">Tudo parte de uma sessao e termina em aprovacao humana.</p>
              </div>
              <div className="bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Memoria</p>
                <p className="mt-2 text-sm font-medium">{memoryCoverage}/{squads.length} squads iniciam com Mem0 carregado.</p>
              </div>
              <div className="bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Entrega hoje</p>
                <p className="mt-2 text-sm font-medium">{completedToday.length} sessoes aprovadas hoje.</p>
              </div>
              <div className="bg-[var(--surface-subtle)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Governanca</p>
                <p className="mt-2 text-sm font-medium">{approvals.length} checkpoints registrados no total.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <QueueCard
              title="Fila critica"
              description="Tudo que depende da sua decisao agora."
              runs={pendingApprovals}
              ctaHref="/dashboard/approvals"
              ctaLabel="Abrir fila"
            />
            <QueueCard
              title="Execucoes ativas"
              description="Sessoes em processamento que merecem acompanhamento, nao leitura integral."
              runs={activeRuns}
              ctaHref="/dashboard/runs"
              ctaLabel="Ver sessoes"
            />
          </div>
        </section>

        <Section
          title="Organograma operacional"
          description="Cada card representa um squad como unidade de capacidade, nao apenas como pagina isolada. O objetivo e enxergar distribuicao de demanda, memoria e modelo numa unica leitura."
          action={
            <Link className="text-sm font-medium text-[var(--accent)]" href="/dashboard/squads">
              Ver estrutura completa
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topSquads.map((squad) => (
              <OrgNode key={squad.id} squad={squad} runs={realRuns} />
            ))}
          </div>
        </Section>
      </div>
    </DashboardShell>
  );
}
