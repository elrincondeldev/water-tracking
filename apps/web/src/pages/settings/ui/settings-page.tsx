import { Card } from "@gota/ui";
import { DeviceStatus, useDevice } from "@/entities/device";
import { useGoal, useSettings } from "@/entities/preference";
import { GoalForm } from "@/features/update-goal";
import { SettingsForm } from "@/features/update-settings";
import { formatAgo, formatGrams, useNow } from "@/shared/lib";

export function SettingsPage() {
  const goal = useGoal();
  const settings = useSettings();
  const device = useDevice();
  const now = useNow();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <h2 className="mb-4 font-medium">Goal</h2>
        {goal.data ? (
          <GoalForm dailyMl={goal.data.daily_ml} />
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </Card>
      <Card>
        <h2 className="mb-4 font-medium">Day and reminders</h2>
        {settings.data ? (
          <SettingsForm settings={settings.data} />
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </Card>
      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-medium">Coaster</h2>
          <DeviceStatus device={device.data ?? null} />
        </div>
        {device.data ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted">Last seen</dt>
            <dd className="text-right">
              {device.data.last_seen_at ? formatAgo(device.data.last_seen_at, now) : "Never"}
            </dd>
            <dt className="text-muted">Firmware</dt>
            <dd className="text-right">{device.data.firmware ?? "—"}</dd>
            <dt className="text-muted">Wi-Fi signal</dt>
            <dd className="text-right tabular-nums">
              {device.data.rssi_dbm === null ? "—" : `${device.data.rssi_dbm} dBm`}
            </dd>
            <dt className="text-muted">Calibrated</dt>
            <dd className="text-right">
              {device.data.calibrated === null ? "—" : device.data.calibrated ? "Yes" : "No"}
            </dd>
            <dt className="text-muted">Weight now</dt>
            <dd className="text-right tabular-nums">
              {device.data.weight_g === null ? "—" : formatGrams(device.data.weight_g)}
            </dd>
            <dt className="text-muted">Id</dt>
            <dd className="truncate text-right font-mono text-xs leading-5">{device.data.id}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted">
            No coaster has reported yet. Set its API URL and token from the serial console.
          </p>
        )}
      </Card>
    </div>
  );
}
