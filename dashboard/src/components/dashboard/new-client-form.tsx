"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ALL_SQUADS = [
  { id: "copy-squad",      label: "Copywriting" },
  { id: "brand-squad",     label: "Marca & Posicionamento" },
  { id: "hormozi-squad",   label: "Ofertas & Crescimento" },
  { id: "content-squad",   label: "Conteúdo & Storytelling" },
  { id: "traffic-masters", label: "Tráfego & Distribuição" },
  { id: "data-squad",      label: "Dados & Relatórios" },
  { id: "c-level-squad",   label: "Estratégia C-Level" },
];

export function NewClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [niche, setNiche] = useState("");
  const [contact, setContact] = useState("");
  const [squads, setSquads] = useState<string[]>(["copy-squad", "brand-squad"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSquad(id: string) {
    setSquads((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !company || !niche) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, niche, primary_contact: contact, squads_active: squads }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao cadastrar");
      router.push(`/dashboard/clients/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border border-[var(--border)] bg-[var(--surface)] p-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Dados do cliente</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Após cadastrar, você pode enviar demandas para este cliente imediatamente.
        </p>
      </div>

      {error && (
        <div className="border border-[var(--danger)] bg-[color:color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
              Nome do responsável <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              required
              className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
              Empresa / Projeto <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Ex: Academia do Copy"
              required
              className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Nicho / Mercado <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ex: Infoprodutos de copywriting para empreendedores brasileiros"
            required
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <p className="text-xs text-[var(--muted)]">
            Descreva o mercado com detalhe — isso fica na memória do cliente e orienta todos os agentes.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Contato principal (opcional)
          </label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Ex: joao@academiadocopy.com.br"
            className="w-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Equipes ativas para este cliente
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_SQUADS.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 border px-3 py-2.5 cursor-pointer transition ${
                  squads.includes(s.id)
                    ? "border-[var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_6%,transparent)]"
                    : "border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={squads.includes(s.id)}
                  onChange={() => toggleSquad(s.id)}
                  className="h-4 w-4 shrink-0"
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Pode alterar depois. Define quais equipes aparecem no formulário de demanda para este cliente.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !name || !company || !niche}
          className="px-6 py-2.5 text-sm font-medium bg-[var(--accent)] text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Cadastrando..." : "Cadastrar cliente →"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-sm border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--accent)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
