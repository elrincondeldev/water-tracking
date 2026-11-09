import { describe, expect, it } from "vitest";
import { putGoalRequestSchema } from "./goal";

describe("putGoalRequestSchema", () => {
  it("accepts a typical goal", () => {
    expect(putGoalRequestSchema.parse({ daily_ml: 2000 })).toEqual({ daily_ml: 2000 });
  });

  it.each([0, 100, 10001, 1999.5])("rejects %s ml", (daily_ml) => {
    expect(putGoalRequestSchema.safeParse({ daily_ml }).success).toBe(false);
  });
});
