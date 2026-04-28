import Link from "next/link";
import type { ReactNode } from "react";
import type { ModelSpec } from "@/types/model";

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const nav = [
    { href: "/dashboard/runs",    label: "Demandas" },
    { href: "/dashboard",         label: "Visão geral" },
    { href: "/dashboard/clients", label: "Clientes" },
    { href: "/dashboard/squads",  label: "Equipes" },
    { href: "/dashboard/tasks",   label: "Capacidades" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">BochechIA</p>
                <h1 className="text-xl font-semibold tracking-tight mt-0.5">{title}</h1>
                <p className="max-w-2xl text-sm leading-5 text-[var(--muted)] mt-1">{description}</p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

export function ResourceCard({
  title,
  subtitle,
  href,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children?: ReactNode;
}) {
  const body = (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle ? <p className="text-sm leading-6 text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const tone =
    value === "active" || value === "approved" || value === "completed" || value === "ready"
      ? "bg-[color:color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]"
      : value === "awaiting_approval" || value === "review" || value === "paused"
        ? "bg-[color:color-mix(in_srgb,var(--warning)_16%,transparent)] text-[var(--warning)]"
        : value === "error" || value === "rejected"
          ? "bg-[color:color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]"
          : "bg-[var(--surface-subtle)] text-[var(--muted)]";

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${tone}`}>
      {label ?? value}
    </span>
  );
}

export function ModelBadge({ model }: { model: ModelSpec | string }) {
  const label = typeof model === "string" ? model : model.id;
  const isAnthropic = label.startsWith("claude-");
  return (
    <span className={`inline-flex items-center border px-2 py-1 text-xs ${
      isAnthropic
        ? "border-[var(--accent)] text-[var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)]"
        : "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted)]"
    }`}>
      {label}
    </span>
  );
}

export function KeyValueList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="border border-[var(--border)] bg-[var(--surface)] p-4">
          <dt className="text-sm text-[var(--muted)]">{item.label}</dt>
          <dd className="mt-2 text-sm leading-6">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{body}</p>
    </div>
  );
}
