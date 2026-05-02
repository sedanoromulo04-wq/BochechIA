import {
  DashboardShell,
  StatusBadge,
  ModelBadge,
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
  "copy-squad": "Copy Squad",
  "brand-squad": "Brand Squad",
  "hormozi-squad": "Hormozi Squad",
  "content-squad": "Content Squad",
  "traffic-masters": "Traffic Masters",
  "data-squad": "Data Squad",
  "c-level-squad": "C-Level Squad",
  _orchestrator: "Orquestrador",
};

const SQUAD_COLORS: Record<string, string> = {
  "copy-squad": "#7cc4fa",
  "brand-squad": "#32d583",
  "hormozi-squad": "#fbbf24",
  "content-squad": "#a855f7",
  "traffic-masters": "#fb923c",
  "data-squad": "#e879f9",
  "c-level-squad": "#f87171",
  _orchestrator: "#38bdf8",
};

const STATUS_LABEL: Record<RunStatus, string> = {
  pending: "Na fila",
  running: "Executando",
  awaiting_approval: "Aguardando aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
  error: "Erro",
};

const STATUS_COLUMN_CONFIG: Array<{ status: RunStatus; title: string; color: string }> = [
  { status: "awaiting_approval", title: "APROVAÇÃO", color: "#fbbf24" },
  { status: "running",           title: "EXECUTANDO", color: "#7cc4fa" },
  { status: "pending",           title: "FILA",       color: "#94a3b8" },
  { status: "approved",          title: "CONCLUÍDO",  color: "#32d583" },
];

