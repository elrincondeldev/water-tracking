import { type Device, statusEventSchema } from "@gota/contracts";
import { and, desc, eq } from "drizzle-orm";
import type { DbOrTx } from "../db/open-database";
import { devices, nodeEvents } from "../db/schema";

export const ONLINE_WINDOW_MS = 150_000;

export function getDevice(db: DbOrTx, now: Date): Device | null {
  const device = db.select().from(devices).orderBy(desc(devices.last_seen_at)).get();
  if (!device) return null;
  const statusRow = db
    .select({ payload: nodeEvents.payload })
    .from(nodeEvents)
    .where(and(eq(nodeEvents.device_id, device.id), eq(nodeEvents.type, "status")))
    .orderBy(desc(nodeEvents.seq))
    .get();
  const status = statusRow ? statusEventSchema.parse(statusRow.payload) : null;
  return {
    id: device.id,
    name: device.name,
    firmware: device.firmware,
    online: now.getTime() - device.last_seen_at.getTime() < ONLINE_WINDOW_MS,
    last_seen_at: device.last_seen_at.toISOString(),
    weight_g: status?.weight_g ?? null,
    rssi_dbm: status?.rssi_dbm ?? null,
    calibrated: status?.calibrated ?? null,
  };
}
