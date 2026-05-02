export function Progress({ value = 0, className = "" }: { value?: number; className?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full overflow-hidden rounded bg-[var(--surface-subtle)] ${className}`}>
      <div className="h-full bg-[var(--accent)]" style={{ width: `${safe}%` }} />
    </div>
  );
}
