import type { Kit } from '../core/Kit';
import { TARGET_SCALE_MAX, TARGET_SCALE_MIN } from '../core/constants';
import { SUPPORTED_LOCALES, isLocale } from '../i18n/locales';
import { enterFullscreen } from '../scenes/WakeLock';
import { CHOICES, INTENSITIES, MATCH_MINUTES, VOLUME_CATEGORIES, type Choices, type MatchMinutes } from '../settings/Settings';
import type { Intensity } from '../fx/intensity';

export const ADULT_PANEL_ID = 'ga-adult-panel';

/**
 * Settings panel for adults. Opened and closed only from the keyboard (P, or Esc outside
 * fullscreen — browsers reserve Esc to leave fullscreen). While open the game is paused and the
 * InputGate is held. It is a plain DOM form, so it works with keyboard and mouse.
 */
export class AdultPanel {
  readonly root: HTMLDivElement;
  private releaseGate: (() => void) | null = null;

  constructor(private readonly kit: Kit) {
    this.root = document.createElement('div');
    this.root.id = ADULT_PANEL_ID;
    this.root.className = 'ga-adult';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.hidden = true;
    document.body.appendChild(this.root);

    window.addEventListener('keydown', this.onKey, { capture: true });
    kit.i18n.onChange(() => this.render());
    kit.settings.onChange(() => this.syncValues());
    kit.zones.onChange(() => this.syncValues());
    document.addEventListener('fullscreenchange', () => this.syncValues());
    this.render();
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    if (this.isOpen) return;
    this.kit.paused = true;
    this.releaseGate = this.kit.gate.hold();
    // SceneManager pause/resume apply immediately (the ScenePlugin versions are queued).
    const manager = this.kit.game.scene;
    for (const s of manager.getScenes(true)) manager.pause(s.scene.key);
    this.kit.telemetry.record('adult-open');
    this.syncValues();
    this.root.hidden = false;
    this.root.querySelector<HTMLElement>('select, input, button')?.focus();
  }

