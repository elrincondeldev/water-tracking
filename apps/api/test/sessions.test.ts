import { readdirSync, readFileSync } from "node:fs";
import { type NodeEvent, nodeEventSchema } from "@gota/contracts";
import { describe, expect, it } from "vitest";
import { applyNodeEvent, initialBottleState } from "../src/domain/bottle-tracker";

const SESSIONS_DIR = new URL("../../../fixtures/sessions/", import.meta.url);

type ExpectedIntake = { seq: number; kind: string; volume_ml: number };

const sessions = readdirSync(SESSIONS_DIR)
  .filter((file) => file.endsWith(".jsonl"))
  .map((file) => file.replace(/\.jsonl$/, ""));

function loadEvents(name: string): NodeEvent[] {
  return readFileSync(new URL(`${name}.jsonl`, SESSIONS_DIR), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => nodeEventSchema.parse(JSON.parse(line)));
}

function loadExpected(name: string): ExpectedIntake[] {
  const file = readFileSync(new URL(`${name}.expected.json`, SESSIONS_DIR), "utf8");
  return (JSON.parse(file) as { intakes: ExpectedIntake[] }).intakes;
}

describe("recorded sessions", () => {
  it("finds the fixtures", () => {
    expect(sessions.length).toBeGreaterThan(0);
  });

  it.each(sessions)("%s produces exactly the expected intakes", (name) => {
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
