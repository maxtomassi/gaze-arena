export type Intensity = 'calm' | 'normal' | 'max';

export interface IntensityProfile {
  /** Camera shake intensity (Phaser units); 0 disables shake. */
  shake: number;
  /** Multiplier for particle counts. */
  particles: number;
  /** Whether full-screen flashes are allowed at all. */
  flashes: boolean;
  /** Multiplier applied to the crowd audio category. */
  crowdVolume: number;
}

export const INTENSITY_PROFILES: Record<Intensity, IntensityProfile> = {
  calm: { shake: 0, particles: 0.35, flashes: false, crowdVolume: 0.35 },
  normal: { shake: 0.006, particles: 1, flashes: true, crowdVolume: 1 },
  max: { shake: 0.012, particles: 1.6, flashes: true, crowdVolume: 1 },
};

export function intensityProfile(intensity: Intensity): IntensityProfile {
  return INTENSITY_PROFILES[intensity];
}
