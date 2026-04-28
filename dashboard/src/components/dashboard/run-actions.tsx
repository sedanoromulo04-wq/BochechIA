"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Run, ThreadMessage } from "@/types/run";

// ─── Polling automático ───────────────────────────────────────────────────────
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
          const run: Run = await res.json();
          if (run.status !== "pending" && run.status !== "running") {
            if (!seen.current.has(id)) { seen.current.add(id); changed = true; }
          }
        } catch { /* silencia erros temporários */ }
      }
      if (changed) router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIds, router]);

  return null;
}

// ─── Thread de conversa CEO ↔ Agente ─────────────────────────────────────────
function MessageBubble({ msg }: { msg: ThreadMessage }) {
  const isCeo = msg.role === "ceo";
  return (
    <div className={`flex flex-col gap-1 ${isCeo ? "items-end" : "items-start"}`}>
      <span className="text-xs text-[var(--muted)] uppercase tracking-wide">
        {isCeo ? "Você" : "Agente"}
        {msg.modelId && !isCeo && ` · ${msg.modelId}`}
      </span>
      <div className={`max-w-[90%] border p-4 text-sm leading-6 whitespace-pre-wrap ${
        isCeo
          ? "border-[var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_6%,transparent)] text-foreground"
          : "border-[var(--border)] bg-[var(--surface-subtle)] text-foreground"
      }`}>
        {msg.content}
      </div>
      {msg.costUsd !== undefined && (
        <span className="text-xs text-[var(--muted)]">${msg.costUsd.toFixed(5)}</span>
      )}
    </div>
  );
}

export function ConversationThread({ messages }: { messages: ThreadMessage[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Conversa</p>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
      </div>
    </div>
  );
}

// ─── Painel de ações do CEO ───────────────────────────────────────────────────
export function CeoActions({
  runId,
  squadOptions,
}: {
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
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro");
      }
      setText("");
      setMode("idle");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 pt-3 border-t border-[var(--border)]">
      <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Sua decisão</p>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => send("approve")}
            disabled={loading}
            className="px-4 py-2 text-sm bg-[var(--success)] text-white hover:opacity-80 disabled:opacity-50 transition"
          >
            Aprovar
          </button>
          <button
            onClick={() => setMode("reply")}
            className="px-4 py-2 text-sm border border-[var(--accent)] text-[var(--accent)] hover:bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)] transition"
          >
            Responder ao agente
          </button>
          <button
            onClick={() => setMode("dispatch")}
            className="px-4 py-2 text-sm border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-foreground transition"
          >
            Despachar para outro squad →
          </button>
          <button
            onClick={() => setMode("reject")}
            className="px-4 py-2 text-sm border border-[var(--border)] text-[var(--muted)] hover:border-[var(--danger)] hover:text-[var(--danger)] transition"
          >
            Rejeitar
          </button>
        </div>
      )}

      {mode === "reply" && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted)]">
            O agente vai continuar a conversa com sua resposta como contexto.
          </p>
          <textarea
            autoFocus
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Responda as perguntas do agente, corrija, adicione contexto..."
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => send("reply", { replyText: text })}
              disabled={loading || !text.trim()}
              className="px-4 py-2 text-sm bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 transition"
            >
              {loading ? "Enviando..." : "Enviar resposta →"}
            </button>
            <button onClick={() => setMode("idle")} className="px-4 py-2 text-sm border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === "dispatch" && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted)]">
            O output atual será enviado como contexto para o squad escolhido.
          </p>
          <select
            value={targetSquad}
            onChange={(e) => setTargetSquad(e.target.value)}
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            {squadOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Instrução para o próximo squad (opcional) — ex: use o posicionamento acima para criar 5 headlines"
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => send("dispatch", { targetSquadId: targetSquad, dispatchNote: text })}
              disabled={loading || !targetSquad}
              className="px-4 py-2 text-sm bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 transition"
            >
              {loading ? "Despachando..." : `Despachar para ${targetSquad} →`}
            </button>
            <button onClick={() => setMode("idle")} className="px-4 py-2 text-sm border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div className="space-y-2">
          <textarea
            autoFocus
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Por que está rejeitando? (ajuda o agente a melhorar)"
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => send("reject", { rejectionReason: text })}
              disabled={loading}
              className="px-4 py-2 text-sm bg-[var(--danger)] text-white hover:opacity-80 disabled:opacity-50 transition"
            >
              {loading ? "Rejeitando..." : "Confirmar rejeição"}
            </button>
            <button onClick={() => setMode("idle")} className="px-4 py-2 text-sm border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] transition">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Formulário de nova demanda ───────────────────────────────────────────────
