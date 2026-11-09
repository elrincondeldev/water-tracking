import { describe, expect, it } from "vitest";
import { isoDateTimeSchema, timeOfDaySchema, timezoneSchema, volumeMlSchema } from "./primitives";

describe("timezoneSchema", () => {
  it.each(["Europe/Madrid", "UTC", "America/New_York"])("accepts %s", (tz) => {
    expect(timezoneSchema.safeParse(tz).success).toBe(true);
  });

  it.each(["Europe/Atlantis", "", "GMT+25"])("rejects %s", (tz) => {
    expect(timezoneSchema.safeParse(tz).success).toBe(false);
  });
});

describe("timeOfDaySchema", () => {
  it.each(["00:00", "07:30", "23:59"])("accepts %s", (time) => {
    expect(timeOfDaySchema.safeParse(time).success).toBe(true);
  });

  it.each(["24:00", "7:30", "12:60", "12:00:00"])("rejects %s", (time) => {
    expect(timeOfDaySchema.safeParse(time).success).toBe(false);
  });
});

describe("isoDateTimeSchema", () => {
  it("accepts a UTC timestamp", () => {
    expect(isoDateTimeSchema.safeParse("2026-11-09T12:00:00.000Z").success).toBe(true);
  });

  it("rejects a timestamp with an offset", () => {
    expect(isoDateTimeSchema.safeParse("2026-11-09T13:00:00+01:00").success).toBe(false);
  });
});

describe("volumeMlSchema", () => {
  it.each([0, -5, 12.5, 5001])("rejects %s", (volume) => {
    expect(volumeMlSchema.safeParse(volume).success).toBe(false);
  });
});
