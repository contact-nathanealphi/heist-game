// The heist itself: movement, collisions, guard patrols and chases, camera sweeps,
// laser grids, the heat (alarm) meter, loot, tools and the win/lose conditions.
// Everything here runs in fixed 1/60 s steps from main.js, so the same inputs always
// give the same game.
import {
  ALARM_END_HEAT,
  CAMERA_CONE_HALF_ANGLE,
  CAMERA_CONE_RANGE,
  EMP_SECONDS,
  GUARD_CATCH_RADIUS,
  GUARD_CHASE_SPEED,
  GUARD_CONE_HALF_ANGLE,
  GUARD_CONE_RANGE,
  GUARD_PATROL_SPEED,
  HEAT_ALARM_DECAY_PER_SECOND,
  HEAT_CAMERA_PER_SECOND,
  HEAT_DECAY_PER_SECOND,
  HEAT_GUARD_PER_SECOND,
  HEAT_LASER_PER_SECOND,
  LIVES,
  PLAYER_SPEED,
  SMOKE_RADIUS,
  SMOKE_SECONDS,
  SNEAK_SPEED,
  TILE,
} from './config.js';
import { loadLevel } from './levels.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_ALARM = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_LEVEL_DONE = 8;
export const EVENT_OVER = 16;

const PLAYER_RADIUS = 13;
const GUARD_RADIUS = 14;

/** Is the tile at (col, row) a wall in this level? */
export function isWall(level, col, row) {
  return level.walls.has(`${col},${row}`);
}

function circleHitsWall(level, x, y, radius) {
  const left = Math.floor((x - radius) / TILE);
  const right = Math.floor((x + radius) / TILE);
  const top = Math.floor((y - radius) / TILE);
  const bottom = Math.floor((y + radius) / TILE);
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      if (!isWall(level, col, row)) continue;
      const nearestX = Math.max(col * TILE, Math.min(x, (col + 1) * TILE));
      const nearestY = Math.max(row * TILE, Math.min(y, (row + 1) * TILE));
      const dx = x - nearestX;
      const dy = y - nearestY;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
  }
  return false;
}

