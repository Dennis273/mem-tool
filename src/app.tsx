import React, { useState } from 'react';
import { Box, useApp, useInput } from 'ink';
import { SystemPanel } from './components/system-panel.js';
import { ProcessTable } from './components/process-table.js';
import { StatusBar } from './components/status-bar.js';
import { AlertLog } from './components/alert-log.js';
import { useMonitor } from './hooks/use-monitor.js';
import { getTotalRamGb } from './utils/commands.js';
import type { MonitorConfig } from './config.js';

const totalRamGb = getTotalRamGb();

type ViewMode = 'overview' | 'detail';

interface AppProps {
  config: MonitorConfig;
}

export function App({ config }: AppProps) {
  const { state, frozen, toggleFreeze } = useMonitor(config);
  const [view, setView] = useState<ViewMode>('overview');
  const { exit } = useApp();

  useInput((input) => {
    if (input === 'q') exit();
    if (input === 'f') toggleFreeze();
    if (input === 'd' && view === 'overview') setView('detail');
    if (input === 'b' && view === 'detail') setView('overview');
  });

  const totalGb = Math.round((state.totalMemMb / 1024) * 10) / 10;
  const windowMin = config.growthWindowSec / 60;

  return (
    <Box flexDirection="column">
      <AlertLog alerts={state.alerts} />
      <SystemPanel
        systemMemGb={state.systemMemGb}
        totalRamGb={totalRamGb}
        systemHistory={state.systemHistory}
        lastUpdate={state.lastUpdate}
        growthWindowMin={windowMin}
      />
      <ProcessTable
        processes={state.processes}
        processHistory={state.processHistory}
        config={config}
        view={view}
        lastUpdate={state.lastUpdate}
      />
      <StatusBar
        processCount={state.processes.length}
        totalGb={totalGb}
        frozen={frozen}
        view={view}
      />
    </Box>
  );
}
