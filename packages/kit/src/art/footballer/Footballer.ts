import Phaser from 'phaser';
import { FONT_TITLE, OUTLINE } from '../palette';
import { addSvgTexture, SVG_RESOLUTION, type SvgPart } from '../svg';
import { DEFAULT_LOOK, footballerParts, lookKey, type FootballerLook, type PartName } from './parts';

/** Pose of the rig. Angles in degrees. Every field is tweenable. */
export interface Pose {
  /** Offset of the whole character from its home position (logical px, before scale). */
  x: number;
  y: number;
  /** Offset of the body inside the character (crouch, jump). */
  bodyY: number;
  /** Rotation of the whole body around its center (somersault, lean). */
  bodyAngle: number;
  /** Arm raise: 0 = down, 90 = straight out, 180 = straight up. L/R are screen sides. */
  armL: number;
  armR: number;
  /** Leg swing: positive = outward on that side. */
  legL: number;
  legR: number;
  /** Head tilt. */
  head: number;
  /** Shirt over the head: 0 = off, 1 = on. */
  hood: number;
  /** 1 = facing the viewer normally, -1 = mirrored. Tween through 0 for a turn. */
  face: number;
}

export const REST_POSE: Readonly<Pose> = Object.freeze({
  x: 0,
  y: 0,
  bodyY: 0,
  bodyAngle: 0,
  armL: 12,
  armR: 12,
  legL: 4,
  legR: 4,
  head: 0,
  hood: 0,
  face: 1,
});

export type PoseStep = [pose: Partial<Pose>, durationMs: number, ease?: string];

/** Rig geometry, in rig pixels (scale 1). The origin is the body center. */
const RIG = {
  shoulderX: 108,
  shoulderY: -78,
  hipX: 50,
  hipY: 160,
  neckY: -96,
  shortsY: 130,
  ankleY: 146,
  /** Distance from the origin to the soles. */
  footY: 352,
  /** Distance from the origin to the top of the hair. */
  topY: 300,
};

/** Total rig height at scale 1. */
export const FOOTBALLER_HEIGHT = RIG.footY + RIG.topY;
/** Widest reach at scale 1 (arms straight out). */
export const FOOTBALLER_SPAN = 2 * (RIG.shoulderX + 190);

function texKey(look: FootballerLook, part: PartName): string {
  return `ga-footballer-${lookKey(look)}-${part}`;
}

/**
 * Big-head cartoon footballer built from separate SVG parts (head, hair, torso with number, arms,
 * legs, boots) so celebrations are just tweens on the parts. Shirt color, number etc. are parameters.
 *
 * Call `Footballer.prepare(scene, look)` once (async) before constructing one.
 */
export class Footballer extends Phaser.GameObjects.Container {
  readonly pose: Pose = { ...REST_POSE };
  private readonly rig: Phaser.GameObjects.Container;
  private readonly headGroup: Phaser.GameObjects.Container;
  private readonly hair: Phaser.GameObjects.Image;
  private readonly hood: Phaser.GameObjects.Image;
  private readonly armL: Phaser.GameObjects.Container;
  private readonly armR: Phaser.GameObjects.Container;
  private readonly legL: Phaser.GameObjects.Container;
  private readonly legR: Phaser.GameObjects.Container;
  private readonly numberText: Phaser.GameObjects.Text;
  private homeX: number;
  private homeY: number;
  private baseScale: number;
  private breath = { v: 0 };
  private breathTween: Phaser.Tweens.Tween | null = null;

  static async prepare(scene: Phaser.Scene, look: FootballerLook = DEFAULT_LOOK): Promise<void> {
    const parts = footballerParts(look);
    await Promise.all(
      (Object.entries(parts) as [PartName, SvgPart][]).map(([name, part]) => addSvgTexture(scene.textures, texKey(look, name), part)),
    );
  }

