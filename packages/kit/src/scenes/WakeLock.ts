interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
}

/** Keeps the screen awake while the game runs; re-acquired when the tab becomes visible again. */
export class ScreenWakeLock {
  private sentinel: WakeLockSentinelLike | null = null;
  private wanted = false;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (this.wanted && document.visibilityState === 'visible') void this.acquire();
    });
  }

  async request(): Promise<boolean> {
    this.wanted = true;
    return this.acquire();
  }

  get active(): boolean {
    return Boolean(this.sentinel && !this.sentinel.released);
  }

  private async acquire(): Promise<boolean> {
    const api = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> } }).wakeLock;
    if (!api) return false;
    try {
      this.sentinel = await api.request('screen');
      return true;
    } catch {
      return false;
    }
  }
}

/** Enters fullscreen if possible. Must be called during a user gesture. Never throws. */
export async function enterFullscreen(): Promise<boolean> {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return Boolean(document.fullscreenElement);
  try {
    await el.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch {
    return false;
  }
}
