"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { ModelSpec } from "@/types/model";

const nav = [
  { href: "/dashboard",             label: "Central" },
  { href: "/dashboard/runs",        label: "Sessões" },
  { href: "/dashboard/approvals",   label: "Aprovações" },
  { href: "/dashboard/squads",      label: "Squads" },
  { href: "/dashboard/tasks",       label: "Processos" },
  { href: "/dashboard/knowledge",   label: "Knowledge" },
  { href: "/dashboard/decisions",   label: "Decisões" },
  { href: "/dashboard/connectors",  label: "Conectores" },
];

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", position: "relative", zIndex: 1 }}>
      <NavBar />
      <main style={{ paddingTop: "52px", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1536px", margin: "0 auto", padding: "32px 32px 48px" }}>
          <PageHeader title={title} description={description} />
          {children}
        </div>
      </main>
    </div>
  );
}

function NavBar() {
  const pathname = usePathname();
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, height: "52px",
      background: "rgba(4, 8, 16, 0.92)",
      borderBottom: "1px solid var(--border)",
      backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
      zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "var(--font-mono)", fontSize: "13px", letterSpacing: "0.15em", color: "var(--cyan)", textTransform: "uppercase" }}>
        <div style={{
          width: "28px", height: "28px",
          border: "1.5px solid var(--cyan)",
          borderRadius: "6px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px",
          boxShadow: "0 0 12px var(--cyan-dim), inset 0 0 8px rgba(124,196,250,0.05)",
          animation: "logoGlow 3s ease-in-out infinite",
        }}>⬡</div>
        BochechIA
      </div>

      <nav style={{ display: "flex", gap: "4px" }}>
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                border: active ? "1px solid rgba(124,196,250,0.2)" : "1px solid transparent",
                background: active ? "rgba(124,196,250,0.08)" : "transparent",
                color: active ? "var(--cyan)" : "var(--text-secondary)",
                textDecoration: "none",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
        <LiveClock />
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--green)" }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "var(--green)", boxShadow: "0 0 6px var(--green)",
            display: "inline-block",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          SYSTEM ONLINE
        </span>
      </div>

      <style>{`
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 0 12px var(--cyan-dim), inset 0 0 8px rgba(124,196,250,0.05); }
          50%       { box-shadow: 0 0 20px rgba(124,196,250,0.4), inset 0 0 12px rgba(124,196,250,0.1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes sectionIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        a[data-nav]:hover {
          color: var(--text-primary) !important;
          background: rgba(124,196,250,0.05) !important;
        }
      `}</style>
    </header>
  );
}

function LiveClock() {
  if (typeof window === "undefined") return <span>--:--:--</span>;
  return <ClockInner />;
}

function ClockInner() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span>
      {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

import React from "react";

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>
          BochechIA OS
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            {description}
          </p>
        )}
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
    <section style={{ marginBottom: "40px", animation: "sectionIn 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            {title}
          </h2>
          {description && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              {description}
            </p>
          )}
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
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "22px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, var(--cyan), transparent)",
      }} />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "34px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--text-primary)", marginBottom: "8px" }}>
        {value}
      </p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
        {detail}
      </p>
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
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "18px 20px",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,196,250,0.3)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px rgba(124,196,250,0.08), 0 4px 24px rgba(124,196,250,0.06)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
    }}
    >
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: subtitle ? "4px" : 0 }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      {children && <div style={{ marginTop: "14px" }}>{children}</div>}
    </div>
  );

  return href ? <Link href={href} style={{ textDecoration: "none" }}>{body}</Link> : body;
}

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  let color: string;
  let bg: string;
  let border: string;

  if (["active", "approved", "completed", "ready"].includes(value)) {
    color = "var(--green)";
    bg = "rgba(50,213,131,0.1)";
    border = "rgba(50,213,131,0.2)";
  } else if (["awaiting_approval", "review", "paused"].includes(value)) {
    color = "var(--yellow)";
    bg = "rgba(251,191,36,0.1)";
    border = "rgba(251,191,36,0.2)";
  } else if (["error", "rejected"].includes(value)) {
    color = "var(--red)";
    bg = "rgba(248,113,113,0.1)";
    border = "rgba(248,113,113,0.2)";
  } else if (value === "running") {
    color = "var(--cyan)";
    bg = "rgba(124,196,250,0.1)";
    border = "rgba(124,196,250,0.2)";
  } else {
    color = "var(--text-muted)";
    bg = "rgba(100,116,139,0.1)";
    border = "rgba(100,116,139,0.2)";
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 9px",
      borderRadius: "20px",
      fontSize: "10px", fontWeight: 600,
      letterSpacing: "0.05em", textTransform: "uppercase",
      fontFamily: "var(--font-mono)",
      color, background: bg, border: `1px solid ${border}`,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, display: "inline-block" }} />
      {label ?? value}
    </span>
  );
}

export function ModelBadge({ model }: { model: ModelSpec | string }) {
  const label = typeof model === "string" ? model : model.id;
  const isAnthropic = label.startsWith("claude-");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 9px",
      borderRadius: "4px",
      fontSize: "10px", fontWeight: 500,
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.03em",
      border: isAnthropic ? "1px solid rgba(124,196,250,0.3)" : "1px solid var(--border)",
      background: isAnthropic ? "rgba(124,196,250,0.08)" : "var(--bg-card2)",
      color: isAnthropic ? "var(--cyan)" : "var(--text-muted)",
    }}>
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
    <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
      {items.map((item) => (
        <div key={item.label} style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "14px 16px",
        }}>
          <dt style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
            {item.label}
          </dt>
          <dd style={{ fontSize: "13px", color: "var(--text-primary)" }}>{item.value}</dd>
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
    <div style={{
      background: "var(--bg-card)",
      border: "1px dashed var(--border)",
      borderRadius: "10px",
      padding: "40px 24px",
      textAlign: "center",
    }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>{title}</h3>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>{body}</p>
    </div>
  );
}
