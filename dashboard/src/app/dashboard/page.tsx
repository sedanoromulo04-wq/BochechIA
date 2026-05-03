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
    totalAgents: squad.components.agents.length,
    totalProcesses: squad.components.tasks.length,
    memoryReady: squad.mem0?.load_on_start ?? false,
  };
}

function formatTask(taskName?: string) {
  if (!taskName) return "Demanda aberta";
  return taskName.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

/* ─────────────────────────────────────────
   FLOW MAP SVG — replica exata do HTML
───────────────────────────────────────── */
function FlowMap({ squads, runs }: { squads: Squad[]; runs: Run[] }) {
  const totalTokens = runs.reduce((s, r) => s + (r.costUsd ?? 0) * 1_000_000 / 3, 0);
  const activeCount = runs.filter(r => ["pending","running"].includes(r.status)).length;
  const approvalCount = runs.filter(r => r.status === "awaiting_approval").length;
  const decidedCount = runs.filter(r => r.status === "approved").length;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "32px 24px 24px",
      position: "relative",
      overflow: "hidden",
      marginBottom: "16px",
    }}>
      {/* radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(124,196,250,0.03) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", position: "relative", zIndex: 1 }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>01 / Automation Architecture</p>
          <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Agent Flow Map</p>
        </div>
        <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.8 }}>
          <span>Nodes active: </span><span style={{ color: "var(--green)" }}>{activeCount + squads.length} / {squads.length + 2}</span><br />
          <span>Pending approval: </span><span style={{ color: "var(--yellow)" }}>{approvalCount}</span><br />
          <span>Completed: </span><span style={{ color: "var(--cyan)" }}>{decidedCount}</span>
        </div>
      </div>

      {/* SVG flow map */}
      <svg viewBox="0 0 1100 480" style={{ width: "100%", height: "480px" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-cyan"><feGaussianBlur stdDeviation="3" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
          <filter id="glow-green"><feGaussianBlur stdDeviation="2.5" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
          <filter id="glow-purple"><feGaussianBlur stdDeviation="2.5" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
          <linearGradient id="pathCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7cc4fa" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6"/>
          </linearGradient>
          <linearGradient id="pathGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#32d583" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#7cc4fa" stopOpacity="0.5"/>
          </linearGradient>
          <linearGradient id="pathPurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.5"/>
          </linearGradient>
          <radialGradient id="nodeGradCyan" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#7cc4fa" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#0d1628" stopOpacity="0.9"/>
          </radialGradient>
          <radialGradient id="nodeGradGreen" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#32d583" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#0d1628" stopOpacity="0.9"/>
          </radialGradient>
          <radialGradient id="nodeGradPurple" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#0d1628" stopOpacity="0.9"/>
          </radialGradient>
          <radialGradient id="nodeGradYellow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#0d1628" stopOpacity="0.9"/>
          </radialGradient>
          <radialGradient id="nodeGradOrange" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#0d1628" stopOpacity="0.9"/>
          </radialGradient>
          <style>{`
            .flow-path { stroke-dasharray: 8 4; animation: dash 1.5s linear infinite; }
            .flow-path-reverse { stroke-dasharray: 8 4; animation: dashReverse 2s linear infinite; }
            .node-pulse { animation: nodePulse 2.5s ease-in-out infinite; }
            .core-pulse-ring { animation: corePulse 2s ease-in-out infinite; transform-origin: 65px 35px; }
            @keyframes dash { to { stroke-dashoffset: -36; } }
            @keyframes dashReverse { to { stroke-dashoffset: 36; } }
            @keyframes nodePulse { 0%,100% { opacity:0.2; } 50% { opacity:0.6; } }
            @keyframes corePulse { 0%,100% { opacity:0.15; transform:scale(1); } 50% { opacity:0.4; transform:scale(1.08); } }
          `}</style>
        </defs>

        {/* ── Connection lines ── */}
        <path d="M 205 200 C 260 200 280 130 335 130" fill="none" stroke="url(#pathCyan)" strokeWidth="1.5" className="flow-path"/>
        <path d="M 205 200 C 260 200 280 270 335 270" fill="none" stroke="url(#pathGreen)" strokeWidth="1.5" className="flow-path"/>
        <path d="M 205 200 C 260 200 280 390 335 390" fill="none" stroke="url(#pathPurple)" strokeWidth="1.5" className="flow-path-reverse"/>
        <path d="M 465 130 C 530 130 530 130 595 130" fill="none" stroke="url(#pathCyan)" strokeWidth="1.5" className="flow-path"/>
        <path d="M 465 270 C 530 270 530 270 595 270" fill="none" stroke="url(#pathGreen)" strokeWidth="1.5" className="flow-path"/>
        <path d="M 725 130 C 790 130 790 200 855 200" fill="none" stroke="url(#pathCyan)" strokeWidth="1.5" className="flow-path"/>
        <path d="M 725 270 C 790 270 790 200 855 200" fill="none" stroke="url(#pathGreen)" strokeWidth="1.5" className="flow-path"/>
        {/* integrations */}
        <path d="M 985 200 L 1040 120" fill="none" stroke="#fb923c" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
        <path d="M 985 200 L 1040 170" fill="none" stroke="#4ade80" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
        <path d="M 985 200 L 1040 230" fill="none" stroke="#a78bfa" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
        <path d="M 985 200 L 1040 280" fill="none" stroke="#f472b6" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
        {/* reporting dotted */}
        <path d="M 465 390 C 530 390 570 315 660 315" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 6" opacity="0.35"/>
        <path d="M 465 390 C 570 390 600 200 855 200" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 6" opacity="0.25"/>

        {/* ── NODE: C-Level / Sales Director ── */}
        <g transform="translate(75, 165)" style={{ cursor: "pointer" }}>
          <circle cx="65" cy="35" r="35" fill="#0d1628" stroke="#7cc4fa" strokeWidth="1.5"/>
          <circle cx="65" cy="35" r="35" fill="url(#nodeGradCyan)" opacity="0.8"/>
          <circle cx="65" cy="35" r="42" fill="none" stroke="#7cc4fa" strokeWidth="0.5" opacity="0.3" className="node-pulse"/>
          <text x="65" y="28" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="16" fill="#7cc4fa">⬡</text>
          <text x="65" y="46" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8.5" fill="#94a3b8">C-LEVEL</text>
          <text x="65" y="58" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill="#32d583">● ACTIVE</text>
          <rect x="0" y="85" width="130" height="50" rx="6" fill="#080f1e" stroke="#1a2a44" strokeWidth="1"/>
          <text x="10" y="100" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">TOKENS</text>
          <text x="120" y="100" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#7cc4fa">1.2M</text>
          <text x="10" y="113" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">ACTIONS</text>
          <text x="120" y="113" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">847</text>
          <text x="10" y="126" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">UPTIME</text>
          <text x="120" y="126" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#fbbf24">99.8%</text>
        </g>

        {/* ── NODE: Copy Squad / Lead Hunter ── */}
        <g transform="translate(335, 100)" style={{ cursor: "pointer" }}>
          <circle cx="65" cy="30" r="30" fill="#0d1628" stroke="#38bdf8" strokeWidth="1.5"/>
          <circle cx="65" cy="30" r="30" fill="url(#nodeGradCyan)" opacity="0.7"/>
          <circle cx="65" cy="30" r="38" fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.25" className="node-pulse"/>
          <text x="65" y="24" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="14">✍️</text>
          <text x="65" y="40" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8" fill="#94a3b8">COPY SQUAD</text>
          <rect x="0" y="72" width="130" height="42" rx="5" fill="#080f1e" stroke="#1a2a44" strokeWidth="1"/>
          <text x="10" y="87" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">AGENTES</text>
          <text x="120" y="87" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#38bdf8">23</text>
          <text x="10" y="100" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">PROCESSOS</text>
          <text x="120" y="100" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">{squads.find(s => s.id === "copy-squad")?.components.tasks.length ?? 0}</text>
          <text x="10" y="113" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">● RUNNING</text>
        </g>

        {/* ── NODE: Brand Squad / Content Creator ── */}
        <g transform="translate(335, 240)" style={{ cursor: "pointer" }}>
          <circle cx="65" cy="30" r="30" fill="#0d1628" stroke="#32d583" strokeWidth="1.5"/>
          <circle cx="65" cy="30" r="30" fill="url(#nodeGradGreen)" opacity="0.7"/>
          <circle cx="65" cy="30" r="38" fill="none" stroke="#32d583" strokeWidth="0.5" opacity="0.25" className="node-pulse"/>
          <text x="65" y="24" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="14">🎙️</text>
          <text x="65" y="40" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8" fill="#94a3b8">BRAND SQUAD</text>
          <rect x="0" y="72" width="130" height="42" rx="5" fill="#080f1e" stroke="#1a2a44" strokeWidth="1"/>
          <text x="10" y="87" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">AGENTES</text>
          <text x="120" y="87" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">{squads.find(s => s.id === "brand-squad")?.components.agents.length ?? 0}</text>
          <text x="10" y="100" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">ENGAGEMENT</text>
          <text x="120" y="100" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#fbbf24">+41%</text>
          <text x="10" y="113" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">● RUNNING</text>
        </g>

        {/* ── NODE: Data Squad / Reporting ── */}
        <g transform="translate(335, 360)" style={{ cursor: "pointer" }}>
          <circle cx="65" cy="30" r="28" fill="#0d1628" stroke="#a855f7" strokeWidth="1.5"/>
          <circle cx="65" cy="30" r="28" fill="url(#nodeGradPurple)" opacity="0.7"/>
          <text x="65" y="24" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="14">📊</text>
          <text x="65" y="39" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8" fill="#94a3b8">DATA SQUAD</text>
          <rect x="0" y="68" width="130" height="42" rx="5" fill="#080f1e" stroke="#1a2a44" strokeWidth="1"/>
          <text x="10" y="83" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">RELATÓRIOS/WK</text>
          <text x="120" y="83" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#a855f7">12</text>
          <text x="10" y="96" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">DATA POINTS</text>
          <text x="120" y="96" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#a855f7">4.2K</text>
          <text x="10" y="109" fontFamily="var(--font-mono)" fontSize="8" fill="#fbbf24">⏳ COMPILING</text>
        </g>

        {/* ── NODE: Hormozi Squad / Proposals ── */}
        <g transform="translate(595, 100)" style={{ cursor: "pointer" }}>
          <circle cx="65" cy="30" r="30" fill="#0d1628" stroke="#fbbf24" strokeWidth="1.5"/>
          <circle cx="65" cy="30" r="30" fill="url(#nodeGradYellow)" opacity="0.7"/>
          <circle cx="65" cy="30" r="38" fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity="0.25" className="node-pulse"/>
          <text x="65" y="24" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="14">💰</text>
          <text x="65" y="40" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8" fill="#94a3b8">HORMOZI SQUAD</text>
          <rect x="0" y="72" width="130" height="42" rx="5" fill="#080f1e" stroke="#1a2a44" strokeWidth="1"/>
          <text x="10" y="87" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">OFERTAS/WK</text>
          <text x="120" y="87" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#fbbf24">11</text>
          <text x="10" y="100" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">WIN RATE</text>
          <text x="120" y="100" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">64%</text>
          <text x="10" y="113" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">● RUNNING</text>
        </g>

        {/* ── NODE: Content Squad / Repurposer ── */}
        <g transform="translate(595, 240)" style={{ cursor: "pointer" }}>
          <circle cx="65" cy="30" r="28" fill="#0d1628" stroke="#fb923c" strokeWidth="1.5"/>
          <circle cx="65" cy="30" r="28" fill="url(#nodeGradOrange)" opacity="0.7"/>
          <text x="65" y="24" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="14">📝</text>
          <text x="65" y="39" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8" fill="#94a3b8">CONTENT SQUAD</text>
          <rect x="0" y="68" width="130" height="42" rx="5" fill="#080f1e" stroke="#1a2a44" strokeWidth="1"/>
          <text x="10" y="83" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">FORMATOS</text>
          <text x="120" y="83" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#fb923c">7</text>
          <text x="10" y="96" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">REACH</text>
          <text x="120" y="96" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">128K</text>
          <text x="10" y="109" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">● ACTIVE</text>
        </g>

        {/* ── NODE: Traffic Masters / Client Onboarder ── */}
        <g transform="translate(855, 165)" style={{ cursor: "pointer" }}>
          <circle cx="65" cy="35" r="32" fill="#0d1628" stroke="#32d583" strokeWidth="2"/>
          <circle cx="65" cy="35" r="32" fill="url(#nodeGradGreen)" opacity="0.8"/>
          <circle cx="65" cy="35" r="42" fill="none" stroke="#32d583" strokeWidth="0.8" opacity="0.35" className="node-pulse"/>
          <circle cx="65" cy="35" r="50" fill="none" stroke="#32d583" strokeWidth="0.4" opacity="0.2" className="core-pulse-ring"/>
          <text x="65" y="28" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="16">🚀</text>
          <text x="65" y="46" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8" fill="#94a3b8">TRAFFIC MASTERS</text>
          <text x="65" y="58" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill="#32d583">● {activeCount} SESSÕES ATIVAS</text>
          <rect x="2" y="85" width="126" height="54" rx="6" fill="#080f1e" stroke="#064e3b" strokeWidth="1"/>
          <text x="12" y="100" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">CLIENTES/MO</text>
          <text x="118" y="100" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">14</text>
          <text x="12" y="113" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">APROVAÇÕES</text>
          <text x="118" y="113" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#fbbf24">{approvalCount}</text>
          <text x="12" y="126" fontFamily="var(--font-mono)" fontSize="8" fill="#4a5568">CONCLUÍDOS</text>
          <text x="118" y="126" textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#32d583">{decidedCount}</text>
        </g>

        {/* ── Integration nodes ── */}
        <g transform="translate(1042, 98)">
          <rect x="0" y="0" width="52" height="40" rx="6" fill="#080f1e" stroke="#fb923c" strokeWidth="1" opacity="0.7"/>
          <text x="26" y="15" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11">🔶</text>
          <text x="26" y="30" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill="#94a3b8">HubSpot</text>
        </g>
        <g transform="translate(1042, 150)">
          <rect x="0" y="0" width="52" height="40" rx="6" fill="#080f1e" stroke="#4ade80" strokeWidth="1" opacity="0.7"/>
          <text x="26" y="15" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11">💬</text>
          <text x="26" y="30" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill="#94a3b8">Slack</text>
        </g>
        <g transform="translate(1042, 210)">
          <rect x="0" y="0" width="52" height="40" rx="6" fill="#080f1e" stroke="#a78bfa" strokeWidth="1" opacity="0.7"/>
          <text x="26" y="15" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11">📄</text>
          <text x="26" y="30" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill="#94a3b8">Notion</text>
        </g>
        <g transform="translate(1042, 262)">
          <rect x="0" y="0" width="52" height="40" rx="6" fill="#080f1e" stroke="#f472b6" strokeWidth="1" opacity="0.7"/>
          <text x="26" y="15" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11">✅</text>
          <text x="26" y="30" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill="#94a3b8">ClickUp</text>
        </g>

        {/* ── Animated data particles ── */}
        <circle r="3" fill="#7cc4fa" opacity="0.9" filter="url(#glow-cyan)">
          <animateMotion dur="2.5s" repeatCount="indefinite" path="M 205 200 C 260 200 280 130 335 130 C 530 130 530 130 595 130 C 790 130 790 200 855 200"/>
        </circle>
        <circle r="3" fill="#32d583" opacity="0.9" filter="url(#glow-green)">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 205 200 C 260 200 280 270 335 270 C 530 270 530 270 595 270 C 790 270 790 200 855 200"/>
        </circle>
        <circle r="2" fill="#a855f7" opacity="0.7" filter="url(#glow-purple)">
          <animateMotion dur="4s" repeatCount="indefinite" path="M 205 200 C 260 200 280 390 335 390 C 460 390 500 315 600 240"/>
        </circle>
      </svg>

      {/* ── Flow stats bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginTop: "16px" }}>
        {[
          { label: "Total Tokens", value: `${(totalTokens / 1_000_000).toFixed(1)}M`, sub: "↑ +12% esta semana", color: "var(--cyan)" },
          { label: "Sessões Ativas", value: activeCount, sub: `${approvalCount} aguardando aprovação`, color: "var(--green)" },
          { label: "Automações", value: squads.length * 3, sub: `${squads.length} squads · 0 falhas`, color: "var(--yellow)" },
          { label: "Latência Média", value: "340ms", sub: "P95: 1.2s", color: "var(--text-primary)" },
          { label: "Decisões", value: decidedCount, sub: "aprovadas e registradas", color: "var(--purple)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px 16px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 700, color: s.color, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "4px" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   QUEUE CARD
───────────────────────────────────────── */
function QueueItem({ run }: { run: Run }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(26,42,68,0.4)" }}>
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

function QueueCard({ title, runs, ctaHref, ctaLabel, accentColor = "var(--cyan)" }: {
  title: string; runs: Run[]; ctaHref: string; ctaLabel: string; accentColor?: string;
}) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
          <span style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}33`, borderRadius: "4px", padding: "1px 7px", fontSize: "10px", fontFamily: "var(--font-mono)" }}>{runs.length}</span>
        </div>
        <Link href={ctaHref} style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: accentColor, textDecoration: "none", letterSpacing: "0.05em" }}>{ctaLabel}</Link>
      </div>
      {runs.length === 0 ? (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Nenhum item agora.</p>
        </div>
      ) : (
        <div>{runs.slice(0, 5).map(run => <QueueItem key={run.id} run={run} />)}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
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

  return (
    <DashboardShell title="Central Operacional" description="Flow Map · Filas · Organograma">

      {/* ── STATS TOPO ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "SESSÕES ATIVAS",        value: activeRuns.length,      sub: "em execução agora",                      color: "var(--cyan)"   },
          { label: "APROVAÇÕES PENDENTES",  value: pendingApprovals.length, sub: "aguardando sua decisão",                color: "var(--yellow)" },
          { label: "CLIENTES ATIVOS",       value: activeClients.length,   sub: `${clients.length} registrados`,          color: "var(--green)"  },
          { label: "KNOWLEDGE / DECISÕES",  value: `${sources.length}/${decisions.length}`, sub: `$${totalCost.toFixed(4)} custo`, color: "var(--purple)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "32px", fontWeight: 700, color: s.color, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "6px" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── FLOW MAP ── */}
      <FlowMap squads={squads} runs={realRuns} />

      {/* ── FILAS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <QueueCard title="Fila Crítica"      runs={pendingApprovals} ctaHref="/dashboard/approvals" ctaLabel="VER TUDO →"     accentColor="var(--yellow)" />
        <QueueCard title="Execuções Ativas"  runs={activeRuns}       ctaHref="/dashboard/runs"      ctaLabel="VER SESSÕES →"  accentColor="var(--cyan)"   />
      </div>

      {/* ── SISTEMA INFO ── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Status do Sistema</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/dashboard/runs" style={{ background: "var(--cyan)", color: "#040810", padding: "7px 16px", borderRadius: "6px", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, textDecoration: "none", letterSpacing: "0.05em" }}>
              ABRIR SESSÕES
            </Link>
            <Link href="/dashboard/squads" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "7px 16px", borderRadius: "6px", fontSize: "11px", fontFamily: "var(--font-mono)", textDecoration: "none", letterSpacing: "0.05em" }}>
              VER SQUADS
            </Link>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {[
            { label: "MEMÓRIA",      value: `${memoryCoverage}/${squads.length}`, sub: "squads com Mem0"       },
            { label: "HOJE",         value: completedToday.length,                sub: "sessões aprovadas"     },
            { label: "GOVERNANÇA",   value: approvals.length,                     sub: "checkpoints totais"   },
            { label: "PROCESSOS",    value: tasks.length,                         sub: "catalogados"          },
          ].map(item => (
            <div key={item.label} style={{ background: "var(--bg-card2)", borderRadius: "8px", padding: "12px 14px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{item.label}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{item.value}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

    </DashboardShell>
  );
}
