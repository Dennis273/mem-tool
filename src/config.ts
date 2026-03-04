import path from 'node:path';
import os from 'node:os';

export interface MonitorConfig {
  intervalSec: number;
  procLimitMb: number;
  growthWindowSec: number;
  growthLimitMb: number;
  sysMemLimitGb: number;
  alertCooldownSec: number;
  logFile: string;
  topN: number;
}

export const DEFAULT_CONFIG: MonitorConfig = {
  intervalSec: 30,
  procLimitMb: 1500,
  growthWindowSec: 1800,
  growthLimitMb: 200,
  sysMemLimitGb: 150,
  alertCooldownSec: 300,
  logFile: path.join(os.homedir(), 'mem-tool-log.csv'),
  topN: 20,
};
