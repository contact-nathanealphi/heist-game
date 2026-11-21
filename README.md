# Midnight Vault — a three-job heist game

[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/contact-nathanealphi/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/contact-nathanealphi/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist game that runs entirely offline in a desktop browser,
built for [best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559).
One night, three jobs: a sleepy pawnshop, a guarded silver gallery, and a bank
vault wired with blinking lasers. In each job you slip past patrolling guards
and sweeping security cameras, pocket cash, gold bars and jewels until you hit
the target, then reach the green getaway door before the alarm catches up with
you.

## How it plays

- **Move** with WASD or the arrow keys. Hold **Shift** to sneak — slower, but
  you stay out of the cones longer.
- **Guards** walk patrol routes you can read on the floor; their red vision
  cones sweep the room. **Cameras** sweep yellow cones from the walls.
  Being seen fills the **heat meter**; at 100% the alarm sounds and every
  guard runs you down.
- **Tools:** `[1]` drops a smoke bomb that blocks all sight for a few
  seconds, `[2]` fires an EMP that shuts the cameras (and lasers) down.
  Both are limited per job, so spend them where they matter.
- **Loot** is cash ($100), gold bars ($250) and jewels ($400). Each job sets a
  target — take that much, then escape. Beat the par time for a bonus.
- Get caught and you lose a life and drop back to the entrance; lose all
  three lives and the night is over. **P** pauses, **M** mutes the sound.

## The three jobs

1. **The Corner Pawnshop** — 2 guards, 1 camera, $800 target.
2. **The Silver Gallery** — 3 guards, 2 cameras, $1,400 target.
3. **The Midnight Bank** — 4 guards, 3 cameras, blinking laser grids,
   $2,200 target, and the vault full of gold and jewels.

## Play it

Serve `game/` with any static server (for example `node serve.ts`, then open
http://localhost:8080) — no build step, no network requests, no libraries.
The screenshots in `screenshots/` are real renders of the game staged with
`?shot=heist|alarm|escape|vault` (see `shots.json`).

## Layout

- `game/index.html` — the page, canvas and styles
- `game/src/config.js` — every tuned number and colour in one place
- `game/src/levels.js` — the three hand-drawn floor plans, patrols, cameras
  and lasers
- `game/src/world.js` — movement, collisions, vision, heat, loot, tools,
  win/lose
- `game/src/render.js` — canvas drawing: room, cones, HUD, screens
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sound effects (Web Audio, no files)
- `game/src/shots.js` — the four staged screenshot scenes
- `game/src/main.js` — boot, fixed-step loop, screen flow
- `main.ts` — the make.fun hand-in program (copies `game/` +
  `screenshots/` to `/output` and writes `dossier.json`)
