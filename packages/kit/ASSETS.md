# Kit assets

Every asset shipped by `@gaze-arena/kit` (bundled into each game's `dist/`), with its source and license.

## Fonts
| Font | Files | Source | Author | License |
|---|---|---|---|---|
| Bangers 400 | `@fontsource/bangers` (woff2/woff, bundled by Vite) | Google Fonts via Fontsource | Vernon Adams | SIL Open Font License 1.1 |
| Inter 400, 700 | `@fontsource/inter` (woff2/woff, bundled by Vite) | Google Fonts via Fontsource | Rasmus Andersson | SIL Open Font License 1.1 |

## Sounds (placeholders)
Synthesized by `packages/kit/scripts/make-placeholder-sounds.mjs` (seeded noise and oscillators, no samples,
no external services). Created for this repository and dedicated to the public domain under **CC0-1.0**.
Regenerate by hand with `npm run sounds -w packages/kit`; replace with CC0 packs (e.g. Kenney) when available.

| File | Category | Notes |
|---|---|---|
| `src/audio/common/tick.wav` | ui | soft hover tick |
| `src/audio/common/whoosh.wav` | ui | button activation |
| `src/audio/common/crowd-roar.wav` | crowd | crowd roar / call |
| `src/audio/common/fireworks.wav` | effects | boom and crackle |
| `src/audio/common/horn.wav` | effects | stadium air horn |
| `src/audio/common/fanfare.wav` | effects | "NEW EFFECT!" fanfare |
| `src/audio/common/chant-generic.wav` | voice | generic chant, fallback for missing voice lines |

## Art
Characters (footballer parts, ball), icons and effects are drawn in code (`src/art/`, `src/fx/`); no image files.
