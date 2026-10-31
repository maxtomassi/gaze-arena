import '@gaze-arena/kit/style.css';
import { Footballer, addSvgTexture, ballSvg, bootGame } from '@gaze-arena/kit';
import en from './i18n/en.json';
import it from './i18n/it.json';
import { GoalPartyScene } from './scenes/GoalPartyScene';
import { BALL_TEXTURE, PLAYER_LOOK, SCENE_KEY } from './config';
import { gameSounds } from './sounds';

void bootGame({
  id: 'goal-party',
  titleKey: 'goalParty.title',
  strings: { en, it },
  sounds: gameSounds(),
  scenes: [GoalPartyScene],
  firstScene: SCENE_KEY,
  prepare: async (scene) => {
    await Promise.all([Footballer.prepare(scene, PLAYER_LOOK), addSvgTexture(scene.textures, BALL_TEXTURE, ballSvg(120))]);
  },
});
