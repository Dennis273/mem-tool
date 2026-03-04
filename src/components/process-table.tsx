import React from 'react';
import { Box, Text } from 'ink';
import type { EnrichedProcess, HistorySample } from '../hooks/use-monitor.js';
import type { MonitorConfig } from '../config.js';
import { TitledBox } from './titled-box.js';
import { Sparkline } from './sparkline.js';
import { classifyProcesses, commandBasename } from '../utils/format.js';

type ViewMode = 'overview' | 'detail';

interface ProcessTableProps {
  processes: EnrichedProcess[];
  processHistory: ReadonlyMap<number, readonly HistorySample[]>;
  config: MonitorConfig;
  view: ViewMode;
  lastUpdate: string;
}

function getColor(
  physMb: number | undefined,
  growthMb: number | undefined,
  procLimitMb: number,
  growthLimitMb: number,
): string {
  if (physMb !== undefined && physMb > procLimitMb) return 'red';
  if (growthMb !== undefined && growthMb > growthLimitMb) return 'red';
  if (physMb !== undefined && physMb > 800) return 'yellow';
  return 'green';
}

function formatGrowth(growthMb: number | undefined, windowMin: number): string {
  if (growthMb === undefined) return `--/${windowMin}m`;
  const sign = growthMb >= 0 ? '+' : '';
  return `${sign}${growthMb}/${windowMin}m`;
}

function formatMb(mb: number | undefined): string {
  if (mb === undefined) return '  --';
  return `${mb} MB`;
}

interface OverviewRowProps {
  proc: EnrichedProcess;
  history: readonly HistorySample[];
  windowMin: number;
  config: MonitorConfig;
  isAbnormal: boolean;
}

function OverviewRow({ proc, history, windowMin, config, isAbnormal }: OverviewRowProps) {
  const color = getColor(proc.physMb, proc.growthMb, config.procLimitMb, config.growthLimitMb);
  const dot = isAbnormal ? '●' : '○';
  const growth = formatGrowth(proc.growthMb, windowMin);
  const name = commandBasename(proc.command);

  return (
    <Box textWrap="truncate">
      <Text>  </Text>
      <Text color={color}>{dot}</Text>
      <Text> {String(proc.pid).padEnd(7)} </Text>
      <Text>{String(formatMb(proc.physMb)).padStart(8)}</Text>
      <Text>  {growth.padStart(12)}  </Text>
      {history.length > 1 && <Sparkline samples={history} width={8} />}
      {history.length <= 1 && <Text>        </Text>}
      <Text>  {name}</Text>
    </Box>
  );
}

function OverviewView({ processes, processHistory, config, windowMin }: {
  processes: EnrichedProcess[];
  processHistory: ReadonlyMap<number, readonly HistorySample[]>;
  config: MonitorConfig;
  windowMin: number;
}) {
  const { abnormal, normal } = classifyProcesses(processes, config.procLimitMb, config.growthLimitMb);
  const top5 = normal.slice(0, 5);

  return (
    <Box flexDirection="column">
      {abnormal.length > 0 && (
        <TitledBox title={`异常 (${abnormal.length})`}>
          <Text> </Text>
          {abnormal.map((proc) => (
            <OverviewRow
              key={proc.pid}
              proc={proc}
              history={processHistory.get(proc.pid) ?? []}
              windowMin={windowMin}
              config={config}
              isAbnormal
            />
          ))}
          <Text> </Text>
        </TitledBox>
      )}
      <TitledBox title={`Top ${top5.length}`}>
        <Text> </Text>
        {top5.length === 0 ? (
          <Text dimColor>  no processes found</Text>
        ) : (
          top5.map((proc) => (
            <OverviewRow
              key={proc.pid}
              proc={proc}
              history={processHistory.get(proc.pid) ?? []}
              windowMin={windowMin}
              config={config}
              isAbnormal={false}
            />
          ))
        )}
        <Text> </Text>
      </TitledBox>
    </Box>
  );
}

function DetailRow({ proc, config, windowMin, isAbnormal }: {
  proc: EnrichedProcess;
  config: MonitorConfig;
  windowMin: number;
  isAbnormal: boolean;
}) {
  const color = getColor(proc.physMb, proc.growthMb, config.procLimitMb, config.growthLimitMb);
  const dot = isAbnormal ? '●' : '○';
  const growth = proc.growthMb !== undefined ? `+${proc.growthMb}` : '--';
  const name = commandBasename(proc.command);
  const phys = proc.physMb !== undefined ? `${proc.physMb} MB` : '    --';
  const rss = `${proc.rssMb} MB`;
  const vsz = `${Math.round(proc.vszMb / 1024)} GB`;

  return (
    <Box textWrap="truncate">
      <Text>  </Text>
      <Text color={color}>{dot}</Text>
      <Text> {String(proc.pid).padEnd(7)} </Text>
      <Text>{phys.padStart(8)}</Text>
      <Text>  {rss.padStart(8)}</Text>
      <Text>  {vsz.padStart(7)}</Text>
      <Text>  {growth.padStart(6)}</Text>
      <Text>  {name}</Text>
    </Box>
  );
}

function DetailView({ processes, config, windowMin, lastUpdate }: {
  processes: EnrichedProcess[];
  config: MonitorConfig;
  windowMin: number;
  lastUpdate: string;
}) {
  const { abnormal, normal } = classifyProcesses(processes, config.procLimitMb, config.growthLimitMb);
  const topN = processes.slice(0, config.topN);

  return (
    <TitledBox title="进程详情" titleRight={lastUpdate}>
      <Text> </Text>
      <Box>
        <Text dimColor>
          {'  '}{'  '}{'PID'.padEnd(8)} {'PHYS'.padStart(8)}  {'RSS'.padStart(8)}  {'VSZ'.padStart(7)}  {'GROWTH'.padStart(6)}  CMD
        </Text>
      </Box>
      {topN.map((proc) => {
        const isAbn = abnormal.some((a) => a.pid === proc.pid);
        return (
          <DetailRow
            key={proc.pid}
            proc={proc}
            config={config}
            windowMin={windowMin}
            isAbnormal={isAbn}
          />
        );
      })}
      <Text> </Text>
    </TitledBox>
  );
}

export function ProcessTable({ processes, processHistory, config, view, lastUpdate }: ProcessTableProps) {
  const windowMin = config.growthWindowSec / 60;

  if (view === 'detail') {
    return <DetailView processes={processes} config={config} windowMin={windowMin} lastUpdate={lastUpdate} />;
  }

  return (
    <OverviewView
      processes={processes}
      processHistory={processHistory}
      config={config}
      windowMin={windowMin}
    />
  );
}
