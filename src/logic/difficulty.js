// Difficulty + day/night cycle — pure functions of elapsed survival time (seconds).
// Days are calm (few slow zombies); nights get serious.

export const DAY_SECONDS = 70;
export const NIGHT_SECONDS = 50;
export const CYCLE_SECONDS = DAY_SECONDS + NIGHT_SECONDS;
const FADE_SECONDS = 6;

export const ENEMY_TYPES = {
  zombie: { hp: 3, speed: 34, damage: 10, score: 10, unlockAt: 0, weight: 6 },
  runner: { hp: 2, speed: 74, damage: 7, score: 15, unlockAt: 0, weight: 3, nightOnly: true },
  brute: { hp: 18, speed: 28, damage: 25, score: 60, unlockAt: CYCLE_SECONDS, weight: 1 },
};

export function getCycle(seconds) {
  const t = Math.max(0, seconds);
  const phase = t % CYCLE_SECONDS;
  const isNight = phase >= DAY_SECONDS;
  // 0 = full daylight, 1 = full night (smooth dusk/dawn)
  const darkness = isNight
    ? Math.min(1, (phase - DAY_SECONDS) / FADE_SECONDS, (CYCLE_SECONDS - phase) / FADE_SECONDS)
    : 0;
  return { day: Math.floor(t / CYCLE_SECONDS) + 1, isNight, darkness };
}

export function getDifficulty(seconds) {
  const t = Math.max(0, seconds);
  const { day, isNight } = getCycle(t);
  const base = {
    spawnInterval: Math.max(300, Math.round(1300 - t * 4)),
    spawnBatch: 1 + Math.floor(t / 150),
    maxEnemies: Math.min(80, 12 + Math.floor(t / 5)),
    hpMultiplier: 1 + t / 150,
    speedMultiplier: Math.min(1.6, 1 + t / 400),
    level: day,
    isNight,
  };
  if (isNight) return base;
  // Daytime: quiet scavenging
  return {
    ...base,
    spawnInterval: base.spawnInterval * 3,
    spawnBatch: 1,
    maxEnemies: Math.max(4, Math.floor(base.maxEnemies * 0.3)),
    speedMultiplier: base.speedMultiplier * 0.85,
  };
}

export function availableEnemyTypes(seconds, isNight = getCycle(seconds).isNight) {
  return Object.entries(ENEMY_TYPES)
    .filter(([, def]) => seconds >= def.unlockAt && (isNight || !def.nightOnly))
    .map(([id]) => id);
}

// rand: () => number in [0, 1)
export function pickEnemyType(seconds, rand = Math.random) {
  const types = availableEnemyTypes(seconds);
  const total = types.reduce((sum, id) => sum + ENEMY_TYPES[id].weight, 0);
  let roll = rand() * total;
  for (const id of types) {
    roll -= ENEMY_TYPES[id].weight;
    if (roll < 0) return id;
  }
  return types[types.length - 1];
}

export function computeScore(seconds, killScore) {
  return Math.floor(seconds) + killScore;
}
