import { describe, expect, it } from "vitest";
import { normalizeApiUrl } from "./api-url";

describe("normalizeApiUrl", () => {
  it.each([
    ["http://192.168.1.208:3000", "http://192.168.1.208:3000"],
    ["  http://zimaboard.local:3000/api/v1  ", "http://zimaboard.local:3000"],
    ["https://gota.home/", "https://gota.home"],
  ])("keeps the origin of %s", (input, expected) => {
    expect(normalizeApiUrl(input)).toBe(expected);
  });

  it.each(["", "192.168.1.208:3000", "ftp://gota.home", "not a url"])("rejects %j", (input) => {
    expect(normalizeApiUrl(input)).toBeNull();
  });
});
