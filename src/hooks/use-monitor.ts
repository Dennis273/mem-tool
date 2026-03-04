import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProcessInfo } from '../utils/process.js';
import type { MonitorConfig } from '../config.js';
import { collectProcesses, getSystemMemUsedGb, sendNotification } from '../utils/commands.js';
import { createAlertManager } from '../utils/alert.js';
import { computeGrowth, trimHistory, type HistorySample } from '../utils/growth.js';
import { appendCsv, ensureCsvHeader } from '../utils/logger.js';

export type { HistorySample } from '../utils/growth.js';

export interface AlertEntry {
  time: string;
  message: string;
}

export interface EnrichedProcess extends ProcessInfo {
  growthMb: number | undefined;
}

export interface MonitorState {
  processes: EnrichedProcess[];
  systemMemGb: number;
  alerts: AlertEntry[];
  lastUpdate: string;
  totalMemMb: number;
  processHistory: ReadonlyMap<number, readonly HistorySample[]>;
  systemHistory: readonly HistorySample[];
}

export interface MonitorControls {
  state: MonitorState;
  frozen: boolean;
  toggleFreeze: () => void;
}

function enrichProcesses(
  processes: ProcessInfo[],
  historyMap: Map<number, HistorySample[]>,
  nowEpoch: number,
  config: MonitorConfig,
): EnrichedProcess[] {
  return processes.map((proc) => {
    if (proc.physMb === undefined) {
      return { ...proc, growthMb: undefined };
    }

    const samples = historyMap.get(proc.pid) ?? [];
    samples.push({ epoch: nowEpoch, physMb: proc.physMb });
    const trimmed = trimHistory(samples, nowEpoch, config.growthWindowSec);
    historyMap.set(proc.pid, trimmed);

    const growthMb = computeGrowth(trimmed, proc.physMb, nowEpoch, config.growthWindowSec);
    return { ...proc, growthMb };
  });
}

function createInitialState(config: MonitorConfig): MonitorState {
  const processes = collectProcesses(config.topN);
  const systemMemGb = getSystemMemUsedGb();
  const enriched = processes.map((p) => ({ ...p, growthMb: undefined as number | undefined }));
  return {
    processes: enriched,
    systemMemGb,
    alerts: [],
    lastUpdate: new Date().toLocaleTimeString('en-US', { hour12: false }),
    totalMemMb: enriched.reduce((sum, p) => sum + (p.physMb ?? p.rssMb), 0),
    processHistory: new Map(),
    systemHistory: [],
  };
}

export function useMonitor(config: MonitorConfig): MonitorControls {
  const [state, setState] = useState<MonitorState>(() => createInitialState(config));
  const [frozen, setFrozen] = useState(false);
  const historyRef = useRef(new Map<number, HistorySample[]>());
  const systemHistoryRef = useRef<HistorySample[]>([]);
  const frozenRef = useRef(false);
  const alertManagerRef = useRef(
    createAlertManager(config.alertCooldownSec, sendNotification),
  );

  const toggleFreeze = useCallback(() => {
    frozenRef.current = !frozenRef.current;
    setFrozen(frozenRef.current);
  }, []);

  useEffect(() => {
    ensureCsvHeader(config.logFile);

    const tick = () => {
      if (frozenRef.current) return;

      const nowEpoch = Math.floor(Date.now() / 1000);
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
      const processes = collectProcesses(config.topN);
      const systemMemGb = getSystemMemUsedGb();
      const history = historyRef.current;
      const sysHistory = systemHistoryRef.current;
      const alertManager = alertManagerRef.current;
      const newAlerts: AlertEntry[] = [];

      const enriched = enrichProcesses(processes, history, nowEpoch, config);

      sysHistory.push({ epoch: nowEpoch, physMb: Math.round(systemMemGb * 1024) });
      const sysCutoff = nowEpoch - config.growthWindowSec - 120;
      while (sysHistory.length > 0 && sysHistory[0].epoch < sysCutoff) {
        sysHistory.shift();
      }

      appendCsv(config.logFile, processes);

      for (const proc of enriched) {
        if (proc.physMb !== undefined && proc.physMb > config.procLimitMb) {
          const sent = alertManager.tryAlert(
            `proc_${proc.pid}`,
            'Memory Alert',
            `PID ${proc.pid}: ${proc.physMb} MB > ${config.procLimitMb} MB`,
          );
          if (sent) {
            newAlerts.push({ time: ts, message: `PID ${proc.pid}: ${proc.physMb} MB > ${config.procLimitMb} MB` });
          }
        }

        if (proc.growthMb !== undefined && proc.growthMb > config.growthLimitMb) {
          const sent = alertManager.tryAlert(
            `grow_${proc.pid}`,
            'Memory Growth',
            `PID ${proc.pid}: +${proc.growthMb} MB / ${config.growthWindowSec / 60}m`,
          );
          if (sent) {
            newAlerts.push({ time: ts, message: `PID ${proc.pid}: +${proc.growthMb} MB / ${config.growthWindowSec / 60}m` });
          }
        }
      }

      if (systemMemGb > config.sysMemLimitGb) {
        const sent = alertManager.tryAlert(
          'sys',
          'System Memory',
          `System: ${systemMemGb} GB > ${config.sysMemLimitGb} GB`,
        );
        if (sent) {
          newAlerts.push({ time: ts, message: `System: ${systemMemGb} GB > ${config.sysMemLimitGb} GB` });
        }
      }

      const alivePids = new Set(processes.map((p) => p.pid));
      for (const pid of history.keys()) {
        if (!alivePids.has(pid)) history.delete(pid);
      }

      setState((prev) => ({
        processes: enriched,
        systemMemGb,
        alerts: [...prev.alerts, ...newAlerts],
        lastUpdate: ts,
        totalMemMb: enriched.reduce((sum, p) => sum + (p.physMb ?? p.rssMb), 0),
        processHistory: new Map(history),
        systemHistory: [...sysHistory],
      }));
    };

    const id = setInterval(tick, config.intervalSec * 1000);
    return () => clearInterval(id);
  }, [config]);

  return { state, frozen, toggleFreeze };
}
