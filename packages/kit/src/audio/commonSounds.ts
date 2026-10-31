import type { SoundDef } from './sounds';
import tick from './common/tick.wav';
import whoosh from './common/whoosh.wav';
import crowdRoar from './common/crowd-roar.wav';
import fireworks from './common/fireworks.wav';
import horn from './common/horn.wav';
import chantGeneric from './common/chant-generic.wav';
import fanfare from './common/fanfare.wav';

/** Shared placeholder sounds (see packages/kit/ASSETS.md). */
export const COMMON_SOUNDS: SoundDef[] = [
  { id: 'tick', category: 'ui', src: tick, volume: 0.5 },
  { id: 'whoosh', category: 'ui', src: whoosh },
  { id: 'crowd-roar', category: 'crowd', src: crowdRoar },
  { id: 'fireworks', category: 'effects', src: fireworks },
  { id: 'horn', category: 'effects', src: horn, volume: 0.8 },
  { id: 'fanfare', category: 'effects', src: fanfare },
  { id: 'chant-generic', category: 'voice', src: chantGeneric },
];
