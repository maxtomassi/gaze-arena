import { defineConfig } from 'vite';
import { defineGameConfig } from '@gaze-arena/kit/vite';

export default defineConfig(
  defineGameConfig({
    root: import.meta.dirname,
    id: 'goal-party',
    name: 'Goal Party!',
  }),
);
