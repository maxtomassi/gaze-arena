// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const BANNED_DOM_EVENTS = '/^(dblclick|contextmenu|wheel|drag|dragstart|drop)$/';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/dev-dist/**', '**/node_modules/**', '**/playwright-report/**', '**/test-results/**', 'templates/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Golden rules, everywhere: only GazeButton may make things interactive; no double click,
  // right click, wheel or drag handlers.
  {
    files: ['**/*.ts'],
    ignores: ['packages/kit/src/ui/GazeButton.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='setInteractive']",
          message: 'Every clickable element must be a GazeButton from @gaze-arena/kit.',
        },
        {
          selector: "CallExpression[callee.property.name='setDraggable']",
          message: 'Drag is not allowed: single left click only.',
        },
        {
          selector: `CallExpression[callee.property.name=/^(addEventListener|on|once)$/] > Literal.arguments:first-child[value=${BANNED_DOM_EVENTS}]`,
          message: 'Only single left clicks are allowed (no dblclick, contextmenu, wheel or drag handlers).',
        },
      ],
    },
  },
  // Games: no direct pointer handling (clicks go through GazeButton), and imports only from
  // their own folder or @gaze-arena/kit's public entry points.
  {
    files: ['games/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='setInteractive']",
          message: 'Every clickable element must be a GazeButton from @gaze-arena/kit.',
        },
        {
          selector: "CallExpression[callee.property.name='setDraggable']",
          message: 'Drag is not allowed: single left click only.',
        },
        {
          selector: "CallExpression[callee.object.property.name='input'][callee.property.name=/^(on|once|addListener)$/]",
          message: 'Games must not listen to pointer input directly: use GazeButton (or kit helpers).',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/packages/**', '**/games/**'], message: 'A game may import only from @gaze-arena/kit and its own folder.' },
            { group: ['@gaze-arena/kit/src/*', '@gaze-arena/kit/vite/*'], message: 'Use the public entry points of @gaze-arena/kit.' },
            { group: ['@gaze-arena/*', '!@gaze-arena/kit'], message: 'Never import from another game.' },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/kit/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['**/games/**', '@gaze-arena/game-*'], message: 'The kit never imports from games.' }] }],
    },
  },
);
