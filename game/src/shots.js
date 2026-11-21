// The screenshot scenes behind ?shot=heist|alarm|escape|vault. Each one loads a job and
// places the thief, the guards and the cameras exactly where the frame needs them — a
// real render of the game's own code, the same every time, so the screenshots are
// reproducible and show the heist at its best: cones sweeping, loot half-taken, the
// alarm screaming, or the getaway door glowing.
import { TILE } from './config.js';
import { SCREEN_PLAY } from './render.js';

function tileCentre(col, row) {
  return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
}

/** Pocket loot from the level until `value` dollars are taken, in map order. */
function takeLootUpTo(level, value) {
  let taken = 0;
  for (const item of level.loot) {
    if (taken >= value) break;
    item.taken = true;
    taken += item.value;
  }
  return taken;
}

function placeThief(state, col, row, angle) {
  const point = tileCentre(col, row);
  state.player.x = point.x;
  state.player.y = point.y;
  state.player.angle = angle;
}

function placeGuard(state, index, col, row, angle) {
  const guard = state.level.guards[index];
  const point = tileCentre(col, row);
  guard.x = point.x;
  guard.y = point.y;
  guard.angle = angle;
  guard.pause = 0;
}

function aimCamera(state, index, angle) {
  const camera = state.level.cameras[index];
  camera.angle = angle;
  camera.phase = 0;
  camera.disabled = 0;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best
 * score to show. Any other name stages the heist scene.
 */
export function stageShot(name, world) {
  const { state } = world;
  if (name === 'alarm') {
    world.load(1);
    takeLootUpTo(state.level, 900);
    state.levelLoot = 900;
    state.score = 900;
    state.levelTime = 83;
    state.time = 83;
    state.heat = 92;
    state.alarm = true;
    state.message = 'ALARM! Run — the guards are coming!';
    state.messageTimer = 2.5;
    placeThief(state, 15, 9, -Math.PI / 2);
    placeGuard(state, 0, 13, 8, 0.3);
    placeGuard(state, 1, 18, 10, Math.PI - 0.4);
    placeGuard(state, 2, 15, 6, Math.PI / 2);
    aimCamera(state, 0, Math.PI / 2 + 0.4);
    aimCamera(state, 1, 0.3);
  } else if (name === 'escape') {
    world.load(0);
    takeLootUpTo(state.level, 850);
    state.levelLoot = 850;
    state.score = 850;
    state.levelTime = 61;
    state.time = 61;
    state.heat = 18;
    state.message = 'Target met — get to the green door!';
    state.messageTimer = 2.5;
    placeThief(state, 26, 14, 0);
    placeGuard(state, 0, 5, 2, Math.PI / 2);
    placeGuard(state, 1, 20, 10, Math.PI);
    aimCamera(state, 0, Math.PI / 2 - 0.3);
  } else if (name === 'vault') {
    world.load(2);
    takeLootUpTo(state.level, 1600);
    state.levelLoot = 1600;
    state.score = 1600;
    state.levelTime = 104;
    state.time = 104;
    state.heat = 45;
    placeThief(state, 23, 4, Math.PI / 2);
    placeGuard(state, 0, 6, 1, 0);
    placeGuard(state, 1, 14, 5, Math.PI);
    placeGuard(state, 2, 6, 10, 0);
    placeGuard(state, 3, 25, 11, Math.PI);
    aimCamera(state, 0, Math.PI / 2 + 0.3);
    aimCamera(state, 1, -0.2);
    aimCamera(state, 2, Math.PI - 0.3);
    for (const laser of state.level.lasers) laser.on = true;
  } else {
    // The cover: the pawnshop job mid-heist, cones sweeping, loot half-pocketed.
    world.load(0);
    takeLootUpTo(state.level, 450);
    state.levelLoot = 450;
    state.score = 450;
    state.levelTime = 47;
    state.time = 47;
    state.heat = 35;
    placeThief(state, 14, 6, 0.4);
    placeGuard(state, 0, 5, 3, Math.PI / 2);
    placeGuard(state, 1, 20, 10, Math.PI);
    aimCamera(state, 0, Math.PI / 2 + 0.35);
  }
  return { screen: SCREEN_PLAY, best: 0 };
}
