import { execSync } from 'node:child_process';
import { parsePsAux, parseFootprint, buildProcessList, type ProcessInfo } from './process.js';
import { parseTotalRam, parseVmStat } from './system.js';

export function collectProcesses(topN: number): ProcessInfo[] {
  const raw = execSync('ps aux', { encoding: 'utf-8' });
  const entries = parsePsAux(raw);

  const getFootprint = (pid: number): number | undefined => {
    try {
      const output = execSync(`footprint ${pid}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return parseFootprint(output);
    } catch {
      return undefined;
    }
  };

  return buildProcessList(entries, getFootprint, topN);
}

export function getTotalRamGb(): number {
  const raw = execSync('sysctl -n hw.memsize', { encoding: 'utf-8' });
  return parseTotalRam(raw);
}

export function getSystemMemUsedGb(): number {
  const pageSize = Number(
    execSync('sysctl -n hw.pagesize', { encoding: 'utf-8' }).trim(),
  );
  const vmOutput = execSync('vm_stat', { encoding: 'utf-8' });
  return parseVmStat(vmOutput, pageSize);
}

export function sendNotification(title: string, body: string): void {
  try {
    execSync(
      `osascript -e 'display notification "${body}" with title "${title}" sound name "Blow"'`,
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
  } catch {
    // non-critical
  }
}
