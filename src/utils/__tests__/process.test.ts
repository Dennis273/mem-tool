import { describe, test, expect } from 'vitest';
import { parsePsAux, parseFootprint, buildProcessList } from '../process.js';

const PS_AUX_HEADER = 'USER               PID  %CPU %MEM      VSZ    RSS   TT  STAT STARTED      TIME COMMAND';

describe('parsePsAux', () => {
  test('parses a standard ps aux line', () => {
    const raw = [
      PS_AUX_HEADER,
      'dennis           69377  62.7  1.5 486449024 554784 s002  R+    9:22AM   7:08.93 claude --allow-dangerously-skip-permissions',
    ].join('\n');

    const result = parsePsAux(raw);
    expect(result).toEqual([
      {
        pid: 69377,
        user: 'dennis',
        rssMb: expect.closeTo(541.8, 0),
        vszMb: expect.closeTo(475047.9, 0),
        command: 'claude --allow-dangerously-skip-permissions',
      },
    ]);
  });

  test('filters out root (UID 0) processes', () => {
    const raw = [
      PS_AUX_HEADER,
      'root               515  81.8  2.0 439814912 741456   ??  Ss    4:18PM 161:13.14 /System/Library/mds_stores',
      'dennis           69377  62.7  1.5 486449024 554784 s002  R+    9:22AM   7:08.93 claude',
    ].join('\n');

    const result = parsePsAux(raw);
    expect(result).toHaveLength(1);
    expect(result[0].pid).toBe(69377);
  });

  test('handles command with spaces', () => {
    const raw = [
      PS_AUX_HEADER,
      'dennis            3064  18.4  0.8 1865596016 310816   ??  S    10:17AM   0:19.20 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome Helper (Renderer) --type=renderer',
    ].join('\n');

    const result = parsePsAux(raw);
    expect(result[0].command).toBe(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Helper (Renderer) --type=renderer',
    );
  });

  test('sorts by RSS descending', () => {
    const raw = [
      PS_AUX_HEADER,
      'dennis             100   1.0  0.1 100000  50000 s001  S     9:00AM   0:01.00 small-proc',
      'dennis             200   2.0  0.2 200000 200000 s002  S     9:00AM   0:02.00 big-proc',
      'dennis             300   1.5  0.1 150000 100000 s003  S     9:00AM   0:01.50 mid-proc',
    ].join('\n');

    const result = parsePsAux(raw);
    expect(result.map((p) => p.pid)).toEqual([200, 300, 100]);
  });

  test('returns empty array for empty input', () => {
    expect(parsePsAux('')).toEqual([]);
    expect(parsePsAux(PS_AUX_HEADER)).toEqual([]);
  });

  test('skips lines with invalid PID', () => {
    const raw = [
      PS_AUX_HEADER,
      'dennis           abc  62.7  1.5 486449024 554784 s002  R+    9:22AM   7:08.93 claude',
    ].join('\n');

    expect(parsePsAux(raw)).toEqual([]);
  });
});

describe('parseFootprint', () => {
  test('extracts MB value from footprint output', () => {
    const raw = [
      '======================================================================',
      'claude [69377]: 64-bit',
      'Warnings were encountered while examining the process.',
      '    Unable to iterate over image segments',
      '    Footprint: 678 MB (16384 bytes per page)',
      '======================================================================',
    ].join('\n');

    expect(parseFootprint(raw)).toBe(678);
  });

  test('returns undefined for output without footprint line', () => {
    expect(parseFootprint('')).toBeUndefined();
    expect(parseFootprint('some random output')).toBeUndefined();
  });

  test('handles large footprint values', () => {
    const raw = '    Footprint: 2048 MB (16384 bytes per page)';
    expect(parseFootprint(raw)).toBe(2048);
  });
});

describe('buildProcessList', () => {
  const entries = [
    { pid: 1, user: 'dennis', rssMb: 500, vszMb: 1000, command: 'big-app' },
    { pid: 2, user: 'dennis', rssMb: 300, vszMb: 800, command: 'mid-app' },
    { pid: 3, user: 'dennis', rssMb: 100, vszMb: 200, command: 'small-app' },
  ];

  test('attaches footprint to top N processes', () => {
    const getFootprint = (pid: number) => (pid === 1 ? 480 : pid === 2 ? 280 : undefined);

    const result = buildProcessList(entries, getFootprint, 2);

    expect(result[0].physMb).toBe(480);
    expect(result[1].physMb).toBe(280);
    expect(result[2].physMb).toBeUndefined();
  });

  test('preserves all entries regardless of topN', () => {
    const result = buildProcessList(entries, () => undefined, 1);
    expect(result).toHaveLength(3);
  });

  test('handles topN larger than entries', () => {
    const getFootprint = () => 100;
    const result = buildProcessList(entries, getFootprint, 10);

    expect(result).toHaveLength(3);
    expect(result.every((p) => p.physMb === 100)).toBe(true);
  });

  test('handles empty entries', () => {
    expect(buildProcessList([], () => 100, 20)).toEqual([]);
  });

  test('re-sorts top N by footprint descending', () => {
    // RSS order: pid 1 (500) > pid 2 (300) > pid 3 (100)
    // footprint: pid 2 (600) > pid 1 (200)
    const getFootprint = (pid: number) => (pid === 1 ? 200 : pid === 2 ? 600 : undefined);

    const result = buildProcessList(entries, getFootprint, 2);

    expect(result[0].pid).toBe(2);
    expect(result[0].physMb).toBe(600);
    expect(result[1].pid).toBe(1);
    expect(result[1].physMb).toBe(200);
    expect(result[2].pid).toBe(3);
  });
});
