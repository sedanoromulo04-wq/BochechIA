import type { ReactNode } from "react";

export function Badge({
  children,
  className = "",
  variant = "outline",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
}) {
  const tone =
    variant === "secondary"
      ? "bg-[var(--surface-subtle)] text-foreground"
      : variant === "destructive"
        ? "bg-[var(--danger)] text-white"
        : "border border-[var(--border)] bg-transparent text-[var(--muted)]";

  return <span className={`inline-flex items-center px-2 py-1 text-xs ${tone} ${className}`}>{children}</span>;
}
