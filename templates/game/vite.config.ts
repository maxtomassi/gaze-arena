import { defineConfig } from 'vite';
import { defineGameConfig } from '@gaze-arena/kit/vite';

export default defineConfig(
  defineGameConfig({
    root: import.meta.dirname,
    id: '__GAME_ID__',
    name: '__GAME_TITLE__',
  }),
);
