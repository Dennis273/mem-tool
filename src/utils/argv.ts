import type { MonitorConfig } from '../config.js';

export function parseArgv(argv: string[]): Partial<MonitorConfig> {
  const args = argv.length >= 2 && !argv[0].startsWith('--')
    ? argv.slice(2)
    : argv;

  const overrides: Partial<MonitorConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];

    if (flag === '--sys-limit') {
      const raw = args[i + 1];
      const value = Number(raw);
      if (raw === undefined || Number.isNaN(value)) {
        throw new Error('--sys-limit requires a numeric value');
      }
      overrides.sysMemLimitGb = value;
      i++;
      continue;
    }

    throw new Error(`Unknown option: ${flag}`);
  }

  return overrides;
}
