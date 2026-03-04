import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createAlertManager } from '../alert.js';

describe('createAlertManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('first alert for a key always fires', () => {
    const onAlert = vi.fn();
    const manager = createAlertManager(300, onAlert);

    const fired = manager.tryAlert('proc_123', 'Title', 'Body');

    expect(fired).toBe(true);
    expect(onAlert).toHaveBeenCalledWith('Title', 'Body');
  });

  test('suppresses repeated alert within cooldown', () => {
    const onAlert = vi.fn();
    const manager = createAlertManager(300, onAlert);

    manager.tryAlert('proc_123', 'Title', 'Body 1');
    vi.advanceTimersByTime(100 * 1000);
    const fired = manager.tryAlert('proc_123', 'Title', 'Body 2');

    expect(fired).toBe(false);
    expect(onAlert).toHaveBeenCalledTimes(1);
  });

  test('allows alert after cooldown expires', () => {
    const onAlert = vi.fn();
    const manager = createAlertManager(300, onAlert);

    manager.tryAlert('proc_123', 'Title', 'Body 1');
    vi.advanceTimersByTime(301 * 1000);
    const fired = manager.tryAlert('proc_123', 'Title', 'Body 2');

    expect(fired).toBe(true);
    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  test('different keys have independent cooldowns', () => {
    const onAlert = vi.fn();
    const manager = createAlertManager(300, onAlert);

    manager.tryAlert('proc_1', 'Title', 'Body 1');
    manager.tryAlert('proc_2', 'Title', 'Body 2');

    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  test('works without onAlert callback', () => {
    const manager = createAlertManager(300);

    const fired = manager.tryAlert('key', 'Title', 'Body');

    expect(fired).toBe(true);
  });
});
