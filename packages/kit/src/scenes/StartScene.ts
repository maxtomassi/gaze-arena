import Phaser from 'phaser';
import { FONT_TITLE, OUTLINE, PALETTE } from '../art/palette';
import { LOGICAL_WIDTH } from '../core/constants';
import { getKit } from '../core/Kit';
import { ensureKitTextures } from '../fx/effects';
import { bindText } from '../i18n/bindText';
import { GazeButton } from '../ui/GazeButton';
import { centeredLayout } from '../ui/layout';
import { enterFullscreen, ScreenWakeLock } from './WakeLock';

export const START_SCENE_KEY = 'ga-start';

const wakeLock = typeof document === 'undefined' ? null : new ScreenWakeLock();

/**
 * "PLAY!" screen. The first click unlocks audio, enters fullscreen and requests a Wake Lock,
 * then starts the game's first scene.
 */
export class StartScene extends Phaser.Scene {
  private prepared: Promise<void> = Promise.resolve();

  constructor() {
    super(START_SCENE_KEY);
  }

  create(): void {
    const kit = getKit(this);
    ensureKitTextures(this);
    const def = kit.definition;
    this.prepared = def.prepare ? def.prepare(this).catch((err) => console.error(err)) : Promise.resolve();

    this.cameras.main.setBackgroundColor(PALETTE.night);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.arena, 1).fillRect(0, 380, LOGICAL_WIDTH, 700);
    g.fillStyle(PALETTE.green, 1).fillRect(0, 760, LOGICAL_WIDTH, 320);
    for (let i = 0; i < 4; i++) {
      const x = 240 + i * 480;
      g.fillStyle(PALETTE.yellow, 0.18).fillTriangle(x, 60, x - 160, 760, x + 160, 760);
      g.fillStyle(PALETTE.white, 1).fillCircle(x, 60, 22);
    }

    const title = this.add
      .text(LOGICAL_WIDTH / 2, 200, '', {
        fontFamily: FONT_TITLE,
            padding: { x: 16, y: 8 },
        fontSize: '150px',
        color: '#FFD60A',
        stroke: '#000000',
        strokeThickness: OUTLINE * 2,
      })
      .setOrigin(0.5);
    bindText(title, def.titleKey);

    const layout = () => {
      const l = centeredLayout({ baseSize: { width: 640, height: 380 }, targetScale: kit.settings.value.targetScale });
      const slot = l.slots[0];
      if (!slot) throw new Error('layout');
      // Keep the button under the title: shift it down inside the play band if there is room.
      const dy = Math.min(90, 990 - (slot.hitbox.y + slot.hitbox.height));
      return { ...l, slots: [{ graphic: { ...slot.graphic, y: slot.graphic.y + dy }, hitbox: { ...slot.hitbox, y: slot.hitbox.y + dy } }] };
    };
    const first = layout();
    const firstSlot = first.slots[0] as (typeof first.slots)[number];
    const play = new GazeButton(this, {
      id: 'play',
      graphic: firstSlot.graphic,
      color: PALETTE.magenta,
      labelKey: 'common.play',
      maxFontSize: 170,
      onActivate: async () => {
        kit.audio.unlock();
        void enterFullscreen();
        void wakeLock?.request();
        kit.audio.play('crowd-roar', { volume: 0.6 });
        await this.prepared;
        this.scene.start(def.firstScene);
      },
    });
    kit.zones.setLayout(first, null);

    const off = kit.settings.onChange((next, prev) => {
      if (next.targetScale !== prev.targetScale) {
        const l = layout();
        play.layoutTo((l.slots[0] as (typeof l.slots)[number]).graphic);
        kit.zones.setLayout(l, null);
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }
}
