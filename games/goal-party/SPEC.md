# Game 0 — Goal Party

Code id: `goal-party`. Folder: `games/goal-party/`. Display names: en "Goal Party!", it "Festa Gol!".
Deployed on its own as a static site (`npm run build -w games/goal-party` → `games/goal-party/dist/`).

## Purpose
The first cause-and-effect game. It has two jobs: give the child instant fun, and
validate target size, dwell timing and audio on the real device before building other games.

## Mechanics
- A footballer stands in the center (rest area). Four celebration buttons sit on the sides.
- Each click starts a different celebration (about 3 s):
  1. `knee-slide` — knee slide
  2. `somersault` — somersault
  3. `airplane` — arms out, running in a circle
  4. `shirt-over-head` — shirt pulled over the head
- During each celebration: crowd roar, "GOAL!" chant (localized), confetti, light camera shake.
- No score, no losing.

## Progression
- Celebration counter in the top dead zone (e.g. en "celebrations: 3 / 5", it "feste: 3 / 5").
- Every 5 celebrations unlock an extra effect, added to all later celebrations:
  fireworks → golden confetti cannon → stadium horns.
- Each unlock has a short passive animation (3 s) with a "NEW EFFECT!" banner.

## Levels (adult setting "number of choices")
- Level 1: a single giant "SCORE!" button (1000×700, centered in the play band).
  At this level the whole screen acts as the rest area during the celebration.
- Level 2: two buttons (left and right), 340×420.
- Level 3: four buttons (wireframe default).

## Layout (level 3, 1920×1080 logical coordinates)
Layout reference: `wireframe.png` in this folder. If it disagrees with this spec, the spec wins
(the wireframe uses early Italian labels; texts and coordinates here are authoritative).

- Buttons 340×420, 8 px white border, 32 px radius; icon on top, localized label below:
  - knee-slide: x 120, y 150 (magenta)
  - somersault: x 120, y 570 (cyan)
  - airplane: x 1460, y 150 (magenta)
  - shirt-over-head: x 1460, y 570 (cyan)
- Rest area: x 580, y 240, 760×600 — footballer in the center.
- Background: night stadium, stands #16306B, pitch #1FAA59 from y 438.

## Art
- The footballer is an SVG character from the kit (`packages/kit/src/art/`), built from separate parts
  (head, hair, torso with shirt number, arms, legs, boots) so each celebration is a set of tweens on the parts.
  Shirt color and number are parameters. If the kit has no character yet, create it there, not in the game.
- Buttons: kit `GazeButton` with an SVG icon per celebration, drawn in code.
- Confetti, fireworks and shake: Phaser particles and camera effects, no images.
- Generated images (background only for now) are declared in `games/goal-party/assets.yaml`:

```yaml
style: arena-night          # shared style from tools/asset-gen/styles/arena-night/
assets:
  - id: stadium-night
    out: public/assets/img/stadium-night.webp
    size: [1920, 1080]
    transparent: false
    prompt: >
      Wide view of a football stadium at night from pitch level, stands full of
      cartoon fans, four floodlights, pitch in the lower 60% of the image,
      empty central area, no players, no text, no logos.
```

- Until `npm run assets` has been run, the scene falls back to a flat-color background drawn in code,
  so the game builds and runs without any generated file.

## Strings (initial keys)
Common keys come from the kit (`packages/kit/src/i18n/`), game keys from `games/goal-party/src/i18n/`.

| key | where | en | it |
|---|---|---|---|
| `common.play` | kit | PLAY! | GIOCA! |
| `common.newEffect` | kit | NEW EFFECT! | NUOVO EFFETTO! |
| `goalParty.title` | game | Goal Party! | Festa Gol! |
| `goalParty.counter` | game | celebrations: {count} / {next} | feste: {count} / {next} |
| `goalParty.score` | game | SCORE! | SEGNA! |
| `goalParty.kneeSlide` | game | Knee slide | Scivolata |
| `goalParty.somersault` | game | Somersault | Capriola |
| `goalParty.airplane` | game | Airplane | Aeroplano |
| `goalParty.shirtOverHead` | game | Shirt over head | Maglia su |
| `goalParty.chant` | game | GOOOAL! | GOOOL! |

## Audio (placeholders until real assets exist)
- Kit (shared): tick, whoosh, crowd roar, fireworks. Game: goal chant in `public/assets/audio/<locale>/`, fallback to `en`.
- Generate simple placeholder sounds with Web Audio or use CC0 files, each listed in `ASSETS.md`.
- Audio is unlocked by the first click on the "PLAY!" screen, which also enters fullscreen and requests a Wake Lock.

## Acceptance criteria
- [ ] Every button is a `GazeButton`; nothing else is interactive.
- [ ] Clicks in the rest area or dead zones: no reaction.
- [ ] 10 clicks in a row on the same button without leaving it: exactly one celebration.
- [ ] During a celebration clicks on other buttons are ignored; buttons look locked.
- [ ] After the celebration, leaving and re-entering a button re-arms it.
- [ ] 5 minutes without clicks: no state change, only an invitation animation every 30 s.
- [ ] Intensity "calm": no shake, fewer confetti, quiet crowd.
- [ ] targetScale 0.8 and 1.5: buttons stay within y 108–990 and never overlap the rest area.
- [ ] All labels fit their buttons in both `en` and `it`; switching locale in the adult panel updates the scene.
- [ ] i18n test: every key in `en` exists in `it` and vice versa.
- [ ] `?sim=1` mode: pointer jitter ±25 px, repeat-click every 1100 ms toggled by a key, hitbox/zone overlay.
- [ ] The game runs with the fallback background when `stadium-night.webp` is missing.
- [ ] Playwright e2e tests (in `games/goal-party/tests/`) cover the points above.
- [ ] `npm run build -w games/goal-party` produces a self-contained `dist/` that works when served from a subpath
      (e.g. `/goal-party/`) with no network requests to other origins.
- [ ] The game imports nothing outside its folder except `@gaze-arena/kit`.

## Out of scope for now
Running the asset generator, saved progress, other games.

## Implementation decisions (approved 2026-10-31)
These resolve conflicts between the coordinates above and the golden rules; the layout is computed by
the kit's layout solver (`sideColumnsLayout` / `centeredLayout`), not hard-coded.
- Level 3 buttons are 340×348 at targetScale 1 (not 340×420): two hitboxes (graphic + 18%) plus the
  60 px gap must fit inside y 108–990. Column x positions (120 / 1460) and the rest area are unchanged.
- Above about targetScale 1.0, level 3 buttons stop growing taller but keep growing wider; the rest area
  shrinks with them, never below 520 px wide. Level 1 is capped the same way. The adult panel shows the
  size actually applied when it differs from the setting.
- Level 2 uses knee-slide (left) and airplane (right). Level 1's SCORE! cycles through the four celebrations;
  the button steps aside while one plays and the footballer appears in the center.
- After the third unlock (15 celebrations) the counter shows `goalParty.counterDone` ("celebrations: {count}").
- Goal Party has no match structure: the adult "match length" setting is not used by this game.
- P opens the adult panel; Esc opens it only outside fullscreen (browsers reserve Esc to leave fullscreen).
