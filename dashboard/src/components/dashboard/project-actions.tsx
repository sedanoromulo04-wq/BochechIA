"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Project } from "@/types/client";

const PROJECT_STATUSES: Project["status"][] = ["pending", "active", "review", "completed", "paused"];

const STATUS_LABEL: Record<Project["status"], string> = {
  pending:   "Pendente",
  active:    "Ativo",
  review:    "Em revisão",
  completed: "Concluído",
  paused:    "Pausado",
};

// Atualiza status de um projeto inline na tela de detalhe
export function ProjectStatusForm({
  clientId,
  projectId,
  current,
}: {
  clientId: string;
  projectId: string;
  current: Project["status"];
}) {
  const [status, setStatus] = useState(current);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleChange(next: Project["status"]) {
    setStatus(next);
    startTransition(async () => {
      await fetch(`/api/clients/${clientId}/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {PROJECT_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => handleChange(s)}
          disabled={isPending}
          className={`px-2 py-1 text-xs font-medium border transition ${
            status === s
              ? "border-[var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]"
              : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-foreground"
          } disabled:opacity-50`}
        >
          {STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

// Formulário de criação de novo projeto, usado na tela do cliente
export function NewProjectForm({
  clientId,
  squads,
}: {
  clientId: string;
  squads: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [objective, setObj]     = useState("");
  const [squad, setSquad]       = useState(squads[0] ?? "");
  const [tags, setTags]         = useState("");

  function reset() {
    setName(""); setDesc(""); setObj(""); setTags(""); setError(null);
    setSquad(squads[0] ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/clients/${clientId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          objective: objective || undefined,
          squad,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Erro ao criar projeto");
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white transition hover:opacity-90"
      >
        + Novo projeto
      </button>
    );
  }

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Novo projeto</h3>
        <button
          onClick={() => { setOpen(false); reset(); }}
          className="text-sm text-[var(--muted)] hover:text-foreground transition"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
              Nome <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Brand Foundation Q2"
              className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
              Squad responsável <span className="text-[var(--danger)]">*</span>
            </label>
            <select
              required
              value={squad}
              onChange={(e) => setSquad(e.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {squads.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Descrição
          </label>
          <input
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Contexto breve sobre o projeto"
            className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Objetivo
          </label>
          <input
            value={objective}
            onChange={(e) => setObj(e.target.value)}
            placeholder="O que precisa ser entregue ao final"
            className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Tags (separadas por vírgula)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Ex: copy, lançamento, email"
            className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { setOpen(false); reset(); }}
            className="px-4 py-2 text-sm border border-[var(--border)] text-[var(--muted)] hover:text-foreground transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Criando..." : "Criar projeto"}
          </button>
        </div>
      </form>
    </div>
  );
}
