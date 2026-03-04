import type { EnrichedProcess } from '../hooks/use-monitor.js';

const SPARK_CHARS = '▁▂▃▄▅▆▇█';

export function renderSparkline(samples: number[], width: number): string {
  if (samples.length === 0) return ' '.repeat(width);

  const visible = samples.slice(-width);
  const min = Math.min(...visible);
  const max = Math.max(...visible);
  const range = max - min;

  const sparks = visible
    .map((v) => {
      if (range === 0) return SPARK_CHARS[0];
      const idx = Math.round(((v - min) / range) * (SPARK_CHARS.length - 1));
      return SPARK_CHARS[idx];
    })
    .join('');

  return sparks.padStart(width);
}

export function renderMemoryBar(usedGb: number, totalGb: number, width: number): string {
  const ratio = Math.min(usedGb / totalGb, 1);
  const filled = Math.round(ratio * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export function commandBasename(command: string): string {
  const macOsMarker = '/Contents/MacOS/';
  const macOsIdx = command.indexOf(macOsMarker);

  if (macOsIdx !== -1) {
    const afterMacOs = command.slice(macOsIdx + macOsMarker.length);
    const argIdx = afterMacOs.search(/ --?[a-zA-Z]/);
    return argIdx !== -1 ? afterMacOs.slice(0, argIdx) : afterMacOs;
  }

  const firstSpace = command.indexOf(' ');
  const execPath = firstSpace !== -1 ? command.slice(0, firstSpace) : command;
  const lastSlash = execPath.lastIndexOf('/');
  return lastSlash !== -1 ? execPath.slice(lastSlash + 1) : execPath;
}

export function classifyProcesses(
  processes: readonly EnrichedProcess[],
  procLimitMb: number,
  growthLimitMb: number,
): { abnormal: EnrichedProcess[]; normal: EnrichedProcess[] } {
  const abnormal: EnrichedProcess[] = [];
  const normal: EnrichedProcess[] = [];

  for (const proc of processes) {
    const overMemory = proc.physMb !== undefined && proc.physMb > procLimitMb;
    const overGrowth = proc.growthMb !== undefined && proc.growthMb > growthLimitMb;
    if (overMemory || overGrowth) {
      abnormal.push(proc);
    } else {
      normal.push(proc);
    }
  }

  return { abnormal, normal };
}
