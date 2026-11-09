import { Card } from "@gota/ui";
import { IntakeRow, useHistory } from "@/entities/intake";

export function TodayTimeline({ date, timezone }: { date: string; timezone: string }) {
  const { data } = useHistory(date, date);
  const intakes = (data?.intakes ?? []).toReversed();
  return (
    <Card>
      <h2 className="text-sm font-medium text-muted">Today</h2>
      {intakes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No drinks yet today.</p>
      ) : (
        <ul className="divide-y divide-line">
          {intakes.map((intake) => (
            <IntakeRow key={intake.id} intake={intake} timezone={timezone} />
          ))}
        </ul>
      )}
    </Card>
  );
}
