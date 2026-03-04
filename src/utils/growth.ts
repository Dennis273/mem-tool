export interface HistorySample {
  epoch: number;
  physMb: number;
}

const TRIM_BUFFER_SEC = 120;

export function computeGrowth(
  history: HistorySample[],
  currentPhysMb: number,
  nowEpoch: number,
  windowSec: number,
): number | undefined {
  const cutoff = nowEpoch - windowSec;

  let baseline: HistorySample | undefined;
  for (const sample of history) {
    if (sample.epoch <= cutoff) {
      baseline = sample;
    }
  }

  return baseline !== undefined ? currentPhysMb - baseline.physMb : undefined;
}

export function trimHistory(
  history: HistorySample[],
  nowEpoch: number,
  windowSec: number,
): HistorySample[] {
  const cutoff = nowEpoch - windowSec - TRIM_BUFFER_SEC;
  return history.filter((s) => s.epoch >= cutoff);
}
