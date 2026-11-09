import { describe, expect, it } from "vitest";
import { resolveMeasuredAt } from "./resolve-measured-at";

const RECEIVED_AT_MS = 1794226000000;

describe("resolveMeasuredAt", () => {
  it("uses t_ms when the node had NTP time", () => {
    const events = [{ t_ms: 1794225600000, uptime_ms: 3605120 }];
    expect(resolveMeasuredAt(events, RECEIVED_AT_MS)).toEqual([1794225600000]);
  });

  it("dates unsynced events from a synced event of the same boot", () => {
    const events = [
      { t_ms: null, uptime_ms: 5000 },
      { t_ms: null, uptime_ms: 20000 },
      { t_ms: 1794225600000, uptime_ms: 65000 },
    ];
    expect(resolveMeasuredAt(events, RECEIVED_AT_MS)).toEqual([
      1794225540000, 1794225555000, 1794225600000,
    ]);
  });

  it("does not borrow a clock across a reboot", () => {
    const events = [
      { t_ms: null, uptime_ms: 900000 },
      { t_ms: 1794225600000, uptime_ms: 65000 },
    ];
    expect(resolveMeasuredAt(events, RECEIVED_AT_MS)).toEqual([RECEIVED_AT_MS, 1794225600000]);
  });

  it("falls back to the receive time when nothing in the boot is synced", () => {
    const events = [
      { t_ms: null, uptime_ms: 5000 },
      { t_ms: null, uptime_ms: 6000 },
    ];
    expect(resolveMeasuredAt(events, RECEIVED_AT_MS)).toEqual([RECEIVED_AT_MS, RECEIVED_AT_MS]);
  });
});
