# Gaze Arena

Free, open-source web games for children who use eye gaze (eye tracking with dwell-click).
Football, wrestling and lots of action — with **no time pressure**: every game waits for the player,
and all the excitement comes from the reaction, not from reflexes.

Available in English and Italian. Contributions of new languages are welcome.

## Who it's for
- Children and young people who use an eye-gaze device (e.g. Tobii Dynavox or similar) or any switch/dwell setup that produces mouse clicks.
- Parents, therapists and teachers looking for motivating, age-appropriate activities that build eye-gaze access skills.

## How it works with your device
The games only need **left mouse clicks**. Your eye-gaze software turns a fixation into a click
(mouse emulation / dwell-click), so no special drivers or integrations are needed.
Dwell time is set on your device, not in the game. The games are designed to work with dwell times from 0.5 to 2 seconds
and to ignore repeated clicks.

## Games
| # | Game | Status |
|---|---|---|
| 0 | Goal Party | in development |
| 1 | Penalty Blast | planned |
| 2 | Champions' Ring | planned |

## Settings for adults
Press **P** to open the settings panel: language, target size, effect intensity, volumes, number of choices.
It can't be opened by gaze, so the child can't change it by accident.

## Repository layout
Each game lives in its own folder under `games/` and can be built and hosted on its own as a static site.
Shared building blocks (gaze-friendly buttons, settings, languages, sounds) live in `packages/kit/`.

```
packages/kit/         shared library (@gaze-arena/kit)
games/goal-party/     one folder per game, independently deployable
templates/game/       starting point for a new game
tools/asset-gen/      image generation pipeline for backgrounds and illustrations
docs/                 design principles, asset pipeline
```

## Running locally
```bash
npm install
npm run dev -w games/goal-party
```

## Deploying a game
```bash
npm run build -w games/goal-party
```
Upload `games/goal-party/dist/` to any static host (GitHub Pages, Netlify, a school server, a USB stick with a local server).
It works from any path and needs no internet connection after loading.
Add `?sim=1` to the URL to simulate eye-gaze jitter and repeat-clicks with a normal mouse.

## Contributing
See `CONTRIBUTING.md` (coming soon). Design rules every game must follow are in `docs/design-principles.md`.
To start a new game: `npm run new-game <game-id>`.
Characters and UI are drawn in code; backgrounds come from the asset pipeline (`docs/asset-pipeline.md`).
You don't need any API key to build, run or contribute code: generated images are committed to the repo.

## License
Code: [LICENSE TO BE CHOSEN]. Third-party and generated assets, with their source and license, are listed in each `ASSETS.md`.
