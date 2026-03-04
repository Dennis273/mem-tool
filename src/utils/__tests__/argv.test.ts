import { describe, test, expect } from 'vitest';
import { parseArgv } from '../argv.js';

describe('parseArgv', () => {
  test('returns empty overrides for no args', () => {
    expect(parseArgv([])).toEqual({});
  });

  test('parses --sys-limit with valid number', () => {
    expect(parseArgv(['--sys-limit', '200'])).toEqual({ sysMemLimitGb: 200 });
  });

  test('parses --sys-limit with decimal', () => {
    expect(parseArgv(['--sys-limit', '36.5'])).toEqual({ sysMemLimitGb: 36.5 });
  });

  test('throws on --sys-limit without value', () => {
    expect(() => parseArgv(['--sys-limit'])).toThrow('--sys-limit requires a numeric value');
  });

  test('throws on --sys-limit with non-numeric value', () => {
    expect(() => parseArgv(['--sys-limit', 'abc'])).toThrow('--sys-limit requires a numeric value');
  });

  test('throws on unknown flag', () => {
    expect(() => parseArgv(['--unknown'])).toThrow('Unknown option: --unknown');
  });

  test('ignores node and script path in raw process.argv', () => {
    expect(parseArgv(['/usr/bin/node', '/path/to/cli.js', '--sys-limit', '100'])).toEqual({
      sysMemLimitGb: 100,
    });
  });
});
