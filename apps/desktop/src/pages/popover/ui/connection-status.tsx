import { cx } from "@gota/ui";

type ConnectionStatusProps = {
  label: string;
  healthy: boolean;
};

export function ConnectionStatus({ label, healthy }: ConnectionStatusProps) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span
        aria-hidden
        className={cx("size-1.5 rounded-full", healthy ? "bg-accent" : "bg-muted/60")}
      />
      {label}
    </span>
  );
}
