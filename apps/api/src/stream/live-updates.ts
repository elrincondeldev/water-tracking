import type { Intake, StreamEvent } from "@gota/contracts";
import type { Db } from "../db/open-database";
import { getDevice } from "../device/get-device";
import { getTodaySummary } from "../summary/get-today-summary";

type Listener = (event: StreamEvent) => void;

export type LiveUpdates = ReturnType<typeof createLiveUpdates>;

export function createLiveUpdates(db: Db, now: () => Date) {
  const listeners = new Set<Listener>();

  const summary = (): StreamEvent => ({ type: "summary", data: getTodaySummary(db, now()) });
  const device = (): StreamEvent[] => {
    const data = getDevice(db, now());
    return data ? [{ type: "device", data }] : [];
  };
  const emit = (events: () => StreamEvent[]) => {
    if (listeners.size === 0) return;
    for (const event of events()) for (const listener of listeners) listener(event);
  };

  return {
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot: (): StreamEvent[] => [summary(), ...device()],
    deviceSnapshot: device,
    publishIntakes(intakes: Intake[]) {
      emit(() => [...intakes.map((data): StreamEvent => ({ type: "intake", data })), summary()]);
    },
    publishSummary() {
      emit(() => [summary()]);
    },
    publishDevice() {
      emit(device);
    },
  };
}
