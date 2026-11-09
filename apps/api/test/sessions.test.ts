import { describe, expect, it } from "vitest";
import { applyNodeEvent, initialBottleState } from "../src/domain/bottle-tracker";
import { type ExpectedIntake, loadEvents, loadExpected, sessionNames } from "./sessions";

describe("recorded sessions", () => {
  it("finds the fixtures", () => {
    expect(sessionNames.length).toBeGreaterThan(0);
  });

  it.each(sessionNames)("%s produces exactly the expected intakes", (name) => {
    let state = initialBottleState;
    const intakes: ExpectedIntake[] = [];
    for (const event of loadEvents(name)) {
      const result = applyNodeEvent(state, event);
      state = result.state;
      if (result.change) intakes.push({ seq: event.seq, ...result.change });
    }
    expect(intakes).toEqual(loadExpected(name));
  });
});
