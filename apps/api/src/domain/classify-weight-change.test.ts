import { describe, expect, it } from "vitest";
import { classifyWeightChange } from "./classify-weight-change";

describe("classifyWeightChange", () => {
  it.each([
    [1531.0, 1287.4, { kind: "sip", volume_ml: 244 }],
    [1531.0, 1526.0, { kind: "sip", volume_ml: 5 }],
    [1531.0, 931.0, { kind: "sip", volume_ml: 600 }],
    [1531.0, 930.9, { kind: "unclassified", volume_ml: 600 }],
    [420.5, 1529.8, { kind: "refill", volume_ml: 1109 }],
    [1531.0, 1536.0, { kind: "refill", volume_ml: 5 }],
  ])("%d g → %d g is %o", (baseline_g, weight_g, expected) => {
    expect(classifyWeightChange(baseline_g, weight_g)).toEqual(expected);
  });

  it.each([
    [1531.0, 1531.0],
    [1531.0, 1526.1],
    [1531.0, 1535.9],
  ])("ignores %d g → %d g", (baseline_g, weight_g) => {
    expect(classifyWeightChange(baseline_g, weight_g)).toBeNull();
  });
});
