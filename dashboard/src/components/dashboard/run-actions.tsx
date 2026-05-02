"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ThreadMessage } from "@/types/run";

/* ── polling ── */
export function RunPoller({ activeIds }: { activeIds: string[] }) {
  const router = useRouter();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeIds.length === 0) return;
    const interval = setInterval(async () => {
      let changed = false;
      for (const id of activeIds) {
        try {
          const res = await fetch(`/api/runs/${id}`);
          const run = await res.json();
          if (run.status !== "pending" && run.status !== "running") {
            if (!seen.current.has(id)) { seen.current.add(id); changed = true; }
          }
        } catch { /* ignora erros de rede */ }
      }
      if (changed) router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIds, router]);

  return null;
}

/* ── conversation thread ── */
function MessageBubble({ msg }: { msg: ThreadMessage }) {
  const isCeo = msg.role === "ceo";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: isCeo ? "flex-end" : "flex-start" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {isCeo ? "Você" : "Agente"}{msg.modelId && !isCeo ? ` · ${msg.modelId}` : ""}
      </span>
      <div style={{
        maxWidth: "90%",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "12px",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        background: isCeo ? "rgba(124,196,250,0.08)" : "var(--bg-card2)",
        border: isCeo ? "1px solid rgba(124,196,250,0.25)" : "1px solid var(--border)",
        color: "var(--text-primary)",
      }}>
        {msg.content}
      </div>
      {msg.costUsd !== undefined && (
        <span style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>${msg.costUsd.toFixed(5)}</span>
      )}
    </div>
  );
}

