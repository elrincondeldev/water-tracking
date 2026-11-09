import type { NodeEvent } from "@gota/contracts";
import { describe, expect, it } from "vitest";
import { rebaseSession } from "./rebase-session";

const events: NodeEvent[] = [
  { seq: 1, type: "placed", t_ms: null, uptime_ms: 6000, weight_g: 1531 },
  { seq: 2, type: "removed", t_ms: 1794225636000, uptime_ms: 36000 },
  { seq: 5, type: "placed", t_ms: 1794225644000, uptime_ms: 44000, weight_g: 1400 },
];

describe("rebaseSession", () => {
  it("renumbers seqs contiguously and moves synced times to start now", () => {
    expect(rebaseSession(events, { seqStart: 100, startMs: 1_800_000_000_000 })).toEqual([
      { seq: 100, type: "placed", t_ms: null, uptime_ms: 6000, weight_g: 1531 },
      { seq: 101, type: "removed", t_ms: 1_800_000_030_000, uptime_ms: 36000 },
      { seq: 102, type: "placed", t_ms: 1_800_000_038_000, uptime_ms: 44000, weight_g: 1400 },
    ]);
  });

  it("compresses time for fast replays", () => {
    const rebased = rebaseSession(events, { seqStart: 1, startMs: 0, timeScale: 0.1 });
    expect(rebased.map((e) => e.t_ms)).toEqual([null, 3000, 3800]);
  });
});
