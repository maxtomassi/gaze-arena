import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputGate } from '../src/input/InputGate';
import { ClickDebounce } from '../src/input/Debounce';
import { ArmingMachine } from '../src/input/ArmingMachine';

describe('InputGate', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('stays locked for the action plus a 500 ms tail', async () => {
    const gate = new InputGate();
    let finish!: () => void;
    const work = new Promise<void>((r) => (finish = r));
    void gate.lockUntil(work);
    expect(gate.locked).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(gate.locked).toBe(true);
    finish();
    await vi.advanceTimersByTimeAsync(499);
    expect(gate.locked).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(gate.locked).toBe(false);
  });

  it('lock(ms) adds the tail', () => {
    const gate = new InputGate();
    gate.lock(1000);
    vi.advanceTimersByTime(1499);
    expect(gate.locked).toBe(true);
    vi.advanceTimersByTime(1);
    expect(gate.locked).toBe(false);
  });

  it('overlapping holds unlock only after the last one, and a new hold cancels the tail', () => {
    const gate = new InputGate();
    const a = gate.hold();
    const b = gate.hold();
    a();
    vi.advanceTimersByTime(1000);
    expect(gate.locked).toBe(true);
    b();
    vi.advanceTimersByTime(300);
    const c = gate.hold();
    vi.advanceTimersByTime(1000);
    expect(gate.locked).toBe(true);
    c();
    c(); // releasing twice is harmless
    vi.advanceTimersByTime(500);
    expect(gate.locked).toBe(false);
  });

  it('notifies listeners only on transitions', () => {
    const gate = new InputGate();
    const seen: boolean[] = [];
    gate.onChange((l) => seen.push(l));
    const r1 = gate.hold();
    const r2 = gate.hold();
    r1();
    r2();
    vi.advanceTimersByTime(500);
    expect(seen).toEqual([true, false]);
  });
});

describe('ClickDebounce', () => {
  it('ignores a click within 400 ms and 40 px of the previous one', () => {
    const d = new ClickDebounce();
    expect(d.accept(100, 100, 0)).toBe(true);
    expect(d.accept(110, 105, 200)).toBe(false);
    expect(d.accept(112, 100, 500)).toBe(false); // 300 ms after the previous (rejected) click
    expect(d.accept(112, 100, 900)).toBe(true);
  });

  it('measures time from the last click, accepted or not', () => {
    const d = new ClickDebounce();
    expect(d.accept(0, 0, 0)).toBe(true);
    expect(d.accept(0, 0, 399)).toBe(false);
    expect(d.accept(0, 0, 798)).toBe(false);
    expect(d.accept(0, 0, 1200)).toBe(true);
  });

  it('accepts a quick click elsewhere', () => {
    const d = new ClickDebounce();
    expect(d.accept(100, 100, 0)).toBe(true);
    expect(d.accept(500, 100, 100)).toBe(true);
  });
});

describe('ArmingMachine', () => {
  it('10 clicks without leaving give exactly one activation', () => {
    const m = new ArmingMachine();
    m.setInside(true);
    const results = Array.from({ length: 10 }, () => m.click(false));
    expect(results.filter((r) => r === 'activate')).toHaveLength(1);
    expect(results[0]).toBe('activate');
  });

  it('re-arms only after the pointer leaves', () => {
    const m = new ArmingMachine();
    m.setInside(true);
    expect(m.click(false)).toBe('activate');
    expect(m.click(false)).toBe('ignored-disarmed');
    expect(m.setInside(false)).toBe('leave');
    expect(m.setInside(true)).toBe('enter');
    expect(m.click(false)).toBe('activate');
  });

  it('a click while the gate is locked also disarms (no Repeat Click chains)', () => {
    const m = new ArmingMachine();
    m.setInside(true);
    expect(m.click(true)).toBe('ignored-locked');
    expect(m.click(false)).toBe('ignored-disarmed');
    m.setInside(false);
    m.setInside(true);
    expect(m.click(false)).toBe('activate');
  });

  it('hover shows only when inside, armed and unlocked', () => {
    const m = new ArmingMachine();
    expect(m.hovered(false)).toBe(false);
    m.setInside(true);
    expect(m.hovered(false)).toBe(true);
    expect(m.hovered(true)).toBe(false);
    m.click(false);
    expect(m.hovered(false)).toBe(false);
  });

  it('disabled buttons ignore clicks without disarming', () => {
    const m = new ArmingMachine();
    m.setInside(true);
    expect(m.click(false, false)).toBe('ignored-disabled');
    expect(m.click(false, true)).toBe('activate');
  });
});
