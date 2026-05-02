import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "outline" | "ghost" | "secondary" | "destructive";
type Size = "sm" | "md";

function variantClasses(variant: Variant): string {
  switch (variant) {
    case "outline":
      return "border border-[var(--border)] bg-transparent text-foreground";
    case "ghost":
      return "border border-transparent bg-transparent text-foreground";
    case "secondary":
      return "bg-[var(--surface-subtle)] text-foreground";
    case "destructive":
      return "bg-[var(--danger)] text-white";
    default:
      return "bg-[var(--accent)] text-white";
  }
}

function sizeClasses(size: Size): string {
  return size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-2 text-sm";
}

export function Button({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      className={`${variantClasses(variant)} ${sizeClasses(size)} transition hover:opacity-90 disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