const SQUAD_LABELS: Record<string, string> = {
  "copy-squad":      "Copywriting",
  "brand-squad":     "Marca & Posicionamento",
  "hormozi-squad":   "Ofertas & Crescimento",
  "content-squad":   "Conteúdo & Storytelling",
  "traffic-masters": "Tráfego & Distribuição",
  "data-squad":      "Dados & Relatórios",
  "c-level-squad":   "Estratégia C-Level",
};

const TASK_LABELS: Record<string, string> = {
  "write-headline":       "Escrever headlines",
  "write-bullets":        "Escrever bullets de benefícios",
  "write-sales-letter":   "Escrever carta de vendas",
  "write-vsl-script":     "Escrever roteiro de VSL",
  "write-email-sequence": "Criar sequência de email",
  "write-ad-copy":        "Escrever copy de anúncio",
  "write-landing-page":   "Escrever landing page",
  "create-offer":         "Criar oferta",
  "create-positioning":   "Criar posicionamento",
  "create-brand-story":   "Criar história de marca",
  "audit-brand":          "Auditar marca",
  "analyze-data":         "Analisar dados",
  "create-hooks":         "Criar hooks",
  "create-funnel-copy":   "Escrever copy de funil",
  "build-movement":       "Construir movimento de marca",
  "set-vision":           "Definir visão estratégica",
  "write-manifesto":      "Escrever manifesto",
  "diagnose":             "Fazer diagnóstico",
  "review":               "Revisar material",
  "analyze-copy":         "Analisar copy existente",
};

export function NewDemandForm({ clients, squads, tasks }: {
  clients: Array<{ id: string; company: string }>;
  squads: Array<{ id: string; short_title: string }>;
  tasks: Array<{ slug: string; title: string; squadId: string }>;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [squadId, setSquadId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const squadsForDisplay = squads.map((s) => ({
    ...s,
    label: SQUAD_LABELS[s.id] ?? s.short_title,
  }));

  const filteredTasks = tasks
    .filter((t) => !squadId || t.squadId === squadId)
    .map((t) => ({ ...t, label: TASK_LABELS[t.slug] ?? t.title }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || !clientId) return;
    setLoading(true);
    setError(null);
    setSent(false);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          squadId: squadId || squads[0]?.id,
          taskName: taskName || undefined,
          prompt,
          hasClientData: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao criar demanda");
      }
      setPrompt("");
      setTaskName("");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Nova demanda</h3>
        <p className="text-sm text-[var(--muted)] mt-1">
          Descreva o que você precisa. O sistema escolhe o modelo certo automaticamente.
        </p>
      </div>

      {error && (
        <div className="border border-[var(--danger)] bg-[color:color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      )}
      {sent && (
        <div className="border border-[var(--success)] bg-[color:color-mix(in_srgb,var(--success)_8%,transparent)] px-4 py-3">
          <p className="text-sm text-[var(--success)]">Demanda enviada — o agente já está trabalhando.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Cliente</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Equipe</label>
          <select
            value={squadId}
            onChange={(e) => { setSquadId(e.target.value); setTaskName(""); }}
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">— qualquer equipe —</option>
            {squadsForDisplay.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Tipo de entrega</label>
          <select
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">— deixar o agente decidir —</option>
            {filteredTasks.map((t) => <option key={`${t.squadId}-${t.slug}`} value={t.slug}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">O que você precisa?</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Ex: Preciso de 5 headlines para o lançamento do curso de copywriting do João. Público: empreendedores 35-50 anos. Tom: direto, sem enrolação."
          className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
          required
        />
        <p className="text-xs text-[var(--muted)]">
          Quanto mais contexto, melhor o resultado. Fale como falaria para um colaborador sênior.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium bg-[var(--accent)] text-white transition hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Enviando para o agente..." : "Enviar demanda →"}
      </button>
    </form>
  );
}
