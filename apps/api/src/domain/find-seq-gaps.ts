export type SeqGap = { from_seq: number; to_seq: number };

export function findSeqGaps(storedSeq: number, seqs: number[]): SeqGap[] {
  const gaps: SeqGap[] = [];
  let previous = storedSeq;
  for (const seq of seqs) {
    if (seq <= previous) continue;
    if (seq > previous + 1) gaps.push({ from_seq: previous + 1, to_seq: seq - 1 });
    previous = seq;
  }
  return gaps;
}
