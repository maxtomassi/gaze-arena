import Phaser from 'phaser';
import { getKit } from '../core/Kit';
import type { Params } from './I18n';

export interface BoundText {
  setParams(params: Params): void;
  setKey(key: string, params?: Params): void;
}

/** Keeps a Text object translated: updates it when the locale changes, until it is destroyed. */
export function bindText(text: Phaser.GameObjects.Text, key: string, params?: Params, onUpdate?: () => void): BoundText {
  const kit = getKit(text.scene);
  let k = key;
  let p = params;
  const apply = () => {
    text.setText(kit.t(k, p));
    onUpdate?.();
  };
  apply();
  const off = kit.i18n.onChange(apply);
  text.once(Phaser.GameObjects.Events.DESTROY, off);
  return {
    setParams(next) {
      p = next;
      apply();
    },
    setKey(nextKey, next) {
      k = nextKey;
      p = next ?? p;
      apply();
    },
  };
}
