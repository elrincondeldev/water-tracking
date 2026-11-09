import { describe, expect, it } from "vitest";
import { findSeqGaps } from "./find-seq-gaps";

describe("findSeqGaps", () => {
  it("finds nothing in a contiguous batch", () => {
    expect(findSeqGaps(10, [11, 12, 13])).toEqual([]);
  });

  it("finds a gap before and inside the batch", () => {
    expect(findSeqGaps(10, [13, 14, 17])).toEqual([
      { from_seq: 11, to_seq: 12 },
      { from_seq: 15, to_seq: 16 },
    ]);
  });

  it("ignores seqs already stored", () => {
    expect(findSeqGaps(10, [8, 9, 10, 11])).toEqual([]);
  });

  it("treats a first batch as starting at seq 1", () => {
    expect(findSeqGaps(0, [3])).toEqual([{ from_seq: 1, to_seq: 2 }]);
  });
});
