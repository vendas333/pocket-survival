// Difficulty + day/night cycle — pure functions of elapsed survival time (seconds).
// Days are calm (few slow zombies); nights get serious.

export const DAY_SECONDS = 70;
export const NIGHT_SECONDS = 50;
export const CYCLE_SECONDS = DAY_SECONDS + NIGHT_SECONDS;
const FADE_SECONDS = 6;

export const ENEMY_TYPES = {
  zombie: { hp: 3, speed: 50, damage: 10, score: 10, unlockAt: 0, weight: 6 },
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
  const day = Math.floor(t / CYCLE_SECONDS) + 1;
  return {
    day,
    isNight,
    darkness,
    // 0..1 through the current phase (for the HUD clock)
    progress: isNight ? (phase - DAY_SECONDS) / NIGHT_SECONDS : phase / DAY_SECONDS,
    untilNight: isNight ? 0 : DAY_SECONDS - phase,
    bloodMoon: isNight && isBloodMoon(day),
  };
}

// Every 3rd night the moon turns red: bigger, tougher hordes
export function isBloodMoon(day) {
  return day % 3 === 0;
}

export function getDifficulty(seconds) {
  const t = Math.max(0, seconds);
  const { day, isNight } = getCycle(t);
  const base = {
    // A handful of zombies at first, slowly growing each night
    spawnInterval: Math.max(1400, Math.round(3400 - t * 3)),
    spawnBatch: 1,
    maxEnemies: Math.min(20, 4 + Math.floor(t / 30)),
    hpMultiplier: 1 + t / 200,
    speedMultiplier: 1,
    level: day,
    isNight,
  };
  if (isNight && isBloodMoon(day)) {
    return { ...base, spawnInterval: Math.round(base.spawnInterval * 0.6), maxEnemies: Math.round(base.maxEnemies * 1.5), bloodMoon: true };
  }
  if (isNight) return base;
  // Daytime: a few zombies roam the forest and only chase when they see you
  return { ...base, spawnInterval: 4000, spawnBatch: 1, maxEnemies: 2 + Math.min(3, day - 1), speedMultiplier: 1 };
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
