import type { Device } from "@gota/contracts";
import { cx } from "@gota/ui";

export function DeviceStatus({ device }: { device: Device | null }) {
  const online = device?.online ?? false;
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <span
        aria-hidden
        className={cx("size-2 rounded-full", online ? "bg-accent" : "bg-muted/50")}
      />
      {device === null ? "No coaster yet" : online ? "Coaster online" : "Coaster offline"}
    </span>
  );
}
