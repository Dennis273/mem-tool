export interface PsEntry {
  pid: number;
  user: string;
  rssMb: number;
  vszMb: number;
  command: string;
}

export interface ProcessInfo extends PsEntry {
  physMb: number | undefined;
}

const KB_TO_MB = 1 / 1024;

export function parsePsAux(raw: string): PsEntry[] {
  const lines = raw.split('\n').filter(Boolean);
  if (lines.length <= 1) return [];

  const entries: PsEntry[] = [];

  for (const line of lines.slice(1)) {
    //  USER  PID  %CPU  %MEM  VSZ  RSS  TT  STAT  STARTED  TIME  COMMAND...
    //  0     1    2     3     4    5    6   7     8        9     10+
    const parts = line.trim().split(/\s+/);
    if (parts.length < 11) continue;

    const user = parts[0];
    if (user === 'root' || user === '_windowserver') continue;

    const pid = Number(parts[1]);
    if (Number.isNaN(pid)) continue;

    const vszKb = Number(parts[4]);
    const rssKb = Number(parts[5]);
    if (Number.isNaN(vszKb) || Number.isNaN(rssKb)) continue;

    const command = parts.slice(10).join(' ');

    entries.push({
      pid,
      user,
      rssMb: Math.round(rssKb * KB_TO_MB * 10) / 10,
      vszMb: Math.round(vszKb * KB_TO_MB * 10) / 10,
      command,
    });
  }

  return entries.sort((a, b) => b.rssMb - a.rssMb);
}

export function parseFootprint(raw: string): number | undefined {
  const match = /Footprint:\s*(\d+)\s*MB/.exec(raw);
  return match ? Number(match[1]) : undefined;
}

export function buildProcessList(
  entries: PsEntry[],
  getFootprint: (pid: number) => number | undefined,
  topN: number,
): ProcessInfo[] {
  const enriched = entries.map((entry, index) => ({
    ...entry,
    physMb: index < topN ? getFootprint(entry.pid) : undefined,
  }));

  const top = enriched.slice(0, topN).sort((a, b) => (b.physMb ?? b.rssMb) - (a.physMb ?? a.rssMb));
  const rest = enriched.slice(topN);

  return [...top, ...rest];
}
