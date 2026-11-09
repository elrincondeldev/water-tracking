import type { NodeEvent } from "@gota/contracts";
import { describe, expect, it } from "vitest";
import {
  applyNodeEvent,
  type BottleState,
  initialBottleState,
  resetBottle,
} from "./bottle-tracker";

let seq = 0;
const event = {
  placed: (weight_g: number): NodeEvent => ({ ...base(), type: "placed", weight_g }),
  changed: (weight_g: number): NodeEvent => ({ ...base(), type: "changed", weight_g }),
  removed: (): NodeEvent => ({ ...base(), type: "removed" }),
  status: (weight_g: number): NodeEvent => ({
    ...base(),
    type: "status",
    weight_g,
    stable: true,
    present: true,
    calibrated: true,
    rssi_dbm: -60,
    queued: 0,
  }),
};

function base() {
  seq += 1;
  return { seq, t_ms: null, uptime_ms: seq * 1000 };
}

function replay(events: NodeEvent[], state: BottleState = initialBottleState) {
  const changes = [];
  for (const e of events) {
    const result = applyNodeEvent(state, e);
    state = result.state;
    if (result.change) changes.push(result.change);
  }
  return { state, changes };
}

describe("applyNodeEvent", () => {
  it("takes the first placement as the baseline without an intake", () => {
    const { state, changes } = replay([event.placed(1531)]);
    expect(changes).toEqual([]);
    expect(state.baseline_g).toBe(1531);
  });

  it("counts a sip when the bottle comes back lighter", () => {
    const { state, changes } = replay([event.placed(1531), event.removed(), event.placed(1287.4)]);
    expect(changes).toEqual([{ kind: "sip", volume_ml: 244 }]);
    expect(state.baseline_g).toBe(1287.4);
  });

  it("counts a refill in place", () => {
    const { changes } = replay([event.placed(800), event.changed(1530.6)]);
    expect(changes).toEqual([{ kind: "refill", volume_ml: 731 }]);
  });

  it("keeps the baseline when a change is under the threshold, so small sips add up", () => {
    const { changes } = replay([
      event.placed(1531),
      event.removed(),
      event.placed(1528),
      event.removed(),
      event.placed(1525.5),
    ]);
    expect(changes).toEqual([{ kind: "sip", volume_ml: 6 }]);
  });

  it("ignores status heartbeats", () => {
    const { state, changes } = replay([event.placed(1531), event.status(1400)]);
    expect(changes).toEqual([]);
    expect(state.baseline_g).toBe(1531);
  });

  it("tracks whether a bottle is on the plate", () => {
    expect(replay([event.placed(1531)]).state.present).toBe(true);
    expect(replay([event.placed(1531), event.removed()]).state.present).toBe(false);
  });
});

describe("resetBottle", () => {
  it("uses the bottle on the plate as the new baseline", () => {
    const { state } = replay([event.placed(1531), event.removed(), event.placed(1500)]);
    const after = replay([event.removed(), event.placed(1300)], resetBottle(state));
    expect(after.changes).toEqual([{ kind: "sip", volume_ml: 200 }]);
  });

  it("waits for the next placement when the plate is empty", () => {
    const { state } = replay([event.placed(1531), event.removed()]);
    const after = replay([event.placed(700)], resetBottle(state));
    expect(after.changes).toEqual([]);
    expect(after.state.baseline_g).toBe(700);
  });
});
