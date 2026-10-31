import type { Rect } from './constants';
import type { LayoutResult } from '../ui/layout';

/** Something with a hitbox the simulator overlay and tests can inspect. */
export interface TargetInfo {
  id: string;
  hitbox: Rect;
  graphic: Rect;
  state: string;
  enabled: boolean;
  /** Rendered opacity (0.6 when locked). */
  alpha: number;
  label: { text: string; bounds: Rect; fontSize: number; fits: boolean } | null;
}

export interface ZoneSource {
  describe(): TargetInfo;
}

/** What the current scene shows: its targets, rest area and layout result. */
export class Zones {
  readonly targets = new Set<ZoneSource>();
  restArea: Rect | null = null;
  layout: LayoutResult | null = null;
  private listeners = new Set<() => void>();

  setLayout(layout: LayoutResult | null, restArea: Rect | null = layout?.restArea ?? null): void {
    this.layout = layout;
    this.restArea = restArea;
    for (const l of this.listeners) l();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  describeTargets(): TargetInfo[] {
    return [...this.targets].map((t) => t.describe());
  }
}
