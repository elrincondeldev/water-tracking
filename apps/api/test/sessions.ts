import { readdirSync, readFileSync } from "node:fs";
import { type NodeEvent, nodeEventSchema } from "@gota/contracts";

const SESSIONS_DIR = new URL("../../../fixtures/sessions/", import.meta.url);

export type ExpectedIntake = { seq: number; kind: string; volume_ml: number };

export const sessionNames = readdirSync(SESSIONS_DIR)
  .filter((file) => file.endsWith(".jsonl"))
  .map((file) => file.replace(/\.jsonl$/, ""));

export function loadEvents(name: string): NodeEvent[] {
  return readFileSync(new URL(`${name}.jsonl`, SESSIONS_DIR), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => nodeEventSchema.parse(JSON.parse(line)));
}

export function loadExpected(name: string): ExpectedIntake[] {
  const file = readFileSync(new URL(`${name}.expected.json`, SESSIONS_DIR), "utf8");
  return (JSON.parse(file) as { intakes: ExpectedIntake[] }).intakes;
}
