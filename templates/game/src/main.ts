import '@gaze-arena/kit/style.css';
import { bootGame } from '@gaze-arena/kit';
import en from './i18n/en.json';
import it from './i18n/it.json';
import { GAME_SCENE_KEY, GameScene } from './scenes/GameScene';

void bootGame({
  id: '__GAME_ID__',
  titleKey: '__GAME_KEY__.title',
  strings: { en, it },
  scenes: [GameScene],
  firstScene: GAME_SCENE_KEY,
});
