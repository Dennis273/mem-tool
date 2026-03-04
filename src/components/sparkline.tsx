import React from 'react';
import { Text } from 'ink';
import type { HistorySample } from '../hooks/use-monitor.js';
import { renderSparkline } from '../utils/format.js';

interface SparklineProps {
  samples: readonly HistorySample[];
  width?: number;
}

export function Sparkline({ samples, width = 16 }: SparklineProps) {
  const values = samples.map((s) => s.physMb);
  return <Text dimColor>{renderSparkline(values, width)}</Text>;
}
