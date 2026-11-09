import { readdirSync, readFileSync } from "node:fs";
import { type NodeEvent, nodeEventSchema } from "@gota/contracts";

export const SESSIONS_DIR = new URL("../../../fixtures/sessions/", import.meta.url);

export function listSessions(): string[] {
  return readdirSync(SESSIONS_DIR)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => file.replace(/\.jsonl$/, ""))
    .sort();
}

export function loadSession(name: string): NodeEvent[] {
  return readFileSync(new URL(`${name}.jsonl`, SESSIONS_DIR), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => nodeEventSchema.parse(JSON.parse(line)));
}
