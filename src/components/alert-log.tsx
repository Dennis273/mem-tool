import React from 'react';
import { Static, Text } from 'ink';
import type { AlertEntry } from '../hooks/use-monitor.js';

interface AlertLogProps {
  alerts: AlertEntry[];
}

export function AlertLog({ alerts }: AlertLogProps) {
  if (alerts.length === 0) return null;

  return (
    <Static items={alerts}>
      {(alert, index) => (
        <Text key={index} color="red">
          {alert.time} ⚠ {alert.message}
        </Text>
      )}
    </Static>
  );
}
