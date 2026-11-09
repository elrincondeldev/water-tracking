import type { Intake } from "@gota/contracts";
import { Card } from "@gota/ui";
import { IntakeRow, useHistory } from "@/entities/intake";
import { useTodaySummary } from "@/entities/summary";
import { AddIntakeForm } from "@/features/add-intake";
import { EditIntakeActions } from "@/features/edit-intake";
import { ReviewDropActions } from "@/features/review-drop";
import { addDays, formatDay, todayIn } from "@/shared/lib";

function byLocalDay(intakes: Intake[], timezone: string): [string, Intake[]][] {
  const days = new Map<string, Intake[]>();
  for (const intake of intakes.toReversed()) {
    const day = todayIn(timezone, new Date(intake.occurred_at));
    days.set(day, [...(days.get(day) ?? []), intake]);
  }
  return [...days];
}

export function ReviewPage() {
  const summary = useTodaySummary();
  const timezone = summary.data?.timezone ?? "UTC";
  const today = summary.data?.date ?? todayIn(timezone);
  const month = useHistory(addDays(today, -29), today);
  const intakes = month.data?.intakes ?? [];
  const pending = intakes.filter((i) => i.status === "pending").toReversed();
  const recent = intakes.filter(
    (i) =>
      i.status !== "pending" && todayIn(timezone, new Date(i.occurred_at)) > addDays(today, -7),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Review</h1>

      <Card>
        <h2 className="font-medium">Needs review</h2>
        <p className="mt-1 text-sm text-muted">
          Drops over 600 ml, like emptying the bottle, are only counted if you say so.
        </p>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Nothing to review.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {pending.map((intake) => (
              <IntakeRow
                key={intake.id}
                intake={intake}
                timezone={timezone}
                actions={<ReviewDropActions intake={intake} />}
              />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Add water</h2>
        <AddIntakeForm />
      </Card>

      <Card>
        <h2 className="font-medium">Last 7 days</h2>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No drinks in the last week.</p>
        ) : (
          byLocalDay(recent, timezone).map(([day, dayIntakes]) => (
            <section key={day} className="mt-4">
              <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
                {formatDay(day, { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <ul className="divide-y divide-line">
                {dayIntakes.map((intake) => (
                  <IntakeRow
                    key={intake.id}
                    intake={intake}
                    timezone={timezone}
                    actions={
                      intake.kind === "refill" ? undefined : <EditIntakeActions intake={intake} />
                    }
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </Card>
    </div>
  );
}
