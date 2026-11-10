import type { Intake, IntakeKind } from "@gota/contracts";
import { formatMl, formatTime } from "@gota/ui";
import { DropIcon } from "@/shared/ui";

const KIND_LABEL: Record<IntakeKind, string> = {
  sip: "Sip",
  manual: "Added by hand",
  unclassified: "Confirmed drop",
  refill: "Refill",
};

type RecentIntakesProps = {
  intakes: Intake[];
  timezone: string;
};

export function RecentIntakes({ intakes, timezone }: RecentIntakesProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <h2 className="px-1 text-[11px] font-medium text-muted">Recent</h2>
      {intakes.length === 0 ? (
        <p className="rounded-xl border border-pane-line bg-pane px-3 py-5 text-center text-muted">
          No drinks yet today
        </p>
      ) : (
        <ul className="divide-y divide-pane-line overflow-hidden rounded-xl border border-pane-line bg-pane">
          {intakes.map((intake) => (
            <li key={intake.id} className="flex items-center gap-2.5 px-3 py-2">
              <DropIcon className="size-3.5 shrink-0 text-accent" />
              <span className="font-medium tabular-nums">{formatMl(intake.volume_ml)}</span>
              <span className="truncate text-xs text-muted">{KIND_LABEL[intake.kind]}</span>
              <time
                className="ml-auto text-xs text-muted tabular-nums"
                dateTime={intake.occurred_at}
              >
                {formatTime(intake.occurred_at, timezone)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
