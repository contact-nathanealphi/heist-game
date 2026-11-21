// The three jobs of Midnight Vault. Each level is a hand-drawn floor plan (30 by 16 tiles)
// plus the patrols, cameras and laser grids that guard it. Legend in a plan:
//   # wall   . floor   P the thief's start   E the getaway door
//   $ cash ($100)   g gold bar ($250)   j jewel ($400)
// Guards walk between waypoints; cameras sweep back and forth from a wall;
// lasers blink on and off on a timer, so a careful thief crosses in the dark gap.
import { COLS, LOOT_CASH, LOOT_GOLD, LOOT_JEWEL, ROWS, TILE } from './config.js';

const LEVELS = [
  {
    name: 'Job 1 — The Corner Pawnshop',
    brief: 'Quiet street, sleepy guard. Take $800 of pawned goods, then slip out the back.',
    target: 800,
    parSeconds: 90,
    guards: [
      { name: 'Rocco', waypoints: [[4, 1], [7, 1]] },
      { name: 'Mara', waypoints: [[17, 10], [27, 10]] },
    ],
    cameras: [{ col: 15, row: 0, baseAngle: Math.PI / 2, sweep: 0.55, speed: 0.5 }],
    lasers: [],
    map: [
      '##############################',
      '#........#..........#........#',
      '#..$$....#....$$....#....g...#',
      '#........#..........#........#',
      '#...######....#######...###..#',
      '#...#....................#...#',
      '#...#....$$.....j........#...#',
      '#...#....................#...#',
      '###.######....#######...###.##',
      '#............................#',
      '#..$$........####.....$$.....#',
      '#............####............#',
      '#....####....####....####....#',
      '#....####..........####..g...#',
      '#..P........................E#',
      '##############################',
    ],
  },
  {
    name: 'Job 2 — The Silver Gallery',
    brief: 'Three guards, two cameras, and glass cases worth a fortune. Take $1,400.',
    target: 1400,
    parSeconds: 120,
    guards: [
      { name: 'Rocco', waypoints: [[4, 1], [9, 1]] },
      { name: 'Ines', waypoints: [[20, 5], [26, 5]] },
      { name: 'Mara', waypoints: [[22, 11], [28, 11]] },
    ],
    cameras: [
      { col: 15, row: 0, baseAngle: Math.PI / 2, sweep: 0.55, speed: 0.6 },
      { col: 0, row: 8, baseAngle: 0, sweep: 0.5, speed: 0.45 },
    ],
    lasers: [],
    map: [
      '##############################',
      '#......#..........#..........#',
      '#..$$..#....$$....#....g.....#',
      '#......#..........#..........#',
      '#..#####....#######....####..#',
      '#..#.......................#.#',
      '#..#...$$.....j......$$....#.#',
      '#..#.......................#.#',
      '##.#..#####....######....#.#.#',
      '#............................#',
      '#..$$.....####.....####..$$..#',
      '#........####.....####.......#',
      '#...###........j........###..#',
      '#...###....####....###..###..#',
      '#..P..........#..........E...#',
      '##############################',
    ],
  },
  {
    name: 'Job 3 — The Midnight Bank',
    brief: 'The vault. Four guards, three cameras, blinking lasers. Take $2,200 and vanish.',
    target: 2200,
    parSeconds: 150,
    guards: [
      { name: 'Rocco', waypoints: [[4, 1], [8, 1]] },
      { name: 'Ines', waypoints: [[10, 5], [19, 5]] },
      { name: 'Mara', waypoints: [[5, 10], [8, 10]] },
      { name: 'Vic', waypoints: [[23, 11], [28, 11]] },
    ],
    cameras: [
      { col: 15, row: 0, baseAngle: Math.PI / 2, sweep: 0.55, speed: 0.7 },
      { col: 0, row: 8, baseAngle: 0, sweep: 0.5, speed: 0.5 },
      { col: 29, row: 4, baseAngle: Math.PI, sweep: 0.5, speed: 0.55 },
    ],
    lasers: [
      { from: [10, 9], to: [20, 9], onSeconds: 2.2, offSeconds: 1.6, phase: 0 },
      { from: [18, 10], to: [18, 12], onSeconds: 1.8, offSeconds: 1.8, phase: 0.9 },
    ],
    map: [
      '##############################',
      '#.....#.........#....#####...#',
      '#..$..#....g....#....#ggg#...#',
      '#.....#.........#....#jjj#...#',
      '#..####....######....#.g.#...#',
      '#..#.................#...#...#',
      '#..#....$$.....j.....#...#...#',
      '#..#.................#...#...#',
      '##.#..#####....######...#.#..#',
      '#............................#',
      '#..$$....####......####..$$..#',
      '#........####......####......#',
      '#...##........##........##...#',
      '#...##...####.##.####...##...#',
      '#..P..........##..........E..#',
      '##############################',
    ],
  },
];

function tileCentre(col, row) {
  return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
}

/** Turn one plan's characters into walls, loot, the start and the getaway door. */
export function parseLevel(def) {
  if (def.map.length !== ROWS) throw new Error(`${def.name}: ${def.map.length} rows, expected ${ROWS}`);
  const walls = new Set();
  const loot = [];
  let playerStart = null;
  let escape = null;
  for (let row = 0; row < ROWS; row += 1) {
    const line = def.map[row];
    if (line.length !== COLS) throw new Error(`${def.name} row ${row}: ${line.length} columns, expected ${COLS}`);
    for (let col = 0; col < COLS; col += 1) {
      const key = `${col},${row}`;
      const ch = line[col];
      if (ch === '#') walls.add(key);
      else if (ch === 'P') playerStart = tileCentre(col, row);
      else if (ch === 'E') escape = tileCentre(col, row);
      else if (ch === '$') loot.push({ ...tileCentre(col, row), kind: 'cash', value: LOOT_CASH, taken: false });
      else if (ch === 'g') loot.push({ ...tileCentre(col, row), kind: 'gold', value: LOOT_GOLD, taken: false });
      else if (ch === 'j') loot.push({ ...tileCentre(col, row), kind: 'jewel', value: LOOT_JEWEL, taken: false });
    }
  }
  if (!playerStart || !escape) throw new Error(`${def.name}: missing start or escape`);
  const guards = def.guards.map((g) => ({
    name: g.name,
    waypoints: g.waypoints.map(([c, r]) => tileCentre(c, r)),
    waypointIndex: 0,
    ...tileCentre(g.waypoints[0][0], g.waypoints[0][1]),
    angle: 0,
    state: 'patrol',
    pause: 0,
  }));
  const cameras = def.cameras.map((c) => ({
    ...tileCentre(c.col, c.row),
    baseAngle: c.baseAngle,
    sweep: c.sweep,
    speed: c.speed,
    angle: c.baseAngle,
    phase: 0,
    disabled: 0,
  }));
  const lasers = def.lasers.map((l) => ({
    from: tileCentre(l.from[0], l.from[1]),
    to: tileCentre(l.to[0], l.to[1]),
    onSeconds: l.onSeconds,
    offSeconds: l.offSeconds,
    phase: l.phase,
    on: true,
  }));
  return {
    name: def.name,
    brief: def.brief,
    target: def.target,
    parSeconds: def.parSeconds,
    walls,
    loot,
    playerStart,
    escape,
    guards,
    cameras,
    lasers,
  };
}

/** How many jobs the night holds. */
export const LEVEL_COUNT = LEVELS.length;

/** Parse the level at `index` (0-based) into a fresh, playable blueprint. */
export function loadLevel(index) {
  return parseLevel(LEVELS[index % LEVELS.length]);
}
