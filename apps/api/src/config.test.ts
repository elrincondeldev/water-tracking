import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const TOKEN = "0123456789abcdef0123";

describe("loadConfig", () => {
  it("applies defaults", () => {
    expect(loadConfig({ GOTA_DEVICE_TOKEN: TOKEN })).toEqual({
      GOTA_DEVICE_TOKEN: TOKEN,
      DATABASE_PATH: "data/gota.db",
      HOST: "0.0.0.0",
      PORT: 3000,
    });
  });

  it("reads the port as a number", () => {
    expect(loadConfig({ GOTA_DEVICE_TOKEN: TOKEN, PORT: "8081" }).PORT).toBe(8081);
  });

  it.each([{}, { GOTA_DEVICE_TOKEN: "short" }])("rejects a missing or weak token", (env) => {
    expect(() => loadConfig(env)).toThrow(/GOTA_DEVICE_TOKEN/);
  });
});