export function ConversationThread({ messages }: { messages: ThreadMessage[] }) {
  if (!messages || messages.length === 0) return null;
  const latest = messages[messages.length - 1];
  const older = messages.slice(0, -1);

  return (
    <div style={{ marginBottom: "10px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Última interação</p>
      <MessageBubble msg={latest} />
      {older.length > 0 && (
        <details style={{ marginTop: "8px" }}>
          <summary style={{
            cursor: "pointer",
            listStyle: "none",
            padding: "8px 12px",
            background: "var(--bg-card2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-muted)",
          }}>
            Ver histórico ({older.length} mensagens)
          </summary>
          <div style={{ maxHeight: "280px", overflowY: "auto", padding: "10px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
            {older.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          </div>
        </details>
      )}
    </div>
  );
}

/* ── CEO actions ── */
const btnBase: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "6px",
  fontSize: "11px",
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  border: "none",
  transition: "opacity 0.15s",
};

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card2)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "var(--text-primary)",
  fontFamily: "var(--font-sans)",
  outline: "none",
  resize: "none" as const,
};

export function CeoActions({ runId, squadOptions }: {
  runId: string;
  squadOptions: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "reply" | "dispatch" | "reject">("idle");
  const [text, setText] = useState("");
  const [targetSquad, setTargetSquad] = useState(squadOptions[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: string, extra: Record<string, string> = {}) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, approvedBy: "ceo", ...extra }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erro"); }
      setText(""); setMode("idle"); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Sua Decisão</p>
      {error && <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--red)", marginBottom: "8px" }}>{error}</p>}

      {mode === "idle" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <button onClick={() => send("approve")} disabled={loading} style={{ ...btnBase, background: "rgba(50,213,131,0.15)", color: "var(--green)", border: "1px solid rgba(50,213,131,0.3)" }}>
            ✓ APROVAR
          </button>
          <button onClick={() => setMode("reply")} style={{ ...btnBase, background: "rgba(124,196,250,0.1)", color: "var(--cyan)", border: "1px solid rgba(124,196,250,0.25)" }}>
            ↩ RESPONDER
          </button>
          <button onClick={() => setMode("dispatch")} style={{ ...btnBase, background: "var(--bg-card2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            → DESPACHAR
          </button>
          <button onClick={() => setMode("reject")} style={{ ...btnBase, background: "rgba(248,113,113,0.1)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.2)" }}>
            ✕ REJEITAR
          </button>
        </div>
      )}

      {mode === "reply" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>O agente vai continuar com sua resposta como contexto.</p>
          <textarea autoFocus rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Responda, corrija ou adicione contexto..." style={inputBase} />
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => send("reply", { replyText: text })} disabled={loading || !text.trim()} style={{ ...btnBase, background: "var(--cyan)", color: "#040810", opacity: loading || !text.trim() ? 0.4 : 1 }}>
              {loading ? "ENVIANDO..." : "ENVIAR →"}
            </button>
            <button onClick={() => setMode("idle")} style={{ ...btnBase, background: "var(--bg-card2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>CANCELAR</button>
          </div>
        </div>
      )}

      {mode === "dispatch" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>O output atual vai como contexto para o squad escolhido.</p>
          <select value={targetSquad} onChange={e => setTargetSquad(e.target.value)} style={{ ...inputBase, resize: undefined }}>
            {squadOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <textarea rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Instrução para o próximo squad (opcional)" style={inputBase} />
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => send("dispatch", { targetSquadId: targetSquad, dispatchNote: text })} disabled={loading || !targetSquad} style={{ ...btnBase, background: "var(--cyan)", color: "#040810", opacity: loading || !targetSquad ? 0.4 : 1 }}>
              {loading ? "DESPACHANDO..." : `DESPACHAR →`}
            </button>
            <button onClick={() => setMode("idle")} style={{ ...btnBase, background: "var(--bg-card2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>CANCELAR</button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <textarea autoFocus rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Por que está rejeitando? (ajuda o agente a melhorar)" style={inputBase} />
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => send("reject", { rejectionReason: text })} disabled={loading} style={{ ...btnBase, background: "rgba(248,113,113,0.15)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.3)", opacity: loading ? 0.5 : 1 }}>
              {loading ? "REJEITANDO..." : "CONFIRMAR REJEIÇÃO"}
            </button>
            <button onClick={() => setMode("idle")} style={{ ...btnBase, background: "var(--bg-card2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── labels ── */
const SQUAD_LABELS: Record<string, string> = {
  "copy-squad": "Copy Squad",
  "brand-squad": "Brand Squad",
  "hormozi-squad": "Hormozi Squad",
  "content-squad": "Content Squad",
  "traffic-masters": "Traffic Masters",
  "data-squad": "Data Squad",
  "c-level-squad": "C-Level Squad",
};

const TASK_LABELS: Record<string, string> = {
  "write-headline": "Escrever headlines",
  "write-bullets": "Escrever bullets de benefícios",
  "write-sales-letter": "Escrever carta de vendas",
  "write-vsl-script": "Escrever roteiro de VSL",
  "write-email-sequence": "Criar sequência de email",
  "write-ad-copy": "Escrever copy de anúncio",
  "write-landing-page": "Escrever landing page",
  "create-offer": "Criar oferta",
  "create-positioning": "Criar posicionamento",
  "create-brand-story": "Criar história de marca",
  "audit-brand": "Auditar marca",
  "analyze-data": "Analisar dados",
  "create-hooks": "Criar hooks",
  "create-funnel-copy": "Escrever copy de funil",
  "build-movement": "Construir movimento de marca",
  "set-vision": "Definir visão estratégica",
  "write-manifesto": "Escrever manifesto",
  diagnose: "Fazer diagnóstico",
  review: "Revisar material",
  "analyze-copy": "Analisar copy existente",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card2)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "var(--text-primary)",
  fontFamily: "var(--font-sans)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "6px",
  display: "block",
};

/* ── new demand form ── */
export function NewDemandForm({
  clients, squads, tasks,
  defaultClientId, defaultProjectId, defaultSquadId,
}: {
  clients: Array<{ id: string; company: string; projects?: Array<{ id: string; name: string }> }>;
  squads: Array<{ id: string; short_title: string }>;
  tasks: Array<{ slug: string; title: string; squadId: string }>;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultSquadId?: string;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(defaultClientId ?? clients[0]?.id ?? "");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [squadId, setSquadId] = useState(defaultSquadId ?? "");
  const [taskName, setTaskName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const selectedClient = clients.find(c => c.id === clientId);
  const projectOptions = selectedClient?.projects ?? [];
  const squadsForDisplay = squads.map(s => ({ ...s, label: SQUAD_LABELS[s.id] ?? s.short_title }));
  const filteredTasks = tasks.filter(t => !squadId || t.squadId === squadId).map(t => ({ ...t, label: TASK_LABELS[t.slug] ?? t.title }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || !clientId) return;
    setLoading(true); setError(null); setSent(false);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, projectId: projectId || undefined, squadId: squadId || squads[0]?.id, taskName: taskName || undefined, prompt, hasClientData: true }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erro ao criar run"); }
      setPrompt(""); setTaskName(""); setSent(true);
      setTimeout(() => setSent(false), 4000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px", padding: "10px 14px", marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--red)" }}>{error}</p>
        </div>
      )}
      {sent && (
        <div style={{ background: "rgba(50,213,131,0.08)", border: "1px solid rgba(50,213,131,0.2)", borderRadius: "6px", padding: "10px 14px", marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--green)" }}>Run criado — o cérebro já iniciou o fluxo.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={labelStyle}>Cliente</label>
          <select value={clientId} onChange={e => { setClientId(e.target.value); setProjectId(""); }} style={selectStyle}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Projeto</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} style={selectStyle}>
            <option value="">— sem projeto específico —</option>
            {projectOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Squad</label>
          <select value={squadId} onChange={e => { setSquadId(e.target.value); setTaskName(""); }} style={selectStyle}>
            <option value="">— qualquer squad —</option>
            {squadsForDisplay.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Processo</label>
          <select value={taskName} onChange={e => setTaskName(e.target.value)} style={selectStyle}>
            <option value="">— deixar o cérebro decidir —</option>
            {filteredTasks.map(t => <option key={`${t.squadId}-${t.slug}`} value={t.slug}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Demanda</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="Ex: estruturar um SOP de aprovação de conteúdo para a equipe interna."
          style={{ ...inputBase, resize: "none" }}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        style={{ ...btnBase, background: "var(--cyan)", color: "#040810", padding: "9px 20px", fontSize: "12px", opacity: loading || !prompt.trim() ? 0.4 : 1 }}
      >
        {loading ? "PLANEJANDO EXECUÇÃO..." : "CRIAR RUN →"}
      </button>
    </form>
  );
}
