import { describe, expect, it } from "vitest";
import { deviceSchema } from "./device";

describe("deviceSchema", () => {
  it("accepts a device that has never reported", () => {
    const device = {
      id: "gota-3485180a1b2c",
      name: "Desk coaster",
      firmware: null,
      online: false,
      last_seen_at: null,
      weight_g: null,
      rssi_dbm: null,
      calibrated: null,
    };
    expect(deviceSchema.parse(device)).toEqual(device);
  });
});