function RunDate({ iso }: { iso?: string }) {
  if (!iso) return <span>-</span>;
  return (
    <time suppressHydrationWarning dateTime={iso}>
      {new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}

function formatTaskName(taskName?: string) {
  if (!taskName) return "Demanda aberta";
  return taskName.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function summarizeBySquad(runs: Run[]) {
  return Object.entries(
    runs.reduce<Record<string, number>>((acc, run) => { acc[run.squadId] = (acc[run.squadId] ?? 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]);
}

function RunCard({ run, squadOptions, allRuns, compact = false }: {
  run: Run;
  squadOptions: Array<{ id: string; label: string }>;
  allRuns: Run[];
  compact?: boolean;
}) {
  const needsAction = run.status === "awaiting_approval";
  const isActive = run.status === "pending" || run.status === "running";
  const children = allRuns.filter(r => run.childRunIds?.includes(r.id));
  const parent = run.parentRunId ? allRuns.find(r => r.id === run.parentRunId) : null;
  const squadColor = SQUAD_COLORS[run.squadId] ?? "#7cc4fa";

  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${needsAction ? "rgba(251,191,36,0.35)" : isActive ? `${squadColor}22` : "var(--border)"}`,
      borderRadius: "8px",
      overflow: "hidden",
      marginBottom: "8px",
    }}>
      {needsAction && <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #fbbf24, transparent)" }} />}

      <div style={{ padding: compact ? "12px 14px" : "16px 18px" }}>
        {parent && (
          <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "8px" }}>
            Despachado de: <span style={{ color: "var(--text-secondary)" }}>{SQUAD_LABELS[parent.squadId] ?? parent.squadId}</span>
          </p>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
              <StatusBadge value={run.status} label={STATUS_LABEL[run.status]} />
              <span style={{
                fontSize: "10px", fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "4px",
                border: `1px solid ${squadColor}33`, background: `${squadColor}10`, color: squadColor,
              }}>
                {SQUAD_LABELS[run.squadId] ?? run.squadId}
              </span>
              {isActive && (
                <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--cyan)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ animation: "pulse 1.5s ease-in-out infinite", display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "var(--cyan)" }} />
                  LIVE
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>{formatTaskName(run.taskName)}</p>
            <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{run.clientId}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <ModelBadge model={run.modelId} />
            {run.costUsd !== undefined && (
              <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--green)", marginTop: "4px" }}>${run.costUsd.toFixed(5)}</p>
            )}
          </div>
        </div>

        {run.messages && run.messages.length > 0 && !compact && (
          <ConversationThread messages={run.messages} />
        )}

        {run.error && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px", padding: "10px 12px", marginBottom: "10px" }}>
            <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--red)", textTransform: "uppercase", marginBottom: "4px" }}>Erro na execução</p>
            <p style={{ fontSize: "11px", color: "var(--red)" }}>{run.error}</p>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              Criado: <RunDate iso={run.createdAt} />
            </span>
            {run.finishedAt && (
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                Finalizado: <RunDate iso={run.finishedAt} />
              </span>
            )}
            {run.mem0Loaded && (
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--purple)" }}>● Mem0 ativo</span>
            )}
          </div>
          {run.approvedAt && (
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--green)" }}>
              ✓ {run.approvedBy ?? "ceo"} · <RunDate iso={run.approvedAt} />
            </span>
          )}
          {run.rejectionReason && (
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--red)" }}>✕ {run.rejectionReason}</span>
          )}
        </div>

        {needsAction && !compact && (
          <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
            <CeoActions runId={run.id} squadOptions={squadOptions} />
          </div>
        )}
      </div>

      {children.length > 0 && !compact && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card2)", padding: "12px 18px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>DESPACHADO PARA</p>
          {children.map(child => (
            <div key={child.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <StatusBadge value={child.status} label={STATUS_LABEL[child.status]} />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{SQUAD_LABELS[child.squadId] ?? child.squadId}</span>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{child.messages?.length ?? 0} msg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ title, statusCfg, runs, allRuns, squadOptions }: {
  title: string;
  statusCfg: typeof STATUS_COLUMN_CONFIG[0];
  runs: Run[];
  allRuns: Run[];
  squadOptions: Array<{ id: string; label: string }>;
}) {
  const squadSummary = summarizeBySquad(runs);

  return (
    <div style={{
      minWidth: "300px", maxWidth: "360px",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* header */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "14px 16px", background: "var(--bg-card2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: squadSummary.length > 0 ? "10px" : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusCfg.color, boxShadow: `0 0 6px ${statusCfg.color}`, display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
          </div>
          <span style={{ background: `${statusCfg.color}18`, color: statusCfg.color, border: `1px solid ${statusCfg.color}33`, borderRadius: "4px", padding: "1px 8px", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {runs.length}
          </span>
        </div>
        {squadSummary.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {squadSummary.slice(0, 4).map(([squadId, count]) => (
              <span key={`${statusCfg.status}-${squadId}`} style={{
                fontSize: "9px", fontFamily: "var(--font-mono)", padding: "2px 7px", borderRadius: "4px",
                background: `${SQUAD_COLORS[squadId] ?? "#7cc4fa"}14`,
                color: SQUAD_COLORS[squadId] ?? "var(--text-muted)",
                border: `1px solid ${SQUAD_COLORS[squadId] ?? "#7cc4fa"}22`,
              }}>
                {SQUAD_LABELS[squadId] ?? squadId} {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* body */}
      <div style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
        {runs.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nenhuma sessão</p>
          </div>
        ) : (
          runs.map(run => (
            <RunCard
              key={run.id}
              run={run}
              squadOptions={squadOptions}
              allRuns={allRuns}
              compact={statusCfg.status !== "awaiting_approval"}
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

  const activeIds = runs.filter(r => r.status === "pending" || r.status === "running").map(r => r.id);
  const clientOptions = clients.map(c => ({ id: c.id, company: c.company, projects: c.projects.map(p => ({ id: p.id, name: p.name })) }));
  const squadOptions = squads.map(s => ({ id: s.id, short_title: s.short_title }));
  const taskOptions = taskCatalog.map(t => ({ slug: t.slug, title: t.title, squadId: t.squadId }));
  const dispatchOptions = squads.map(s => ({ id: s.id, label: SQUAD_LABELS[s.id] ?? s.short_title }));

  const boardColumns = STATUS_COLUMN_CONFIG.map(cfg => ({
    ...cfg,
    runs: runs.filter(r => r.status === cfg.status),
  }));
  const archivedRuns = runs.filter(r => r.status === "rejected" || r.status === "error");

  return (
    <DashboardShell
      title="Sessões Operacionais"
      description="Kanban por status — aprovações, execuções ativas e fila de demandas."
    >
      <RunPoller activeIds={activeIds} />

      {/* ── NEW DEMAND FORM ── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px 24px", marginBottom: "24px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>Nova Demanda</p>
        <NewDemandForm
          clients={clientOptions}
          squads={squadOptions}
          tasks={taskOptions}
          defaultClientId={sp.clientId}
          defaultProjectId={sp.projectId}
          defaultSquadId={sp.squadId}
        />
      </div>

      {/* ── KANBAN ── */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Kanban Operacional — {runs.length} sessões totais
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
          {boardColumns.map(col => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              statusCfg={col}
              runs={col.runs}
              allRuns={runs}
              squadOptions={dispatchOptions}
            />
          ))}
        </div>
      </div>

      {/* ── ARCHIVED ── */}
      <div style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Arquivadas e com Erro</p>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", background: "rgba(248,113,113,0.1)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "4px", padding: "1px 7px" }}>{archivedRuns.length}</span>
        </div>
        {archivedRuns.length === 0 ? (
          <div style={{ background: "var(--bg-card)", border: "1px dashed var(--border)", borderRadius: "10px", padding: "32px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nenhuma sessão arquivada.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {archivedRuns.map(run => (
              <RunCard key={run.id} run={run} squadOptions={dispatchOptions} allRuns={runs} compact />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
