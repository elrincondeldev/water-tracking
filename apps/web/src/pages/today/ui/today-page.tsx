import { Button, Card } from "@gota/ui";
import { DeviceStatus, useDevice } from "@/entities/device";
import { useTodaySummary } from "@/entities/summary";
import { formatAgo, formatGrams, useNow } from "@/shared/lib";
import { TodayProgress } from "./today-progress";
import { TodayTimeline } from "./today-timeline";

export function TodayPage() {
  const summary = useTodaySummary();
  const device = useDevice();
  const now = useNow();

  if (summary.isError) {
    return (
      <Card className="text-center">
        <p className="text-sm text-muted">Can't reach the Gota API.</p>
        <Button variant="secondary" className="mt-4" onClick={() => void summary.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }
  if (!summary.data) return <p className="text-sm text-muted">Loading…</p>;

  const { data } = summary;
  return (
    <div className="flex flex-col gap-8">
      <TodayProgress summary={data} />
      <dl className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-sunken px-4 py-3">
          <dt className="text-xs text-muted">Last drink</dt>
          <dd className="mt-1 text-sm font-medium">
            {data.last_intake_at ? formatAgo(data.last_intake_at, now) : "—"}
          </dd>
        </div>
        <div className="rounded-2xl bg-sunken px-4 py-3">
          <dt className="text-xs text-muted">On the coaster</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums">
            {data.bottle_weight_g === null ? "Empty" : formatGrams(data.bottle_weight_g)}
          </dd>
        </div>
      </dl>
      <div className="flex justify-center">
        <DeviceStatus device={device.data ?? null} />
      </div>
      <TodayTimeline date={data.date} timezone={data.timezone} />
    </div>
  );
}
