# Design principles for dwell-click games

## The player
- Children (initially a 10-year-old) who access the computer with eye gaze and a device-managed dwell-click
  (typically 1–2 s of fixation per click).
- Every selection costs effort: few choices, big targets, no hurry.
- They like football, wrestling, crowds, explosions, high-energy action.

## Layout (1920×1080 logical canvas)
- Top dead zone: y 0–108 (score/info only). Bottom dead zone: y 990–1080 (decoration only).
- Rest area: the central zone where the show happens; never clickable.
- Targets on the sides or in a dedicated band, taller than wide when possible.
- Spacing between targets ≥ 60 logical px.
- Number of choices progresses 1 → 2 → 4.

## Target states
1. Idle: 8 px white border.
2. Hovered (pointerover): yellow glow, scale 1.05, one soft "tick" sound. No action.
3. Activated (valid pointerup): flash, scale 1.2 → 0.9 → 1, loud sound, particles.
4. Locked (during animations): opacity 0.6, no hover reaction.

## Preventing unintended clicks
- The device may keep clicking while gaze stays still (Repeat Click mode):
  a button re-arms only after the pointer has left it and come back.
- Global `InputGate`: locked for the whole animation + 500 ms.
- 400 ms debounce at the same spot.
- Disable `dblclick`, `contextmenu`, drag and text selection.

## Inactivity
- After 30 s without clicks: an invitation animation only (crowd calling, ball bouncing). Never a penalty.

## Sessions
- Matches of 3–5 minutes; total session 10–15 minutes at first.
- After each match a passive reward screen of 8–10 s (a rest for the eyes).

## Sensory safety
- Full-screen flashes ≤ 3 per second.
- `settings.intensity`: "calm" (no shake, fewer flashes, quiet crowd), "normal", "max".

## Localization
- Supported locales: English (`en`) and Italian (`it`); designed so more can be added by contributors.
- Default locale: the one saved in settings, else `navigator.language` if supported, else `en`.
- Language is switched from the adult panel (P), never by the child's gaze.
- Text inside buttons must fit the longest translation: design for ~30% longer strings and test both locales.
- Prefer icons and images over text in buttons; text is a secondary label.
- Voice lines and chants are recorded per locale; if a locale lacks a clip, fall back to `en`, then to a generic sound.
- Use culturally neutral content: invented teams, players and wrestlers.

## Palette "Arena Night"
night blue #0B1A3A · arena blue #16306B · yellow #FFD60A · magenta #FF2E88 · cyan #00E5FF · green #1FAA59 · red #E63946 · white #FFFFFF.
Art style: thick black outlines, flat saturated fills, big-head cartoon characters, high contrast against dark backgrounds.
Characters and UI are drawn in code so they animate and stay consistent; generated images are only for static backgrounds and illustrations.
Fonts: Bangers for titles and buttons, Inter for the rest (both open-source, Google Fonts; bundle them locally).

## Adult settings (P key)
language · targetScale · intensity · volume per category (ui, effects, crowd, voice) · number of choices · match length · simulator mode.
Settings are stored in `localStorage`.
