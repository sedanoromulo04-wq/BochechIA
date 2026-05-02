"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SourceKind } from "@/types/knowledge";

const KIND_OPTIONS: { value: SourceKind; label: string }[] = [
  { value: "document",  label: "Documento" },
  { value: "meeting",   label: "Transcrição de reunião" },
  { value: "note",      label: "Nota operacional" },
  { value: "approved-output", label: "Output aprovado" },
];

export function IngestDocumentForm({
  clientId,
  projectId,
}: {
  clientId: string;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [kind, setKind]       = useState<SourceKind>("document");
  const [tags, setTags]       = useState("");

  function reset() {
    setTitle(""); setContent(""); setKind("document"); setTags(""); setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/clients/${clientId}/projects/${projectId}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            kind,
            tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Erro ao ingerir documento");
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
        className="px-4 py-2 text-sm font-medium border border-[var(--accent)] text-[var(--accent)] transition hover:bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)]"
      >
        + Ingerir documento
      </button>
    );
  }

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Ingerir documento no projeto</h3>
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
              Título <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião de briefing 2026-04-27"
              className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
              Tipo
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as SourceKind)}
              className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Conteúdo <span className="text-[var(--danger)]">*</span>
          </label>
          <textarea
            required
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui a transcrição, o documento ou as notas de reunião..."
            className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-y font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Tags (separadas por vírgula)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Ex: briefing, cliente, reunião"
            className="w-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

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
            {isPending ? "Indexando..." : "Ingerir e indexar"}
          </button>
        </div>
      </form>
    </div>
  );
}
