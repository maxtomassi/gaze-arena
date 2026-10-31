import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_KEY, Settings, sanitizeSettings } from '../src/settings/Settings';

describe('Settings', () => {
  beforeEach(() => localStorage.clear());

  it('uses the shared gaze-arena: key prefix', () => {
    expect(SETTINGS_KEY).toBe('gaze-arena:settings');
  });

  it('defaults when nothing is stored or data is corrupt', () => {
    expect(new Settings().value).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_KEY, '{not json');
    expect(new Settings().value).toEqual(DEFAULT_SETTINGS);
  });

  it('persists updates and reloads them', () => {
    const s = new Settings();
    s.update({ targetScale: 1.3, intensity: 'calm', locale: 'it', volumes: { crowd: 0.2 } });
    const again = new Settings();
    expect(again.value.targetScale).toBe(1.3);
    expect(again.value.intensity).toBe('calm');
    expect(again.value.locale).toBe('it');
    expect(again.value.volumes.crowd).toBe(0.2);
    expect(again.value.volumes.ui).toBe(DEFAULT_SETTINGS.volumes.ui);
  });

  it('clamps and validates every field', () => {
    const s = sanitizeSettings({
      targetScale: 9,
      intensity: 'loud',
      choices: 3,
      locale: 'fr',
      volumes: { ui: -1, voice: 4 },
      matchMinutes: 60,
      simulator: 'yes',
    });
    expect(s.targetScale).toBe(1.5);
    expect(s.intensity).toBe('normal');
    expect(s.choices).toBe(4);
    expect(s.locale).toBeNull();
    expect(s.volumes.ui).toBe(0);
    expect(s.volumes.voice).toBe(1);
    expect(s.matchMinutes).toBe(3);
    expect(s.simulator).toBe(false);
    expect(sanitizeSettings({ targetScale: 0.1 }).targetScale).toBe(0.8);
  });

  it('notifies listeners with next and previous values, only on real changes', () => {
    const s = new Settings();
    const fn = vi.fn();
    s.onChange(fn);
    s.update({ choices: 2 });
    s.update({ choices: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0]?.[0].choices).toBe(2);
    expect(fn.mock.calls[0]?.[1].choices).toBe(4);
  });

  it('keeps working when storage throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    const s = new Settings(broken);
    s.update({ targetScale: 1.2 });
    expect(s.value.targetScale).toBe(1.2);
  });
});