  close(): void {
    if (!this.isOpen) return;
    this.root.hidden = true;
    // Only the panel pauses scenes, so resume every paused one (robust to quick P presses).
    const manager = this.kit.game.scene;
    for (const s of manager.getScenes(false)) if (s.scene.isPaused()) manager.resume(s.scene.key);
    this.kit.paused = false;
    this.releaseGate?.();
    this.releaseGate = null;
    this.kit.telemetry.record('adult-close');
    (document.activeElement as HTMLElement | null)?.blur();
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      this.toggle();
    } else if (e.key === 'Escape') {
      if (this.isOpen) this.close();
      else if (!document.fullscreenElement) this.open();
    }
  };

  private render(): void {
    const t = (k: string, p?: Record<string, string | number>) => escapeHtml(this.kit.t(k, p));
    const option = (value: string, label: string) => `<option value="${value}">${escapeHtml(label)}</option>`;
    const volumes = VOLUME_CATEGORIES.map(
      (c) => `<label class="ga-field"><span>${t(`common.adult.volume.${c}`)}</span>
        <input type="range" min="0" max="1" step="0.05" data-volume="${c}"></label>`,
    ).join('');
    this.root.innerHTML = `
      <form class="ga-adult__card">
        <h2>${t('common.adult.title')}</h2>
        <label class="ga-field"><span>${t('common.adult.language')}</span>
          <select data-setting="locale">
            ${option('auto', this.kit.t('common.adult.languageAuto'))}
            ${SUPPORTED_LOCALES.map((l) => option(l, this.kit.t(`common.language.${l}`))).join('')}
          </select></label>
        <label class="ga-field"><span>${t('common.adult.targetScale')} <output data-out="targetScale"></output></span>
          <input type="range" min="${TARGET_SCALE_MIN}" max="${TARGET_SCALE_MAX}" step="0.05" data-setting="targetScale"></label>
        <p class="ga-note" data-out="effectiveScale"></p>
        <label class="ga-field"><span>${t('common.adult.intensity')}</span>
          <select data-setting="intensity">
            ${INTENSITIES.map((i) => option(i, this.kit.t(`common.adult.intensity.${i}`))).join('')}
          </select></label>
        <label class="ga-field"><span>${t('common.adult.choices')}</span>
          <select data-setting="choices">${CHOICES.map((c) => option(String(c), String(c))).join('')}</select></label>
        <label class="ga-field"><span>${t('common.adult.matchMinutes')}</span>
          <select data-setting="matchMinutes">${MATCH_MINUTES.map((m) => option(String(m), String(m))).join('')}</select></label>
        ${volumes}
        <label class="ga-field ga-field--check"><input type="checkbox" data-setting="simulator">
          <span>${t('common.adult.simulator')}</span></label>
        <div class="ga-adult__actions">
          <button type="button" data-action="fullscreen">${t('common.adult.fullscreen')}</button>
          <button type="button" data-action="close">${t('common.adult.close')}</button>
        </div>
        <p class="ga-note">${t('common.adult.hint')}</p>
      </form>`;
    this.bind();
    this.syncValues();
  }

  private bind(): void {
    const s = this.kit.settings;
    const q = <T extends Element>(sel: string) => this.root.querySelector<T>(sel);
    q<HTMLSelectElement>('[data-setting="locale"]')?.addEventListener('change', (e) => {
      const v = (e.target as HTMLSelectElement).value;
      s.update({ locale: isLocale(v) ? v : null });
    });
    q<HTMLInputElement>('[data-setting="targetScale"]')?.addEventListener('input', (e) => {
      s.update({ targetScale: Number((e.target as HTMLInputElement).value) });
    });
    q<HTMLSelectElement>('[data-setting="intensity"]')?.addEventListener('change', (e) => {
      s.update({ intensity: (e.target as HTMLSelectElement).value as Intensity });
    });
    q<HTMLSelectElement>('[data-setting="choices"]')?.addEventListener('change', (e) => {
      s.update({ choices: Number((e.target as HTMLSelectElement).value) as Choices });
    });
    q<HTMLSelectElement>('[data-setting="matchMinutes"]')?.addEventListener('change', (e) => {
      s.update({ matchMinutes: Number((e.target as HTMLSelectElement).value) as MatchMinutes });
    });
    q<HTMLInputElement>('[data-setting="simulator"]')?.addEventListener('change', (e) => {
      s.update({ simulator: (e.target as HTMLInputElement).checked });
    });
    for (const input of this.root.querySelectorAll<HTMLInputElement>('[data-volume]')) {
      input.addEventListener('input', () => {
        s.update({ volumes: { [input.dataset.volume as string]: Number(input.value) } });
      });
    }
    q<HTMLButtonElement>('[data-action="close"]')?.addEventListener('click', () => this.close());
    q<HTMLButtonElement>('[data-action="fullscreen"]')?.addEventListener('click', () => void enterFullscreen());
  }

  private syncValues(): void {
    const v = this.kit.settings.value;
    const q = <T extends Element>(sel: string) => this.root.querySelector<T>(sel);
    const set = (sel: string, value: string) => {
      const el = q<HTMLInputElement | HTMLSelectElement>(sel);
      if (el && el.value !== value) el.value = value;
    };
    set('[data-setting="locale"]', v.locale ?? 'auto');
    set('[data-setting="targetScale"]', String(v.targetScale));
    set('[data-setting="intensity"]', v.intensity);
    set('[data-setting="choices"]', String(v.choices));
    set('[data-setting="matchMinutes"]', String(v.matchMinutes));
    const sim = q<HTMLInputElement>('[data-setting="simulator"]');
    if (sim) sim.checked = v.simulator || this.kit.flags.sim;
    for (const input of this.root.querySelectorAll<HTMLInputElement>('[data-volume]')) {
      input.value = String(v.volumes[input.dataset.volume as keyof typeof v.volumes]);
    }
    const out = q<HTMLOutputElement>('[data-out="targetScale"]');
    if (out) out.value = v.targetScale.toFixed(2);
    const eff = q<HTMLElement>('[data-out="effectiveScale"]');
    const layout = this.kit.zones.layout;
    if (eff) {
      eff.hidden = !layout?.capped;
      if (layout) {
        const value = `${layout.effectiveScale.x.toFixed(2)} × ${layout.effectiveScale.y.toFixed(2)}`;
        eff.textContent = this.kit.t('common.adult.effectiveScale', { value });
      }
    }
    const fs = q<HTMLButtonElement>('[data-action="fullscreen"]');
    if (fs) fs.hidden = Boolean(document.fullscreenElement);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
