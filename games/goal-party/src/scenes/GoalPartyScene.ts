import Phaser from 'phaser';
import {
  FONT_BODY,
  FONT_TITLE,
  FOOTBALLER_HEIGHT,
  FOOTBALLER_SPAN,
  Footballer,
  GazeButton,
  LOGICAL_WIDTH,
  OUTLINE,
  PALETTE,
  bindText,
  getKit,
  hasPublicAsset,
  startInvitations,
  wait,
  type BoundText,
  type Kit,
  type Rect,
} from '@gaze-arena/kit';
import { drawBackground } from '../background';
import { CHOREOGRAPHIES } from '../celebrations';
import {
  BACKGROUND_FILE,
  BACKGROUND_TEXTURE,
  BALL_TEXTURE,
  CELEBRATIONS,
  CELEBRATION_COLOR,
  CELEBRATION_LABEL,
  PLAYER_LOOK,
  SCENE_KEY,
  inkFor,
  type CelebrationId,
} from '../config';
import { baseCelebrationEffects, UNLOCKED_EFFECTS } from '../effects';
import { ICONS } from '../icons';
import { levelLayout, type LevelLayout } from '../layout';
import { Progression, type EffectId } from '../progression';

export interface GoalPartyState {
  level: 1 | 2 | 3;
  count: number;
  next: number | null;
  unlocked: EffectId[];
  celebrating: CelebrationId | null;
  background: 'image' | 'fallback';
  buttons: string[];
  counterText: string;
  playerVisible: boolean;
}

/** The footballer stands in the rest area; each button starts a celebration. */
export class GoalPartyScene extends Phaser.Scene {
  private kit!: Kit;
  private progression = new Progression();
  private buttons: GazeButton[] = [];
  private layout!: LevelLayout;
  private player!: Footballer;
  private ball!: Phaser.GameObjects.Image;
  private counter!: BoundText;
  private counterText!: Phaser.GameObjects.Text;
  private celebrating: CelebrationId | null = null;
  private scoreCycle = 0;
  private background: 'image' | 'fallback' = 'fallback';

  constructor() {
    super(SCENE_KEY);
  }

