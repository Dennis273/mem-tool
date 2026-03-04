import React from 'react';
import { Box, Text } from 'ink';
import { renderMemoryBar } from '../utils/format.js';

interface MemoryBarProps {
  usedGb: number;
  totalGb: number;
  barWidth?: number;
}

export function MemoryBar({ usedGb, totalGb, barWidth = 22 }: MemoryBarProps) {
  const percent = Math.min(Math.round((usedGb / totalGb) * 100), 100);
  const bar = renderMemoryBar(usedGb, totalGb, barWidth);

  return (
    <Box>
      <Text>RAM  </Text>
      <Text color={percent > 90 ? 'red' : percent > 75 ? 'yellow' : 'green'}>{bar}</Text>
      <Text>  {String(percent).padStart(3)}%   {usedGb.toFixed(1)} / {totalGb} GB</Text>
    </Box>
  );
}
