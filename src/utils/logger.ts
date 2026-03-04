import fs from 'node:fs';
import type { ProcessInfo } from './process.js';

const CSV_HEADER = 'timestamp,pid,phys_footprint_mb,rss_mb,vsz_mb,command';

export function ensureCsvHeader(logFile: string): void {
  if (!fs.existsSync(logFile) || fs.statSync(logFile).size === 0) {
    fs.writeFileSync(logFile, CSV_HEADER + '\n');
  }
}

export function appendCsv(logFile: string, entries: ProcessInfo[]): void {
  if (entries.length === 0) return;
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const lines = entries
    .map((e) => {
      const phys = e.physMb !== undefined ? String(e.physMb) : '';
      return `${ts},${e.pid},${phys},${e.rssMb},${e.vszMb},${e.command}`;
    })
    .join('\n');
  fs.appendFileSync(logFile, lines + '\n');
}
