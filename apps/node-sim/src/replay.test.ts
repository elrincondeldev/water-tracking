import type { NodeEvent } from "@gota/contracts";
import { describe, expect, it } from "vitest";
import { replay } from "./replay";

const events: NodeEvent[] = Array.from({ length: 120 }, (_, i) => ({
  seq: i + 1,
  type: "removed",
  t_ms: null,
  uptime_ms: 1000 + i * 2000,
}));

function recorder() {
  const batches: number[][] = [];
  const sleeps: number[] = [];
  return {
    batches,
    sleeps,
    send: async (batch: NodeEvent[]) => {
      batches.push(batch.map((e) => e.seq));
      return { v: 1 as const, accepted_seq: batch.at(-1)?.seq ?? 0 };
    },
    sleep: async (ms: number) => {
      sleeps.push(ms);
    },
  };
}

describe("replay", () => {
  it("sends everything at once in full batches when speed is 0", async () => {
    const r = recorder();
    expect(await replay(events, { ...r, speed: 0 })).toBe(120);
    expect(r.batches.map((b) => b.length)).toEqual([50, 50, 20]);
    expect(r.sleeps).toEqual([]);
  });

  it("sends each event when it happens, scaled by speed", async () => {
    const r = recorder();
    await replay(events.slice(0, 3), { ...r, speed: 10 });
    expect(r.batches).toEqual([[1], [2], [3]]);
    expect(r.sleeps).toEqual([0, 200, 200]);
  });
});
