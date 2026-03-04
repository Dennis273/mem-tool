import React from 'react';
import { Box, Text } from 'ink';

type ViewMode = 'overview' | 'detail';

interface StatusBarProps {
  processCount: number;
  totalGb: number;
  frozen: boolean;
  view: ViewMode;
}

export function StatusBar({ processCount, totalGb, frozen, view }: StatusBarProps) {
  const navKey = view === 'overview' ? 'd:详情' : 'b:返回';

  return (
    <Box>
      <Text dimColor>
        {' '}{processCount} procs │ total {totalGb.toFixed(1)} GB │ {navKey}  f:冻结  q:退出
      </Text>
      {frozen && <Text color="red" bold> [FROZEN]</Text>}
    </Box>
  );
}
