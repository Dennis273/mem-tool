const BYTES_PER_GB = 1073741824;

export function parseTotalRam(raw: string): number {
  return Math.round(Number(raw.trim()) / BYTES_PER_GB);
}

export function parseVmStat(raw: string, pageSize: number): number {
  const parse = (label: string): number => {
    const re = new RegExp(`${label}:\\s+(\\d+)`);
    const match = re.exec(raw);
    return match ? Number(match[1]) : 0;
  };

  const active = parse('Pages active');
  const wired = parse('Pages wired down');
  const compressor = parse('Pages occupied by compressor');

  const usedBytes = (active + wired + compressor) * pageSize;
  return Math.round((usedBytes / BYTES_PER_GB) * 10) / 10;
}
