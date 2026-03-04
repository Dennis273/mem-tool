import { describe, test, expect } from 'vitest';
import { computeGrowth, trimHistory, type HistorySample } from '../growth.js';

describe('computeGrowth', () => {
  test('returns undefined when no sample is old enough', () => {
    const history: HistorySample[] = [
      { epoch: 1000, physMb: 400 },
      { epoch: 1010, physMb: 420 },
    ];

    const result = computeGrowth(history, 430, 1020, 1800);
    expect(result).toBeUndefined();
  });

  test('calculates growth from oldest sample within window', () => {
    const now = 5000;
    const windowSec = 1800;
    const cutoff = now - windowSec; // 3200

    const history: HistorySample[] = [
      { epoch: 3100, physMb: 300 }, // before cutoff, used as baseline
      { epoch: 3500, physMb: 350 },
      { epoch: 4500, physMb: 450 },
    ];

    const result = computeGrowth(history, 500, now, windowSec);
    expect(result).toBe(200); // 500 - 300
  });

  test('uses the earliest sample at or before cutoff', () => {
    const now = 5000;
    const windowSec = 1800;
    // cutoff = 3200

    const history: HistorySample[] = [
      { epoch: 2800, physMb: 100 }, // oldest, before cutoff
      { epoch: 3000, physMb: 200 }, // also before cutoff, but later
      { epoch: 4000, physMb: 400 },
    ];

    // should use the last sample at or before cutoff (epoch 3000, physMb 200)
    const result = computeGrowth(history, 500, now, windowSec);
    expect(result).toBe(300); // 500 - 200
  });

  test('returns negative growth when memory decreased', () => {
    const now = 5000;
    const windowSec = 1800;

    const history: HistorySample[] = [
      { epoch: 3000, physMb: 600 },
    ];

    const result = computeGrowth(history, 400, now, windowSec);
    expect(result).toBe(-200); // 400 - 600
  });

  test('returns 0 when memory is unchanged', () => {
    const now = 5000;
    const windowSec = 1800;

    const history: HistorySample[] = [
      { epoch: 3000, physMb: 400 },
    ];

    const result = computeGrowth(history, 400, now, windowSec);
    expect(result).toBe(0);
  });
});

describe('trimHistory', () => {
  test('removes samples older than window + buffer', () => {
    const now = 5000;
    const windowSec = 1800;
    // cutoff = 5000 - 1800 - 120 = 3080

    const history: HistorySample[] = [
      { epoch: 2000, physMb: 100 }, // too old
      { epoch: 3000, physMb: 200 }, // too old
      { epoch: 3100, physMb: 300 }, // kept
      { epoch: 4000, physMb: 400 }, // kept
    ];

    const result = trimHistory(history, now, windowSec);
    expect(result).toEqual([
      { epoch: 3100, physMb: 300 },
      { epoch: 4000, physMb: 400 },
    ]);
  });

  test('returns empty array when all samples are too old', () => {
    const history: HistorySample[] = [
      { epoch: 100, physMb: 100 },
    ];

    const result = trimHistory(history, 5000, 1800);
    expect(result).toEqual([]);
  });

  test('keeps all samples when none are expired', () => {
    const history: HistorySample[] = [
      { epoch: 4000, physMb: 100 },
      { epoch: 4500, physMb: 200 },
    ];

    const result = trimHistory(history, 5000, 1800);
    expect(result).toHaveLength(2);
  });
});
