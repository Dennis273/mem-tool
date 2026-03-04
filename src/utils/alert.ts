export interface AlertManager {
  tryAlert: (key: string, title: string, body: string) => boolean;
}

export function createAlertManager(
  cooldownSec: number,
  onAlert?: (title: string, body: string) => void,
): AlertManager {
  const lastAlertTime = new Map<string, number>();

  return {
    tryAlert(key, title, body) {
      const now = Date.now();
      const prev = lastAlertTime.get(key);
      if (prev !== undefined && now - prev < cooldownSec * 1000) return false;

      lastAlertTime.set(key, now);
      onAlert?.(title, body);
      return true;
    },
  };
}
