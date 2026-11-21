// Everything the eye sees: the room, the patrol routes, the vision cones, the loot, the
// thief, the guards, the cameras, the lasers, the getaway door, and the HUD with its
// loot total, heat (alarm) meter, lives, timer and tools — plus the title, briefing,
// pause and end screens. All drawing is plain canvas 2D, no images.
import {
  CANVAS_H,
  CANVAS_W,
  COLORS,
  COLS,
  ROWS,
  SMOKE_RADIUS,
  TILE,
  VIEW_X,
  VIEW_Y,
} from './config.js';
import { isWall } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_BRIEF = 'brief';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL_DONE = 'level-done';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill, edge) {
  conePath(ctx, x, y, angle, halfAngle, range);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
}

function drawLoot(ctx, item, time) {
  const bob = Math.sin(time * 3 + item.x) * 2;
  const y = item.y + bob;
  ctx.save();
  ctx.shadowBlur = 12;
  if (item.kind === 'cash') {
    ctx.shadowColor = COLORS.cash;
    ctx.fillStyle = '#2f7a3a';
    ctx.fillRect(item.x - 11, y - 7, 22, 14);
    ctx.fillStyle = COLORS.cash;
    ctx.fillRect(item.x - 8, y - 4, 16, 8);
    ctx.fillStyle = '#12351a';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', item.x, y + 0.5);
  } else if (item.kind === 'gold') {
    ctx.shadowColor = COLORS.gold;
    ctx.fillStyle = '#8a6410';
    ctx.beginPath();
    ctx.moveTo(item.x - 12, y + 6);
    ctx.lineTo(item.x - 8, y - 6);
    ctx.lineTo(item.x + 8, y - 6);
    ctx.lineTo(item.x + 12, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.moveTo(item.x - 9, y + 3);
    ctx.lineTo(item.x - 6, y - 4);
    ctx.lineTo(item.x + 6, y - 4);
    ctx.lineTo(item.x + 9, y + 3);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.shadowColor = COLORS.jewel;
    ctx.fillStyle = COLORS.jewel;
    ctx.beginPath();
    ctx.moveTo(item.x, y - 10);
    ctx.lineTo(item.x + 8, y);
    ctx.lineTo(item.x, y + 10);
    ctx.lineTo(item.x - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#eaf7ff';
    ctx.beginPath();
    ctx.moveTo(item.x, y - 5);
    ctx.lineTo(item.x + 3.5, y);
    ctx.lineTo(item.x, y + 5);
    ctx.lineTo(item.x - 3.5, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGuard(ctx, guard, alarm, time) {
  ctx.save();
  // The patrol route, so the player can read where this guard walks.
  ctx.strokeStyle = 'rgba(201, 79, 79, 0.25)';
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  guard.waypoints.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  // Body: a red-uniformed guard seen from above, nose pointing where he looks.
  ctx.fillStyle = COLORS.guardSuit;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd9d9';
  ctx.beginPath();
  ctx.moveTo(guard.x + Math.cos(guard.angle) * 16, guard.y + Math.sin(guard.angle) * 16);
  ctx.lineTo(guard.x + Math.cos(guard.angle + 2.5) * 8, guard.y + Math.sin(guard.angle + 2.5) * 8);
  ctx.lineTo(guard.x + Math.cos(guard.angle - 2.5) * 8, guard.y + Math.sin(guard.angle - 2.5) * 8);
  ctx.closePath();
  ctx.fill();
  if (alarm) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('!', guard.x, guard.y - 16 + Math.sin(time * 8) * 2);
  }
  ctx.restore();
}

function drawCamera(ctx, camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(camera.angle);
  ctx.fillStyle = camera.disabled > 0 ? '#5a5f6b' : COLORS.camera;
  ctx.fillRect(-4, -6, 16, 12);
  ctx.fillStyle = camera.disabled > 0 ? '#333' : '#fff3c4';
  ctx.beginPath();
  ctx.arc(13, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, player, time, invulnerable) {
  if (invulnerable > 0 && Math.floor(time * 8) % 2 === 0) return;
  ctx.save();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(111, 211, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 19, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.playerTrim;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
  ctx.stroke();
  // Hood point and mask band, pointing the way the thief moves.
  ctx.fillStyle = COLORS.playerTrim;
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.angle) * 17, player.y + Math.sin(player.angle) * 17);
  ctx.lineTo(player.x + Math.cos(player.angle + 2.6) * 8, player.y + Math.sin(player.angle + 2.6) * 8);
  ctx.lineTo(player.x + Math.cos(player.angle - 2.6) * 8, player.y + Math.sin(player.angle - 2.6) * 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8ecf4';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle + 0.5) * 5, player.y + Math.sin(player.angle + 0.5) * 5, 1.8, 0, Math.PI * 2);
  ctx.arc(player.x + Math.cos(player.angle - 0.5) * 5, player.y + Math.sin(player.angle - 0.5) * 5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPanel(ctx, x, y, width, height) {
  ctx.fillStyle = 'rgba(10, 13, 20, 0.88)';
  ctx.strokeStyle = COLORS.hudLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 10);
  ctx.fill();
  ctx.stroke();
}

function drawCentredText(ctx, text, x, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || CANVAS_W;
    const height = canvas.clientHeight || CANVAS_H;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const scale = Math.min(canvas.width / CANVAS_W, canvas.height / CANVAS_H);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - CANVAS_W * scale) / 2, (canvas.height - CANVAS_H * scale) / 2);
  }

  function drawHud(state) {
    const level = state.level;
    ctx.fillStyle = COLORS.hud;
    ctx.fillRect(0, 0, CANVAS_W, 44);
    ctx.fillStyle = COLORS.hudLine;
    ctx.fillRect(0, 44, CANVAS_W, 2);
    ctx.textBaseline = 'middle';

    // Top row: the job's name, the loot objective, lives, timer and score.
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText(level.name, 14, 15);
    const targetMet = state.levelLoot >= level.target;
    ctx.fillStyle = targetMet ? COLORS.escape : COLORS.gold;
    ctx.textAlign = 'center';
    ctx.fillText(`LOOT $${state.levelLoot} / $${level.target}${targetMet ? '  — GET TO THE DOOR!' : ''}`, 640, 15);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText('♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 3 - state.lives)), 1000, 15);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(formatTime(state.levelTime), 1075, 15);
    ctx.fillText(`SCORE ${state.score}`, 1266, 15);

    // Bottom row of the bar: the heat (alarm) meter and the tool charges.
    const meterX = 76;
    const meterY = 29;
    const meterW = 260;
    const meterH = 11;
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = state.alarm ? COLORS.alarm : COLORS.muted;
    ctx.fillText(state.alarm ? '⚠ ALARM!' : 'HEAT', 14, meterY + 5);
    ctx.fillStyle = '#10131c';
    ctx.beginPath();
    ctx.roundRect(meterX, meterY, meterW, meterH, 5);
    ctx.fill();
    const ratio = Math.max(0, Math.min(1, state.heat / 100));
    ctx.fillStyle = state.alarm ? COLORS.alarm : ratio > 0.6 ? COLORS.heat : '#3ddc84';
    ctx.beginPath();
    ctx.roundRect(meterX, meterY, Math.max(10, meterW * ratio), meterH, 5);
    ctx.fill();
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(`[1] SMOKE ×${state.smokeCharges}    [2] EMP ×${state.empCharges}${state.empTimer > 0 ? '  — CAMERAS DOWN' : ''}`, 1266, meterY + 5);
  }

  // The room itself, drawn in room coordinates (the view offset is applied here).
  function drawRoom(state, time) {
    const level = state.level;
    ctx.save();
    ctx.translate(VIEW_X, VIEW_Y);
    // Floor: a dark checker so the room reads at a glance.
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
        ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
      }
    }
    ctx.strokeStyle = COLORS.floorLine;
    ctx.lineWidth = 1;
    for (let col = 0; col <= COLS; col += 1) {
      ctx.beginPath();
      ctx.moveTo(col * TILE, 0);
      ctx.lineTo(col * TILE, ROWS * TILE);
      ctx.stroke();
    }
    for (let row = 0; row <= ROWS; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, row * TILE);
      ctx.lineTo(COLS * TILE, row * TILE);
      ctx.stroke();
    }

    // The getaway door, glowing green once the target is met.
    const targetMet = state.levelLoot >= level.target;
    const pulse = targetMet ? 0.6 + Math.sin(time * 5) * 0.4 : 0.25;
    ctx.save();
    ctx.shadowColor = COLORS.escape;
    ctx.shadowBlur = targetMet ? 26 : 6;
    ctx.fillStyle = targetMet ? COLORS.escape : '#1e5c38';
    ctx.globalAlpha = 0.35 + pulse * 0.5;
    ctx.beginPath();
    ctx.arc(level.escape.x, level.escape.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = targetMet ? '#062b16' : '#9adbb6';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(targetMet ? 'ESCAPE' : `$${level.target - state.levelLoot} MORE`, level.escape.x, level.escape.y);

    // Walls, with a lit top edge.
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (!isWall(level, col, row)) continue;
        const x = col * TILE;
        const y = row * TILE;
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 5);
        ctx.strokeStyle = COLORS.wallEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      }
    }

    // Laser grids: bright red when live, faint when blinking off.
    for (const laser of level.lasers) {
      ctx.save();
      ctx.strokeStyle = laser.on ? COLORS.laser : 'rgba(255, 60, 90, 0.18)';
      ctx.lineWidth = laser.on ? 3 : 1.5;
      ctx.shadowColor = COLORS.laser;
      ctx.shadowBlur = laser.on ? 10 : 0;
      ctx.setLineDash(laser.on ? [] : [6, 6]);
      ctx.beginPath();
      ctx.moveTo(laser.from.x, laser.from.y);
      ctx.lineTo(laser.to.x, laser.to.y);
      ctx.stroke();
      ctx.restore();
      for (const end of [laser.from, laser.to]) {
        ctx.fillStyle = '#ff5c73';
        ctx.fillRect(end.x - 4, end.y - 4, 8, 8);
      }
    }

    // Vision cones, drawn before the bodies so the watchers sit on top of them.
    for (const camera of level.cameras) {
      if (camera.disabled <= 0) {
        drawCone(ctx, camera.x, camera.y, camera.angle, 0.5, 205, COLORS.coneCamera, COLORS.coneCameraEdge);
      }
    }
    for (const guard of level.guards) {
      drawCone(ctx, guard.x, guard.y, guard.angle, 0.61, 225, COLORS.coneGuard, COLORS.coneGuardEdge);
    }

    // Loot, cameras, smoke, guards, the thief.
    for (const item of level.loot) {
      if (!item.taken) drawLoot(ctx, item, time);
    }
    for (const camera of level.cameras) drawCamera(ctx, camera);
    for (const smoke of state.smokes) {
      ctx.fillStyle = COLORS.smoke;
      ctx.beginPath();
      ctx.arc(smoke.x, smoke.y, SMOKE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const guard of level.guards) drawGuard(ctx, guard, state.alarm, time);
    drawPlayer(ctx, state.player, time, state.invulnerable);
    ctx.restore();
  }

  // Screen-space overlays: the alarm vignette, the crew's message, the controls hint.
  function drawOverlays(state, time) {
    if (state.alarm) {
      const strength = 0.25 + Math.sin(time * 6) * 0.1;
      const gradient = ctx.createRadialGradient(640, 360, 260, 640, 360, 720);
      gradient.addColorStop(0, 'rgba(255, 40, 40, 0)');
      gradient.addColorStop(1, `rgba(255, 40, 40, ${strength})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    if (state.messageTimer > 0 && state.message) {
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const width = ctx.measureText(state.message).width + 36;
      drawPanel(ctx, 640 - width / 2, 84, width, 36);
      ctx.fillStyle = state.alarm ? COLORS.alarm : COLORS.text;
      ctx.fillText(state.message, 640, 103);
    }
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('WASD / arrows — move    Shift — sneak    [1] smoke bomb    [2] EMP    P — pause    M — mute', 14, 706);
    ctx.textAlign = 'right';
    ctx.fillText(state.spotted ? '👁 SPOTTED — break line of sight!' : 'Stay out of the cones.', 1266, 706);
  }

  function drawTitle(state, best) {
    drawRoom(state, 0);
    ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawCentredText(ctx, 'MIDNIGHT VAULT', 640, 190, 'bold 64px system-ui, sans-serif', COLORS.gold);
    drawCentredText(ctx, 'A THREE-JOB HEIST', 640, 244, 'bold 20px system-ui, sans-serif', COLORS.text);
    drawCentredText(ctx, 'Sneak past the guards and their sweeping cameras. Grab the loot,', 640, 300, '18px system-ui, sans-serif', COLORS.muted);
    drawCentredText(ctx, 'dodge the alarm, and reach the green getaway door.', 640, 328, '18px system-ui, sans-serif', COLORS.muted);
    drawCentredText(ctx, 'WASD / arrows move · Shift sneaks · [1] smoke · [2] EMP disables cameras', 640, 392, '16px system-ui, sans-serif', COLORS.text);
    drawCentredText(ctx, 'Press SPACE or click to start the night', 640, 452, 'bold 20px system-ui, sans-serif', COLORS.escape);
    if (best > 0) drawCentredText(ctx, `Best score: ${best}`, 640, 500, '15px system-ui, sans-serif', COLORS.muted);
  }

  function drawBrief(state) {
    drawRoom(state, 0);
    ctx.fillStyle = 'rgba(8, 10, 16, 0.78)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawPanel(ctx, 340, 210, 600, 240);
    drawCentredText(ctx, state.level.name, 640, 258, 'bold 30px system-ui, sans-serif', COLORS.gold);
    drawCentredText(ctx, state.level.brief, 640, 306, '16px system-ui, sans-serif', COLORS.text);
    drawCentredText(ctx, `Target: $${state.level.target} of loot, then reach the green door.`, 640, 340, '16px system-ui, sans-serif', COLORS.muted);
    drawCentredText(ctx, 'Press SPACE or click to begin the job', 640, 398, 'bold 18px system-ui, sans-serif', COLORS.escape);
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawCentredText(ctx, 'PAUSED', 640, 330, 'bold 48px system-ui, sans-serif', COLORS.text);
    drawCentredText(ctx, 'Press P or SPACE to keep sneaking', 640, 390, '17px system-ui, sans-serif', COLORS.muted);
  }

  function drawLevelDone(state, best) {
    drawRoom(state, 0);
    ctx.fillStyle = 'rgba(8, 10, 16, 0.78)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawPanel(ctx, 340, 200, 600, 280);
    drawCentredText(ctx, 'JOB COMPLETE!', 640, 252, 'bold 40px system-ui, sans-serif', COLORS.escape);
    drawCentredText(ctx, `${state.level.name} — loot $${state.levelLoot} in ${formatTime(state.levelTime)}`, 640, 312, '18px system-ui, sans-serif', COLORS.text);
    drawCentredText(ctx, `Score: ${state.score}   ·   Best: ${Math.max(best, state.score)}`, 640, 352, '18px system-ui, sans-serif', COLORS.gold);
    drawCentredText(ctx, 'Press SPACE or click for the next job', 640, 420, 'bold 18px system-ui, sans-serif', COLORS.escape);
  }

  function drawOver(state, best) {
    drawRoom(state, 0);
    ctx.fillStyle = 'rgba(20, 6, 8, 0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawCentredText(ctx, 'BUSTED', 640, 260, 'bold 64px system-ui, sans-serif', COLORS.alarm);
    drawCentredText(ctx, 'The guards caught the crew. The night is over.', 640, 326, '19px system-ui, sans-serif', COLORS.text);
    drawCentredText(ctx, `Loot taken: $${state.totalLoot}   ·   Score: ${state.score}   ·   Best: ${Math.max(best, state.score)}`, 640, 376, '17px system-ui, sans-serif', COLORS.muted);
    drawCentredText(ctx, 'Press SPACE or click to try the night again', 640, 440, 'bold 19px system-ui, sans-serif', COLORS.escape);
  }

  function drawWin(state, best) {
    drawRoom(state, 0);
    ctx.fillStyle = 'rgba(8, 12, 8, 0.8)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawCentredText(ctx, 'THE PERFECT NIGHT', 640, 240, 'bold 54px system-ui, sans-serif', COLORS.gold);
    drawCentredText(ctx, 'All three jobs done. The vault, the gallery, the pawnshop —', 640, 306, '19px system-ui, sans-serif', COLORS.text);
    drawCentredText(ctx, 'cleaned out, and nobody ever saw your face.', 640, 334, '19px system-ui, sans-serif', COLORS.text);
    drawCentredText(ctx, `Total loot: $${state.totalLoot}   ·   Score: ${state.score}   ·   Best: ${Math.max(best, state.score)}`, 640, 396, '18px system-ui, sans-serif', COLORS.gold);
    drawCentredText(ctx, 'Press SPACE or click to run it back', 640, 460, 'bold 19px system-ui, sans-serif', COLORS.escape);
  }

  function draw(state, screen, best) {
    fit();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0b0e16';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const time = state.time;
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_BRIEF) drawBrief(state);
    else if (screen === SCREEN_LEVEL_DONE) drawLevelDone(state, best);
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else if (screen === SCREEN_WIN) drawWin(state, best);
    else {
      drawRoom(state, time);
      drawOverlays(state, time);
      drawHud(state);
      if (screen === SCREEN_PAUSED) drawPaused();
    }
  }

  return { draw };
}