/** Slide a circle through the walls: try the full move, then each axis on its own. */
function moveWithWalls(level, body, dx, dy, radius) {
  if (!circleHitsWall(level, body.x + dx, body.y + dy, radius)) {
    body.x += dx;
    body.y += dy;
    return;
  }
  if (!circleHitsWall(level, body.x + dx, body.y, radius)) body.x += dx;
  else if (!circleHitsWall(level, body.x, body.y + dy, radius)) body.y += dy;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** True when no wall and no smoke cloud stands between `from` and `to`. */
function hasLineOfSight(level, from, to, smokes) {
  const dist = distance(from, to);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    if (isWall(level, Math.floor(x / TILE), Math.floor(y / TILE))) return false;
    for (const smoke of smokes) {
      if (Math.hypot(x - smoke.x, y - smoke.y) < SMOKE_RADIUS * 0.8) return false;
    }
  }
  return true;
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Can this watcher (guard or camera) see the thief right now? */
function canSee(level, watcher, range, halfAngle, target, smokes) {
  const dist = distance(watcher, target);
  if (dist > range) return false;
  const toTarget = Math.atan2(target.y - watcher.y, target.x - watcher.x);
  if (Math.abs(angleDifference(toTarget, watcher.angle)) > halfAngle) return false;
  return hasLineOfSight(level, watcher, target, smokes);
}

function guardTarget(guard) {
  return guard.waypoints[guard.waypointIndex];
}

/** Build a fresh world: three lives, the first job, nothing stolen yet. */
export function createWorld(random) {
  const state = {
    random,
    levelIndex: 0,
    level: null,
    player: { x: 0, y: 0, angle: 0, moving: false, sneaking: false },
    heat: 0,
    alarm: false,
    lives: LIVES,
    lootValue: 0,
    levelLoot: 0,
    totalLoot: 0,
    score: 0,
    time: 0,
    levelTime: 0,
    smokeCharges: 2,
    empCharges: 1,
    smokes: [],
    empTimer: 0,
    invulnerable: 0,
    spotted: false,
    message: '',
    messageTimer: 0,
    done: false,
  };

  function load(index) {
    state.levelIndex = index;
    state.level = loadLevel(index);
    state.player.x = state.level.playerStart.x;
    state.player.y = state.level.playerStart.y;
    state.player.angle = 0;
    state.heat = 0;
    state.alarm = false;
    state.levelLoot = 0;
    state.levelTime = 0;
    state.smokeCharges = 2;
    state.empCharges = 1;
    state.smokes = [];
    state.empTimer = 0;
    state.invulnerable = 0;
    state.spotted = false;
  }

  function reset() {
    state.lives = LIVES;
    state.lootValue = 0;
    state.totalLoot = 0;
    state.score = 0;
    state.time = 0;
    state.done = false;
    load(0);
  }

  function dropSmoke() {
    if (state.smokeCharges <= 0) return false;
    state.smokeCharges -= 1;
    state.smokes.push({ x: state.player.x, y: state.player.y, timer: SMOKE_SECONDS });
    return true;
  }

  function fireEmp() {
    if (state.empCharges <= 0) return false;
    state.empCharges -= 1;
    state.empTimer = EMP_SECONDS;
    for (const camera of state.level.cameras) camera.disabled = EMP_SECONDS;
    return true;
  }

  function step(dt, input, attract) {
    const level = state.level;
    const player = state.player;
    let events = EVENT_NONE;
    state.time += dt;
    state.levelTime += dt;
    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (state.invulnerable > 0) state.invulnerable -= dt;
    if (state.empTimer > 0) state.empTimer -= dt;
    for (const smoke of state.smokes) smoke.timer -= dt;
    state.smokes = state.smokes.filter((smoke) => smoke.timer > 0);

    // The thief moves with WASD or the arrow keys; Shift sneaks (slower, harder to spot).
    const speed = input.sneak ? SNEAK_SPEED : PLAYER_SPEED;
    const dx = input.x * speed * dt;
    const dy = input.y * speed * dt;
    player.moving = dx !== 0 || dy !== 0;
    player.sneaking = input.sneak;
    if (player.moving) player.angle = Math.atan2(dy, dx);
    if (!attract) moveWithWalls(level, player, dx, dy, PLAYER_RADIUS);
    if (input.smoke) dropSmoke();
    if (input.emp) fireEmp();

    // Cameras sweep; lasers blink on their own timers.
    for (const camera of level.cameras) {
      if (camera.disabled > 0) camera.disabled -= dt;
      else {
        camera.phase += camera.speed * dt;
        camera.angle = camera.baseAngle + Math.sin(camera.phase) * camera.sweep;
      }
    }
    for (const laser of level.lasers) {
      laser.phase += dt;
      const cycle = laser.onSeconds + laser.offSeconds;
      laser.on = (laser.phase % cycle) < laser.onSeconds && state.empTimer <= 0;
    }

    // Guards patrol their waypoints, pause at each end, and chase during an alarm.
    for (const guard of level.guards) {
      if (guard.pause > 0) {
        guard.pause -= dt;
        continue;
      }
      const target = state.alarm ? player : guardTarget(guard);
      const dist = distance(guard, target);
      const speedNow = state.alarm ? GUARD_CHASE_SPEED : GUARD_PATROL_SPEED;
      if (!state.alarm && dist < 6) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pause = 0.9;
        continue;
      }
      if (dist > 2) {
        const stepX = ((target.x - guard.x) / dist) * speedNow * dt;
        const stepY = ((target.y - guard.y) / dist) * speedNow * dt;
        const before = { x: guard.x, y: guard.y };
        moveWithWalls(level, guard, stepX, stepY, GUARD_RADIUS);
        if (guard.x !== before.x || guard.y !== before.y) {
          guard.angle = Math.atan2(guard.y - before.y, guard.x - before.x);
        }
      }
    }

    // Who can see the thief? Guards, cameras, and a live laser beam all raise the heat.
    let seen = false;
    for (const guard of level.guards) {
      if (canSee(level, guard, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, player, state.smokes)) {
        seen = true;
        state.heat += HEAT_GUARD_PER_SECOND * dt;
      }
    }
    for (const camera of level.cameras) {
      if (camera.disabled <= 0 && canSee(level, camera, CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE, player, state.smokes)) {
        seen = true;
        state.heat += HEAT_CAMERA_PER_SECOND * dt;
      }
    }
    for (const laser of level.lasers) {
      if (!laser.on) continue;
      const horizontal = Math.abs(laser.from.y - laser.to.y) < 1;
      const across = horizontal
        ? Math.abs(player.y - laser.from.y) < 10 && player.x > Math.min(laser.from.x, laser.to.x) && player.x < Math.max(laser.from.x, laser.to.x)
        : Math.abs(player.x - laser.from.x) < 10 && player.y > Math.min(laser.from.y, laser.to.y) && player.y < Math.max(laser.from.y, laser.to.y);
      if (across) {
        seen = true;
        state.heat += HEAT_LASER_PER_SECOND * dt;
      }
    }
    state.spotted = seen;
    if (!seen) {
      state.heat -= (state.alarm ? HEAT_ALARM_DECAY_PER_SECOND : HEAT_DECAY_PER_SECOND) * dt;
    }
    if (state.heat < 0) state.heat = 0;
    if (state.heat >= 100) {
      state.heat = 100;
      if (!state.alarm) {
        state.alarm = true;
        events |= EVENT_ALARM;
        state.message = 'ALARM! Run — the guards are coming!';
        state.messageTimer = 2.5;
      }
    } else if (state.alarm && state.heat <= ALARM_END_HEAT) {
      state.alarm = false;
      state.message = 'They lost you. Stay quiet.';
      state.messageTimer = 2;
    }

    // Loot: walk over it to pocket it.
    for (const item of level.loot) {
      if (!item.taken && distance(player, item) < 24) {
        item.taken = true;
        state.levelLoot += item.value;
        state.lootValue += item.value;
        state.totalLoot += item.value;
        events |= EVENT_PICKUP;
      }
    }

    // Caught: a guard reaches the thief.
    if (state.invulnerable <= 0) {
      for (const guard of level.guards) {
        if (distance(player, guard) < GUARD_CATCH_RADIUS + PLAYER_RADIUS) {
          state.lives -= 1;
          state.heat = 50;
          state.alarm = state.lives > 0;
          player.x = level.playerStart.x;
          player.y = level.playerStart.y;
          state.invulnerable = 2.5;
          for (const g of level.guards) {
            g.state = 'patrol';
            g.waypointIndex = 0;
            g.x = g.waypoints[0].x;
            g.y = g.waypoints[0].y;
          }
          events |= EVENT_CAUGHT;
          state.message = state.lives > 0 ? 'Caught! You slipped away — one life lost.' : 'Caught! The crew is done.';
          state.messageTimer = 2.5;
          if (state.lives <= 0) events |= EVENT_OVER;
          break;
        }
      }
    }

    // The getaway: once this job's target is met, reaching the green door ends the job.
    if (state.levelLoot >= level.target && distance(player, level.escape) < 30) {
      const timeBonus = Math.max(0, Math.round((level.parSeconds - state.levelTime) * 10));
      state.score += state.levelLoot + timeBonus + state.lives * 150;
      events |= EVENT_LEVEL_DONE;
    }
    return events;
  }

  load(0);
  return { state, reset, load, step, dropSmoke, fireEmp };
}
