// Shared numbers and colours for Midnight Vault. One place holds every tuned value so a
// balance change never has to hunt through the world, the renderer or the levels.
export const TILE = 40;
export const COLS = 30;
export const ROWS = 16;
export const VIEW_X = 40;
export const VIEW_Y = 52;
export const VIEW_W = COLS * TILE;
export const VIEW_H = ROWS * TILE;
export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const STEP = 1 / 60;

export const LIVES = 3;
export const PLAYER_SPEED = 132;
export const SNEAK_SPEED = 78;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 118;
export const GUARD_CATCH_RADIUS = 20;
export const GUARD_CONE_RANGE = 225;
export const GUARD_CONE_HALF_ANGLE = 0.61;
export const CAMERA_CONE_RANGE = 205;
export const CAMERA_CONE_HALF_ANGLE = 0.5;

export const HEAT_GUARD_PER_SECOND = 62;
export const HEAT_CAMERA_PER_SECOND = 38;
export const HEAT_LASER_PER_SECOND = 46;
export const HEAT_DECAY_PER_SECOND = 9;
export const HEAT_ALARM_DECAY_PER_SECOND = 13;
export const ALARM_END_HEAT = 55;
export const SMOKE_SECONDS = 5;
export const SMOKE_RADIUS = 95;
export const EMP_SECONDS = 6;

export const LOOT_CASH = 100;
export const LOOT_GOLD = 250;
export const LOOT_JEWEL = 400;

export const BEST_KEY = 'midnight-vault-best';

export const COLORS = {
  floorA: '#20242f',
  floorB: '#1b1f29',
  floorLine: '#262b38',
  wall: '#3a4152',
  wallTop: '#565f75',
  wallEdge: '#141824',
  hud: '#0d1017',
  hudLine: '#2c3342',
  text: '#e8ecf4',
  muted: '#9aa3b5',
  gold: '#f5c542',
  cash: '#7ddc7d',
  jewel: '#6fd3ff',
  player: '#1c1f26',
  playerTrim: '#f5c542',
  guard: '#c94f4f',
  guardSuit: '#7a2e2e',
  coneGuard: 'rgba(255, 84, 84, 0.20)',
  coneGuardEdge: 'rgba(255, 84, 84, 0.55)',
  coneCamera: 'rgba(255, 214, 64, 0.16)',
  coneCameraEdge: 'rgba(255, 214, 64, 0.5)',
  coneSafe: 'rgba(120, 220, 255, 0.07)',
  camera: '#e8b93c',
  laser: 'rgba(255, 60, 90, 0.85)',
  escape: '#3ddc84',
  smoke: 'rgba(200, 205, 215, 0.28)',
  alarm: '#ff4d4d',
  heat: '#ffb02e',
};
