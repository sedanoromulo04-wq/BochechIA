import Link from "next/link";
import { listApprovals, listDecisionRecords, listKnowledgeSources } from "@/lib/knowledge-store";
import { getAllRuns } from "@/lib/runs-store";
import { getAllSquads } from "@/lib/squads";
import { getTaskCatalog } from "@/lib/tasks";
import { getAllClients } from "@/lib/clients";
import type { Run } from "@/types/run";
import type { Squad } from "@/types/squad";
import { DashboardShell, StatusBadge, ModelBadge } from "@/components/dashboard/ui";

const SQUAD_TITLES: Record<string, string> = {
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

function summarizeSquad(squad: Squad, runs: Run[]) {
  const activeRuns = runs.filter(r => r.squadId === squad.id && ["pending", "running"].includes(r.status));
  const approvalRuns = runs.filter(r => r.squadId === squad.id && r.status === "awaiting_approval");
  return {
    activeRuns,
    approvalRuns,
    totalProcesses: squad.components.tasks.length,
    totalAgents: squad.components.agents.length,
    memoryReady: squad.mem0?.load_on_start ?? false,
  };
}

function formatTask(taskName?: string) {
  if (!taskName) return "Demanda aberta";
  return taskName.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function SquadNode({ squad, runs }: { squad: Squad; runs: Run[] }) {
  const s = summarizeSquad(squad, runs);
  const color = SQUAD_COLORS[squad.id] ?? "#7cc4fa";
  const isActive = s.activeRuns.length > 0;
  const needsApproval = s.approvalRuns.length > 0;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${isActive || needsApproval ? color + "33" : "var(--border)"}`,
      borderRadius: "10px",
      overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: isActive ? `0 0 0 1px ${color}14, 0 4px 24px ${color}0a` : "none",
    }}>
      {/* top bar */}
      <div style={{ height: "2px", background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {SQUAD_TITLES[squad.id] ?? squad.short_title}
              </span>
              <span style={{
                fontSize: "9px", padding: "2px 7px", borderRadius: "20px",
                fontFamily: "var(--font-mono)", letterSpacing: "0.05em", textTransform: "uppercase",
                background: needsApproval ? "rgba(251,191,36,0.1)" : isActive ? `${color}1a` : "rgba(50,213,131,0.1)",
                color: needsApproval ? "var(--yellow)" : isActive ? color : "var(--green)",
                border: `1px solid ${needsApproval ? "rgba(251,191,36,0.2)" : isActive ? color + "33" : "rgba(50,213,131,0.2)"}`,
              }}>
                {needsApproval ? "APROVAÇÃO" : isActive ? "ATIVO" : "PRONTO"}
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
              {squad.description?.slice(0, 80)}
            </p>
          </div>
          <Link href={`/dashboard/squads/${squad.id}`} style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: color, textDecoration: "none", letterSpacing: "0.05em", flexShrink: 0 }}>
            ABRIR →
          </Link>
        </div>

        {/* stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
          {[
            { label: "AGENTES", value: s.totalAgents, color: "var(--text-primary)" },
            { label: "PROCESSOS", value: s.totalProcesses, color: "var(--text-primary)" },
            { label: "ATIVOS", value: s.activeRuns.length, color: isActive ? color : "var(--text-muted)" },
            { label: "APROVAÇÃO", value: s.approvalRuns.length, color: needsApproval ? "var(--yellow)" : "var(--text-muted)" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "var(--bg-card2)", borderRadius: "6px", padding: "8px 10px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "3px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* model badges */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {squad.routing?.tier_0 && <ModelBadge model={squad.routing.tier_0} />}
          {squad.routing?.tier_1 && <ModelBadge model={squad.routing.tier_1} />}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "10px", fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: "4px",
            border: `1px solid ${s.memoryReady ? "rgba(168,85,247,0.3)" : "var(--border)"}`,
            background: s.memoryReady ? "rgba(168,85,247,0.08)" : "var(--bg-card2)",
            color: s.memoryReady ? "var(--purple)" : "var(--text-muted)",
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.memoryReady ? "var(--purple)" : "var(--text-muted)", display: "inline-block" }} />
            Mem0
          </span>
        </div>

        {/* active runs */}
        {s.activeRuns.length > 0 && (
          <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>EM FOCO</p>
            {s.activeRuns.slice(0, 2).map(run => (
              <div key={run.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card2)", borderRadius: "6px", padding: "8px 10px", marginBottom: "6px" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatTask(run.taskName)}</p>
                  <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{run.clientId}</p>
                </div>
                <StatusBadge value={run.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QueueItem({ run }: { run: Run }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(26,42,68,0.4)", transition: "background 0.15s" }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatTask(run.taskName)}</p>
        <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: "2px" }}>
          {run.clientId} · {SQUAD_TITLES[run.squadId] ?? run.squadId}
        </p>
      </div>
      <StatusBadge value={run.status} />
    </div>
  );
}

function QueueCard({ title, runs, ctaHref, ctaLabel }: { title: string; runs: Run[]; ctaHref: string; ctaLabel: string }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
          <span style={{ background: "rgba(124,196,250,0.1)", color: "var(--cyan)", borderRadius: "4px", padding: "1px 7px", fontSize: "10px", fontFamily: "var(--font-mono)" }}>{runs.length}</span>
        </div>
        <Link href={ctaHref} style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--cyan)", textDecoration: "none", letterSpacing: "0.05em" }}>{ctaLabel}</Link>
      </div>
      {runs.length === 0 ? (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nenhum item aqui agora.</p>
        </div>
      ) : (
        <div>{runs.slice(0, 5).map(run => <QueueItem key={run.id} run={run} />)}</div>
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

  const activeRuns = realRuns.filter(r => ["pending", "running"].includes(r.status));
  const pendingApprovals = realRuns.filter(r => r.status === "awaiting_approval");
  const completedToday = realRuns.filter(r => r.finishedAt && r.status === "approved" && r.finishedAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const activeClients = clients.filter(c => ["active", "onboarding"].includes(c.status));
  const memoryCoverage = squads.filter(s => s.mem0?.load_on_start).length;
  const totalCost = realRuns.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);

  const topSquads = [...squads].sort((a, b) => {
    const aD = summarizeSquad(a, realRuns).activeRuns.length + summarizeSquad(a, realRuns).approvalRuns.length;
    const bD = summarizeSquad(b, realRuns).activeRuns.length + summarizeSquad(b, realRuns).approvalRuns.length;
    return bD - aD;
  });

  const stats = [
    { label: "SESSÕES ATIVAS", value: activeRuns.length, sub: "em execução agora", color: "var(--cyan)" },
    { label: "APROVAÇÕES", value: pendingApprovals.length, sub: "aguardando decisão", color: "var(--yellow)" },
    { label: "CLIENTES ATIVOS", value: activeClients.length, sub: `${clients.length} registrados`, color: "var(--green)" },
    { label: "KNOWLEDGE / DECISÕES", value: `${sources.length}/${decisions.length}`, sub: `$${totalCost.toFixed(4)} custo total`, color: "var(--purple)" },
  ];

  return (
    <DashboardShell title="Central Operacional" description="Visão única de estrutura, filas e capacidade do sistema.">

      {/* ── STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "32px", fontWeight: 700, color: s.color, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "6px" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── FILAS + SISTEMA ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
        <QueueCard title="Fila Crítica" runs={pendingApprovals} ctaHref="/dashboard/approvals" ctaLabel="VER TUDO →" />
        <QueueCard title="Execuções Ativas" runs={activeRuns} ctaHref="/dashboard/runs" ctaLabel="VER SESSÕES →" />
      </div>

      {/* ── SISTEMA INFO ── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px 24px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Status do Sistema</p>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>Superfície única para decidir e despachar</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/dashboard/runs" style={{ background: "var(--cyan)", color: "#040810", padding: "7px 16px", borderRadius: "6px", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, textDecoration: "none", letterSpacing: "0.05em" }}>
              ABRIR SESSÕES
            </Link>
            <Link href="/dashboard/approvals" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "7px 16px", borderRadius: "6px", fontSize: "11px", fontFamily: "var(--font-mono)", textDecoration: "none", letterSpacing: "0.05em" }}>
              APROVAÇÕES
            </Link>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {[
            { label: "MEMÓRIA", value: `${memoryCoverage}/${squads.length} squads`, sub: "com Mem0 ativo" },
            { label: "ENTREGA HOJE", value: completedToday.length, sub: "sessões aprovadas" },
            { label: "GOVERNANÇA", value: approvals.length, sub: "checkpoints totais" },
            { label: "PROCESSOS", value: tasks.length, sub: "catalogados" },
          ].map(item => (
            <div key={item.label} style={{ background: "var(--bg-card2)", borderRadius: "8px", padding: "12px 14px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{item.label}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{item.value}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ORG CHART ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Organograma Operacional</p>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
              {squads.length} squads ativos · {squads.reduce((sum, s) => sum + s.components.agents.length, 0)} agentes
            </p>
          </div>
          <Link href="/dashboard/squads" style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--cyan)", textDecoration: "none", letterSpacing: "0.05em" }}>
            VER ESTRUTURA COMPLETA →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {topSquads.map(squad => (
            <SquadNode key={squad.id} squad={squad} runs={realRuns} />
          ))}
        </div>
      </div>

    </DashboardShell>
  );
}