  /** `x, y` = position of the soles' center (ground point); `scale` = rig scale. */
  constructor(scene: Phaser.Scene, x: number, y: number, scale = 1, look: FootballerLook = DEFAULT_LOOK) {
    super(scene, x, y);
    this.homeX = x;
    this.homeY = y;
    this.baseScale = scale;
    const parts = footballerParts(look);
    const img = (part: PartName, px = 0, py = 0, flip = false) => {
      const p = parts[part];
      const image = scene.add.image(px, py, texKey(look, part));
      image.setOrigin(p.pivotX / p.width, p.pivotY / p.height);
      image.setScale(1 / SVG_RESOLUTION);
      image.setFlipX(flip);
      if (flip) image.setOrigin(1 - p.pivotX / p.width, p.pivotY / p.height);
      return image;
    };

    const makeLeg = (side: -1 | 1) => {
      const c = scene.add.container(side * RIG.hipX, RIG.hipY);
      c.add([img('leg'), img('boot', 0, RIG.ankleY, side < 0)]);
      return c;
    };
    const makeArm = (side: -1 | 1) => {
      const c = scene.add.container(side * RIG.shoulderX, RIG.shoulderY);
      c.add(img('arm'));
      return c;
    };

    this.legL = makeLeg(-1);
    this.legR = makeLeg(1);
    this.armL = makeArm(-1);
    this.armR = makeArm(1);
    const torso = scene.add.container(0, 0);
    this.numberText = scene.add
      .text(0, 16, String(look.number), {
        fontFamily: FONT_TITLE,
            padding: { x: 16, y: 8 },
        fontSize: '120px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: OUTLINE,
      })
      .setOrigin(0.5);
    torso.add([img('torso'), this.numberText]);
    this.hair = img('hair');
    this.hood = img('hood').setAlpha(0);
    this.headGroup = scene.add.container(0, RIG.neckY);
    this.headGroup.add([img('head'), this.hair, this.hood]);

    this.rig = scene.add.container(0, -RIG.footY);
    this.rig.add([this.legL, this.legR, img('shorts', 0, RIG.shortsY), torso, this.armL, this.armR, this.headGroup]);
    this.add(this.rig);
    scene.add.existing(this);
    this.apply();
  }

  /** Moves the home (ground) point and rig scale, keeping the current pose. */
  setHome(x: number, y: number, scale: number): this {
    this.homeX = x;
    this.homeY = y;
    this.baseScale = scale;
    this.apply();
    return this;
  }

  get rigScale(): number {
    return this.baseScale;
  }

  /** Tweens to a (partial) pose. Resolves when done. */
  to(pose: Partial<Pose>, durationMs: number, ease = 'Sine.easeInOut'): Promise<void> {
    return new Promise((resolve) => {
      if (durationMs <= 0) {
        Object.assign(this.pose, pose);
        this.apply();
        resolve();
        return;
      }
      this.scene.tweens.add({
        targets: this.pose,
        ...pose,
        duration: durationMs,
        ease,
        onUpdate: () => this.apply(),
        onComplete: () => {
          this.apply();
          resolve();
        },
      });
    });
  }

  /** Sets pose fields immediately (for procedural motion driven by a counter tween). */
  setPose(pose: Partial<Pose>): this {
    Object.assign(this.pose, pose);
    this.apply();
    return this;
  }

  /** Plays pose steps one after another. */
  async sequence(steps: PoseStep[]): Promise<void> {
    for (const [pose, ms, ease] of steps) await this.to(pose, ms, ease);
  }

  /** Back to the rest pose. */
  rest(durationMs = 300): Promise<void> {
    return this.to({ ...REST_POSE }, durationMs);
  }

  /** Stops every pose tween (e.g. before a new celebration). */
  stopPoses(): void {
    this.scene.tweens.killTweensOf(this.pose);
  }

  /** Gentle idle breathing (decoration only). */
  setIdle(on: boolean): void {
    this.breathTween?.stop();
    this.breathTween = null;
    this.breath.v = 0;
    if (on) {
      this.breathTween = this.scene.tweens.add({
        targets: this.breath,
        v: 8,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => this.apply(),
      });
    }
    this.apply();
  }

  private apply(): void {
    const p = this.pose;
    const s = this.baseScale;
    this.setPosition(this.homeX + p.x * s, this.homeY + p.y * s);
    const face = Math.abs(p.face) < 0.05 ? 0.05 * Math.sign(p.face || 1) : p.face;
    this.setScale(s * face, s);
    this.rig.y = -RIG.footY + p.bodyY + this.breath.v;
    this.rig.angle = p.bodyAngle;
    this.armL.angle = p.armL;
    this.armR.angle = -p.armR;
    this.legL.angle = p.legL;
    this.legR.angle = -p.legR;
    this.headGroup.angle = p.head;
    this.hood.setAlpha(Phaser.Math.Clamp(p.hood, 0, 1));
    this.hair.setVisible(p.hood < 0.5);
    this.numberText.setScale(face < 0 ? -1 : 1, 1);
  }
}
