import type { Intake } from "@gota/contracts";
import { cx } from "@gota/ui";
import type { ReactNode } from "react";
import { formatMl, formatTime } from "@/shared/lib";

const LABELS: Record<Intake["kind"], string> = {
  sip: "Sip",
  manual: "Manual",
  refill: "Refill",
  unclassified: "Large drop",
};

export function IntakeRow({
  intake,
  timezone,
  actions,
}: {
  intake: Intake;
  timezone: string;
  actions?: ReactNode;
}) {
  const muted = intake.kind === "refill" || intake.status === "discarded";
  return (
    <li className="flex items-center gap-4 py-3">
      <time className="w-12 text-sm text-muted tabular-nums" dateTime={intake.occurred_at}>
        {formatTime(intake.occurred_at, timezone)}
      </time>
      <span className={cx("flex-1 text-sm", muted ? "text-muted" : "text-text")}>
        {LABELS[intake.kind]}
        {intake.status === "pending" && (
          <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-strong">
            needs review
          </span>
        )}
        {intake.status === "discarded" && <span className="ml-2 text-xs">discarded</span>}
      </span>
      <span
        className={cx(
          "text-sm tabular-nums",
          muted ? "text-muted" : "font-medium",
          intake.status === "discarded" && "line-through",
        )}
      >
        {intake.kind === "refill" ? "+" : ""}
        {formatMl(intake.volume_ml)}
      </span>
      {actions}
    </li>
  );
}