  preload(): void {
    // The generated background is optional: only load it if it was shipped, and fall back on error.
    if (hasPublicAsset(BACKGROUND_FILE)) {
      this.load.image(BACKGROUND_TEXTURE, BACKGROUND_FILE);
      this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => undefined);
    }
  }

  create(): void {
    this.kit = getKit(this);
    this.progression = new Progression();
    this.celebrating = null;
    this.background = drawBackground(this);

    const title = this.add
      .text(LOGICAL_WIDTH / 2 - 40, 54, '', {
        fontFamily: FONT_TITLE,
            padding: { x: 16, y: 8 },
        fontSize: '76px',
        color: '#FFD60A',
        stroke: '#000000',
        strokeThickness: OUTLINE,
      })
      .setOrigin(1, 0.5);
    bindText(title, 'goalParty.title');
    const counterText = this.add
      .text(LOGICAL_WIDTH / 2, 56, '', { fontFamily: FONT_BODY, fontSize: '40px', color: '#FFFFFF' })
      .setOrigin(0, 0.5);
    this.counter = bindText(counterText, 'goalParty.counter', { count: 0, next: 5 });
    this.counterText = counterText;

    this.player = new Footballer(this, 960, 830, 0.75, PLAYER_LOOK);
    this.player.setIdle(true);
    this.ball = this.add.image(0, 0, BALL_TEXTURE).setScale(0.5).setVisible(false).setDepth(5);

    this.applyLayout();
    this.updateCounter();

    const offSettings = this.kit.settings.onChange((next, prev) => {
      if (next.choices !== prev.choices || next.targetScale !== prev.targetScale) this.applyLayout();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offSettings();
      this.kit.stateProvider = null;
    });

    startInvitations(this, () => this.invite());
    this.kit.stateProvider = () => this.state();
  }

  state(): GoalPartyState {
    return {
      level: this.layout.choices === 1 ? 1 : this.layout.choices === 2 ? 2 : 3,
      count: this.progression.count,
      next: this.progression.next,
      unlocked: this.progression.unlocked,
      celebrating: this.celebrating,
      background: this.background,
      buttons: this.buttons.map((b) => b.id),
      counterText: this.counterText.text,
      playerVisible: this.player.visible,
    };
  }

  /** (Re)builds the buttons for the current "number of choices" and target size. */
  private applyLayout(): void {
    const s = this.kit.settings.value;
    this.layout = levelLayout(s.choices, s.targetScale);
    for (const b of this.buttons) b.destroy();
    this.buttons = this.layout.buttons.map((id, i) => {
      const slot = this.layout.slots[i];
      if (!slot) throw new Error(`no slot for ${id}`);
      const color = id === 'score' ? PALETTE.magenta : CELEBRATION_COLOR[id];
      return new GazeButton(this, {
        id,
        graphic: slot.graphic,
        color,
        labelKey: id === 'score' ? 'goalParty.score' : CELEBRATION_LABEL[id],
        icon: ICONS[id],
        iconColor: inkFor(color),
        maxFontSize: id === 'score' ? 150 : undefined,
        onActivate: () => (id === 'score' ? this.scoreAndCelebrate() : this.celebrate(id)),
      }).setDepth(20);
    });
    this.kit.zones.setLayout(this.layout);
    this.placePlayer(this.layout.choices === 1 ? this.levelOneStage() : this.layout.restArea);
    // At level 1 the footballer waits off stage while the SCORE! button fills the center.
    if (this.layout.choices === 1 && !this.celebrating) this.player.setVisible(false);
    else this.player.setVisible(true);
  }

  /** Celebration stage at level 1: the center of the play band. */
  private levelOneStage(): Rect {
    return { x: 380, y: 200, width: 1160, height: 640 };
  }

  private placePlayer(area: Rect): void {
    const scale = Math.min(1, (area.height * 0.85) / FOOTBALLER_HEIGHT, (area.width * 0.95) / FOOTBALLER_SPAN);
    this.player.setHome(area.x + area.width / 2, area.y + area.height - 8, scale);
  }

  /** Sideways room for choreographies, in rig units. */
  private moveRange(): number {
    const area = this.layout.choices === 1 ? this.levelOneStage() : this.layout.restArea;
    const s = this.player.rigScale;
    return Math.max(0, (area.width / 2 - (FOOTBALLER_SPAN * s) / 2) / s);
  }

  /** Level 1: the SCORE! button steps aside, then a celebration (cycling through all four). */
  private async scoreAndCelebrate(): Promise<void> {
    const button = this.buttons[0];
    const id = CELEBRATIONS[this.scoreCycle % CELEBRATIONS.length] as CelebrationId;
    this.scoreCycle++;
    if (button) {
      button.setEnabled(false);
      await new Promise<void>((resolve) =>
        this.tweens.add({ targets: button, alpha: 0, duration: 250, onComplete: () => resolve() }),
      );
      button.setVisible(false);
    }
    this.player.setVisible(true).setAlpha(1);
    await this.celebrate(id);
    if (button?.scene) {
      this.player.setVisible(false);
      button.setVisible(true).setAlpha(0);
      await new Promise<void>((resolve) =>
        this.tweens.add({ targets: button, alpha: 1, duration: 250, onComplete: () => resolve() }),
      );
      button.setEnabled(true);
    }
  }

  private async celebrate(id: CelebrationId): Promise<void> {
    const kit = this.kit;
    this.celebrating = id;
    this.ball.setVisible(false);
    this.tweens.killTweensOf(this.ball);
    this.player.stopPoses();
    this.player.setIdle(false);
    await this.player.rest(0);
    const effects = this.progression.unlocked;
    kit.telemetry.record('celebration-start', { id, effects });

    baseCelebrationEffects(this, kit.t('goalParty.chant'));
    const extra = effects.map((e) => UNLOCKED_EFFECTS[e](this));
    await Promise.all([CHOREOGRAPHIES[id](this, this.player, this.moveRange()), ...extra]);

    const unlocked = this.progression.record();
    this.updateCounter();
    kit.telemetry.record('celebration-end', { id, count: this.progression.count });
    if (unlocked) await this.showUnlock(unlocked);
    this.celebrating = null;
    this.player.setIdle(true);
  }

  private updateCounter(): void {
    const next = this.progression.next;
    if (next === null) this.counter.setKey('goalParty.counterDone', { count: this.progression.count });
    else this.counter.setKey('goalParty.counter', { count: this.progression.count, next });
  }

  /** Passive 3 s show for a newly unlocked effect, with the "NEW EFFECT!" banner. */
  private async showUnlock(effect: EffectId): Promise<void> {
    const kit = this.kit;
    kit.telemetry.record('unlock', { effect });
    kit.audio.play('fanfare');
    const banner = this.add.container(LOGICAL_WIDTH / 2, 300).setDepth(70).setScale(0);
    const text = this.add
      .text(0, 0, '', {
        fontFamily: FONT_TITLE,
            padding: { x: 16, y: 8 },
        fontSize: '130px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: OUTLINE * 2,
      })
      .setOrigin(0.5);
    bindText(text, 'common.newEffect');
    const bg = this.add.graphics();
    const w = Math.max(760, text.width + 120);
    bg.fillStyle(PALETTE.magenta, 1).fillRoundedRect(-w / 2, -95, w, 190, 40);
    bg.lineStyle(OUTLINE * 2, PALETTE.black, 1).strokeRoundedRect(-w / 2, -95, w, 190, 40);
    banner.add([bg, text]);
    this.tweens.add({ targets: banner, scale: 1, duration: 400, ease: 'Back.easeOut' });
    this.tweens.add({ targets: banner, angle: { from: -3, to: 3 }, duration: 500, yoyo: true, repeat: 2 });
    this.player.sequence([
      [{ armL: 170, armR: 170 }, 300, 'Back.easeOut'],
      [{ y: -50 }, 250, 'Quad.easeOut'],
      [{ y: 0 }, 250, 'Quad.easeIn'],
    ]);
    await wait(this, 500);
    await UNLOCKED_EFFECTS[effect](this);
    await wait(this, 1500);
    await new Promise<void>((resolve) =>
      this.tweens.add({ targets: banner, scale: 0, alpha: 0, duration: 300, onComplete: () => resolve() }),
    );
    banner.destroy();
    await this.player.rest(200);
  }

  /** Inactivity invitation: the crowd calls and a ball bounces next to the player. Decoration only. */
  private invite(): void {
    if (this.celebrating) return;
    this.kit.audio.play('crowd-roar', { volume: 0.35 });
    const area = this.layout.choices === 1 ? this.levelOneStage() : this.layout.restArea;
    const groundY = area.y + area.height - 30;
    // Level 1: bounce beside the SCORE! button, in the free strip on the left.
    const x = this.player.visible ? this.player.x + 170 * this.player.rigScale : 180;
    this.ball.setPosition(x, groundY - 260).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.ball);
    this.tweens.chain({
      targets: this.ball,
      tweens: [
        { y: groundY, duration: 380, ease: 'Quad.easeIn' },
        { y: groundY - 160, duration: 320, ease: 'Quad.easeOut', yoyo: true },
        { y: groundY - 80, duration: 240, ease: 'Quad.easeOut', yoyo: true },
        { y: groundY - 30, duration: 160, ease: 'Quad.easeOut', yoyo: true },
        { alpha: 0, duration: 600, delay: 900 },
      ],
      onComplete: () => this.ball.setVisible(false),
    });
    if (this.player.visible) {
      void this.player.sequence([
        [{ armR: 165, head: 10 }, 260, 'Back.easeOut'],
        [{ armR: 130 }, 200],
        [{ armR: 165 }, 200],
        [{ armR: 12, head: 0 }, 300],
      ]);
    }
  }
}
