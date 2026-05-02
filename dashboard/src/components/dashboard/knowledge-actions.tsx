"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SourceIngestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("operations");
  const [kind, setKind] = useState("document");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, domain, kind, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na ingestão");
      setTitle("");
      setContent("");
      setMessage("Fonte ingerida e indexada com sucesso.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold">Nova fonte</h3>
        <p className="text-sm text-[var(--muted)] mt-1">
          Ingestão manual de SOPs, políticas e notas operacionais.
        </p>
      </div>
      {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Domínio"
          className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="document">Document</option>
          <option value="policy">Policy</option>
          <option value="note">Note</option>
          <option value="meeting">Meeting</option>
        </select>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="Cole o conteúdo bruto aqui."
        className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
      />
      <button
        type="submit"
        disabled={loading || !title.trim() || !content.trim()}
        className="px-5 py-2 text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 transition"
      >
        {loading ? "Indexando..." : "Ingerir fonte"}
      </button>
    </form>
  );
}

export function KnowledgeSearchPanel() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    confidence: number;
    citations: Array<{ title: string; excerpt: string }>;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na consulta");
      setResult({
        confidence: data.confidence,
        citations: data.citations ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold">Busca operacional</h3>
        <p className="text-sm text-[var(--muted)] mt-1">
          Teste retrieval híbrido e veja as citações usadas pelo cérebro.
        </p>
      </div>
      <div className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: quais regras exigem approval?"
          className="flex-1 border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-5 py-2 text-sm font-medium border border-[var(--accent)] text-[var(--accent)] hover:bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)] disabled:opacity-40 transition"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {result && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Confiança: <span className="text-foreground font-medium">{result.confidence.toFixed(3)}</span>
          </p>
          <div className="space-y-2">
            {result.citations.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Nenhuma citação encontrada.</p>
            ) : (
              result.citations.map((citation, index) => (
                <div key={`${citation.title}-${index}`} className="border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
                  <p className="text-sm font-medium">{citation.title}</p>
                  <p className="text-sm text-[var(--muted)] mt-1">{citation.excerpt}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
