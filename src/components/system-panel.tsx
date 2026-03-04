import React from 'react';
import { Box, Text } from 'ink';
import { TitledBox } from './titled-box.js';
import { MemoryBar } from './memory-bar.js';
import { Sparkline } from './sparkline.js';
import type { HistorySample } from '../hooks/use-monitor.js';

const LOGO = [
  ' ┏┳┓┏━╸┏┳┓   ╺┳╸┏━┓┏━┓╻  ',
  ' ┃┃┃┣╸ ┃┃┃    ┃ ┃ ┃┃ ┃┃  ',
  ' ╹ ╹┗━╸╹ ╹    ╹ ┗━┛┗━┛┗━╸',
];

interface SystemPanelProps {
  systemMemGb: number;
  totalRamGb: number;
  systemHistory: readonly HistorySample[];
  lastUpdate: string;
  growthWindowMin: number;
}

export function SystemPanel({
  systemMemGb,
  totalRamGb,
  systemHistory,
  lastUpdate,
  growthWindowMin,
}: SystemPanelProps) {
  return (
    <Box flexDirection="column">
      {LOGO.map((line, i) => (
        <Text key={i} bold color="cyan">{line}</Text>
      ))}
      <TitledBox title="系统内存" titleRight={lastUpdate}>
        <Text> </Text>
        <MemoryBar usedGb={systemMemGb} totalGb={totalRamGb} />
        <Box>
          <Text>     </Text>
          <Sparkline samples={systemHistory} />
          <Text>  {growthWindowMin}m</Text>
        </Box>
        <Text> </Text>
      </TitledBox>
    </Box>
  );
}
