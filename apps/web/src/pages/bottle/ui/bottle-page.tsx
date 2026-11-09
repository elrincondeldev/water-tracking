import { Card } from "@gota/ui";
import { useBottle } from "@/entities/bottle";
import { DeviceStatus, useDevice } from "@/entities/device";
import { useTodaySummary } from "@/entities/summary";
import { ResetBottleForm } from "@/features/reset-bottle";
import { formatDay, formatGrams, formatMl, todayIn } from "@/shared/lib";

export function BottlePage() {
  const bottle = useBottle();
  const summary = useTodaySummary();
  const device = useDevice();
  const timezone = summary.data?.timezone ?? "UTC";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Bottle</h1>
      <Card>
        {bottle.data ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-medium">{bottle.data.name ?? `Bottle ${bottle.data.id}`}</h2>
              <DeviceStatus device={device.data ?? null} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted">Counting since</dt>
              <dd className="text-right">
                {formatDay(todayIn(timezone, new Date(bottle.data.started_at)), {
                  day: "numeric",
                  month: "long",
                })}
              </dd>
              <dt className="text-muted">Starting point</dt>
              <dd className="text-right tabular-nums">
                {bottle.data.baseline_g === null
                  ? "Waiting for the bottle"
                  : formatGrams(bottle.data.baseline_g)}
              </dd>
              <dt className="text-muted">On the coaster now</dt>
              <dd className="text-right tabular-nums">
                {summary.data?.bottle_weight_g == null
                  ? "Empty"
                  : formatGrams(summary.data.bottle_weight_g)}
              </dd>
              {bottle.data.capacity_ml !== null && (
                <>
                  <dt className="text-muted">Capacity</dt>
                  <dd className="text-right tabular-nums">{formatMl(bottle.data.capacity_ml)}</dd>
                </>
              )}
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted">
            {bottle.isError ? "Can't load the bottle." : "Loading…"}
          </p>
        )}
      </Card>
      <Card>
        <h2 className="mb-3 font-medium">New bottle</h2>
        <ResetBottleForm />
      </Card>
    </div>
  );
}
