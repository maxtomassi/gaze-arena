# __GAME_TITLE__

Code id: `__GAME_ID__`. Folder: `games/__GAME_ID__/`.

## Purpose
TODO

## Mechanics
TODO

## Layout (1920×1080 logical coordinates)
TODO — remember the dead zones (y < 108, y > 990), the rest area and hitboxes ≥ 340×340.

## Strings
Game keys are prefixed with `__GAME_KEY__.` and live in `src/i18n/<locale>.json`.

## Acceptance criteria
- [ ] Every button is a `GazeButton`; nothing else is interactive.
- [ ] i18n test: every key in `en` exists in `it` and vice versa.
- [ ] `npm run build -w games/__GAME_ID__` produces a self-contained `dist/` that works from a subpath.
