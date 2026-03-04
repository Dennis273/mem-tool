import { describe, test, expect } from 'vitest';
import { renderSparkline, renderMemoryBar, commandBasename, classifyProcesses } from '../format.js';
import type { EnrichedProcess } from '../../hooks/use-monitor.js';

describe('renderSparkline', () => {
  test('renders all same values as lowest bar', () => {
    expect(renderSparkline([5, 5, 5, 5], 4)).toBe('▁▁▁▁');
  });

  test('renders ascending values', () => {
    expect(renderSparkline([0, 1, 2, 3, 4, 5, 6, 7], 8)).toBe('▁▂▃▄▅▆▇█');
  });

  test('truncates to width from the right (most recent)', () => {
    const samples = [100, 200, 300, 400, 500];
    const result = renderSparkline(samples, 3);
    expect(result).toHaveLength(3);
  });

  test('pads with spaces when fewer samples than width', () => {
    const result = renderSparkline([0, 7], 5);
    expect(result).toHaveLength(5);
    expect(result).toBe('   ▁█');
  });

  test('returns empty string for empty samples', () => {
    expect(renderSparkline([], 5)).toBe('     ');
  });

  test('normalizes values within min-max range', () => {
    const result = renderSparkline([100, 150, 200], 3);
    expect(result).toBe('▁▅█');
  });

  test('handles single sample', () => {
    expect(renderSparkline([42], 3)).toBe('  ▁');
  });
});

describe('renderMemoryBar', () => {
  test('renders 50% usage', () => {
    const result = renderMemoryBar(18, 36, 20);
    expect(result).toHaveLength(20);
    const filled = (result.match(/█/g) ?? []).length;
    const empty = (result.match(/░/g) ?? []).length;
    expect(filled).toBe(10);
    expect(empty).toBe(10);
  });

  test('renders 100% usage', () => {
    const result = renderMemoryBar(36, 36, 10);
    expect(result).toBe('██████████');
  });

  test('renders 0% usage', () => {
    const result = renderMemoryBar(0, 36, 10);
    expect(result).toBe('░░░░░░░░░░');
  });

  test('clamps to 100% when used exceeds total', () => {
    const result = renderMemoryBar(40, 36, 10);
    expect(result).toBe('██████████');
  });

  test('renders approximately correct ratio', () => {
    const result = renderMemoryBar(27, 36, 20);
    const filled = (result.match(/█/g) ?? []).length;
    expect(filled).toBe(15); // 75% of 20
  });
});

describe('commandBasename', () => {
  test('extracts name from macOS .app bundle path', () => {
    expect(
      commandBasename(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Helper (Renderer) --type=renderer',
      ),
    ).toBe('Google Chrome Helper (Renderer)');
  });

  test('extracts simple basename from unix path', () => {
    expect(commandBasename('/usr/local/bin/node')).toBe('node');
  });

  test('strips arguments from simple command', () => {
    expect(commandBasename('claude --allow-dangerously-skip-permissions')).toBe('claude');
  });

  test('returns command as-is when no path or args', () => {
    expect(commandBasename('Raycast')).toBe('Raycast');
  });

  test('handles path with arguments after executable', () => {
    expect(commandBasename('/usr/bin/python3 /home/user/script.py')).toBe('python3');
  });

  test('handles macOS system path', () => {
    expect(commandBasename('/System/Library/CoreServices/backboardd')).toBe('backboardd');
  });

  test('extracts name from nested .app path', () => {
    expect(
      commandBasename(
        '/Applications/Visual Studio Code.app/Contents/MacOS/Electron --some-flag',
      ),
    ).toBe('Electron');
  });
});

describe('classifyProcesses', () => {
  const makeProc = (
    pid: number,
    physMb: number | undefined,
    growthMb: number | undefined,
  ): EnrichedProcess => ({
    pid,
    user: 'dennis',
    rssMb: physMb ?? 100,
    vszMb: 1000,
    command: `proc-${pid}`,
    physMb,
    growthMb,
  });

  test('classifies process exceeding memory limit as abnormal', () => {
    const procs = [makeProc(1, 2000, 0), makeProc(2, 500, 0)];
    const { abnormal, normal } = classifyProcesses(procs, 1500, 200);
    expect(abnormal.map((p) => p.pid)).toEqual([1]);
    expect(normal.map((p) => p.pid)).toEqual([2]);
  });

  test('classifies process exceeding growth limit as abnormal', () => {
    const procs = [makeProc(1, 500, 300), makeProc(2, 500, 50)];
    const { abnormal, normal } = classifyProcesses(procs, 1500, 200);
    expect(abnormal.map((p) => p.pid)).toEqual([1]);
    expect(normal.map((p) => p.pid)).toEqual([2]);
  });

  test('classifies process exceeding both limits as abnormal (not duplicated)', () => {
    const procs = [makeProc(1, 2000, 300)];
    const { abnormal, normal } = classifyProcesses(procs, 1500, 200);
    expect(abnormal).toHaveLength(1);
    expect(normal).toHaveLength(0);
  });

  test('treats undefined physMb/growthMb as normal', () => {
    const procs = [makeProc(1, undefined, undefined)];
    const { abnormal, normal } = classifyProcesses(procs, 1500, 200);
    expect(abnormal).toHaveLength(0);
    expect(normal).toHaveLength(1);
  });

  test('preserves original order within each group', () => {
    const procs = [
      makeProc(1, 2000, 0),
      makeProc(2, 100, 0),
      makeProc(3, 1600, 0),
      makeProc(4, 200, 0),
    ];
    const { abnormal, normal } = classifyProcesses(procs, 1500, 200);
    expect(abnormal.map((p) => p.pid)).toEqual([1, 3]);
    expect(normal.map((p) => p.pid)).toEqual([2, 4]);
  });

  test('returns empty arrays for empty input', () => {
    const { abnormal, normal } = classifyProcesses([], 1500, 200);
    expect(abnormal).toEqual([]);
    expect(normal).toEqual([]);
  });
});
