#!/usr/bin/env node
// One-off generator for the kit's placeholder sounds (run by hand: `npm run sounds -w packages/kit`).
// Pure synthesis with a seeded PRNG, no external services; output is committed and dedicated to CC0.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'audio', 'common');

let seed = 1234567;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const norm = peak > 0 ? 0.89 / peak : 1;
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * norm)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const render = (seconds, fn) => Array.from({ length: Math.floor(seconds * RATE) }, (_, i) => fn(i / RATE, i));
const env = (t, a, d, total) => Math.min(1, t / a) * Math.max(0, Math.min(1, (total - t) / d));

function lowpass(samples, alpha) {
  let y = 0;
  return samples.map((x) => (y += alpha * (x - y)));
}
function bandpass(samples, lo, hi) {
  const l1 = lowpass(samples, hi);
  const l2 = lowpass(samples, lo);
  return l1.map((v, i) => v - l2[i]);
}

const sounds = {
  // Soft hover tick.
  tick: render(0.06, (t) => Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 70) * 0.5),

  // Activation whoosh: noise with a rising band.
  whoosh: (() => {
    const n = render(0.45, () => noise());
    const out = [];
    let y1 = 0;
    let y2 = 0;
    n.forEach((x, i) => {
      const t = i / RATE;
      const a = 0.05 + 0.4 * (t / 0.45);
      y1 += a * (x - y1);
      y2 += 0.02 * (y1 - y2);
      out.push((y1 - y2) * Math.sin((Math.PI * t) / 0.45));
    });
    return out;
  })(),

  // Crowd roar: band-limited noise plus many detuned "voices".
  'crowd-roar': (() => {
    const T = 3.2;
    const base = bandpass(render(T, () => noise()), 0.04, 0.35);
    const voices = Array.from({ length: 24 }, () => ({ f: 180 + rand() * 260, v: 3 + rand() * 4, p: rand() * 6 }));
    return base.map((b, i) => {
      const t = i / RATE;
      let v = 0;
      for (const o of voices) v += Math.sin(2 * Math.PI * (o.f + 12 * Math.sin(o.v * t + o.p)) * t + o.p);
      return (b * 1.4 + (v / voices.length) * 0.5) * env(t, 0.5, 1.2, T);
    });
  })(),

  // Firework: low boom then crackles.
  fireworks: (() => {
    const T = 1.6;
    const boom = lowpass(render(T, () => noise()), 0.03);
    return boom.map((b, i) => {
      const t = i / RATE;
      const crack = t > 0.35 && rand() < 0.004 * Math.exp(-(t - 0.35) * 2) ? noise() * 4 : 0;
      return b * 6 * Math.exp(-t * 5) + crack;
    });
  })(),

  // Stadium air horn.
  horn: render(1.3, (t) => {
    const f = 233 + 3 * Math.sin(2 * Math.PI * 6 * t);
    let s = 0;
    for (let k = 1; k <= 8; k++) s += Math.sin(2 * Math.PI * f * k * t + k) / k;
    return Math.tanh(s * 1.5) * env(t, 0.04, 0.2, 1.3);
  }),

  // Generic goal chant: a vowel-like "ooh-ah" with a crowd bed (used until real voice lines exist).
  'chant-generic': (() => {
    const T = 1.8;
    const bed = bandpass(render(T, () => noise()), 0.05, 0.3);
    return bed.map((b, i) => {
      const t = i / RATE;
      const f = 196 * (t < 1 ? 1 : 1.26);
      let s = 0;
      for (let k = 1; k <= 6; k++) s += (Math.sin(2 * Math.PI * f * k * t) * (k === 2 || k === 3 ? 1 : 0.4)) / k;
      return (s * 0.8 + b * 0.8) * env(t, 0.08, 0.4, T);
    });
  })(),

  // "NEW EFFECT!" fanfare: rising arpeggio.
  fanfare: render(1.2, (t) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const idx = Math.min(3, Math.floor(t / 0.15));
    const f = notes[idx];
    const local = t - idx * 0.15;
    const sq = Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.4 + Math.sin(2 * Math.PI * f * t) * 0.6;
    return sq * Math.exp(-local * (idx === 3 ? 2 : 8)) * env(t, 0.01, 0.2, 1.2);
  }),
};

mkdirSync(OUT, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  const file = join(OUT, `${name}.wav`);
  writeFileSync(file, wav(samples));
  console.log(`wrote ${file}`);
}
