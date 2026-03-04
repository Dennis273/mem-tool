import { describe, test, expect } from 'vitest';
import { parseVmStat, parseTotalRam } from '../system.js';

describe('parseTotalRam', () => {
  test('parses hw.memsize to GB', () => {
    expect(parseTotalRam('38654705664')).toBe(36);
  });

  test('parses 16GB machine', () => {
    expect(parseTotalRam('17179869184')).toBe(16);
  });
});

describe('parseVmStat', () => {
  const vmStatOutput = [
    'Mach Virtual Memory Statistics: (page size of 16384 bytes)',
    'Pages free:                               55876.',
    'Pages active:                            452149.',
    'Pages inactive:                          447104.',
    'Pages speculative:                         3932.',
    'Pages throttled:                              0.',
    'Pages wired down:                        247387.',
    'Pages purgeable:                             31.',
    '"Translation faults":                1194399169.',
    'Pages copy-on-write:                  106160539.',
    'Pages zero filled:                    630434009.',
    'Pages reactivated:                    116327540.',
    'Pages purged:                          28111046.',
    'File-backed pages:                       321163.',
    'Anonymous pages:                         582022.',
    'Pages stored in compressor:             2782382.',
    'Pages occupied by compressor:           1099406.',
    'Decompressions:                        67356068.',
    'Compressions:                         104371461.',
    'Pageins:                               32210183.',
    'Pageouts:                                415293.',
    'Swapins:                                 157252.',
    'Swapouts:                                795688.',
  ].join('\n');

  test('calculates used memory in GB from vm_stat output', () => {
    // active(452149) + wired(247387) + compressor(1099406) = 1798942 pages
    // 1798942 * 16384 = 29477044224 bytes = 27.4 GB
    const result = parseVmStat(vmStatOutput, 16384);
    expect(result).toBeCloseTo(27.4, 0);
  });

  test('uses provided page size', () => {
    const smallPageVmStat = [
      'Mach Virtual Memory Statistics: (page size of 4096 bytes)',
      'Pages active:                            100000.',
      'Pages wired down:                         50000.',
      'Pages occupied by compressor:              10000.',
    ].join('\n');

    // (100000 + 50000 + 10000) * 4096 = 655360000 bytes = 0.6 GB
    const result = parseVmStat(smallPageVmStat, 4096);
    expect(result).toBeCloseTo(0.6, 0);
  });

  test('returns 0 when fields are missing', () => {
    expect(parseVmStat('', 16384)).toBe(0);
  });
});
