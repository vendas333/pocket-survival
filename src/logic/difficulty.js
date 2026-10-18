// Difficulty curve — pure functions of elapsed survival time (seconds).

export const ENEMY_TYPES = {
  slime: { hp: 3, speed: 42, damage: 10, score: 10, unlockAt: 0, weight: 6 },
  bat: { hp: 2, speed: 78, damage: 6, score: 15, unlockAt: 30, weight: 4 },
  skeleton: { hp: 7, speed: 50, damage: 15, score: 30, unlockAt: 75, weight: 3 },
  golem: { hp: 22, speed: 32, damage: 25, score: 80, unlockAt: 150, weight: 1 },
};

export function getDifficulty(seconds) {
  const t = Math.max(0, seconds);
  return {
    // ms between spawns, never faster than 260ms
    spawnInterval: Math.max(260, Math.round(1500 - t * 9)),
    // how many enemies spawn per tick
    spawnBatch: 1 + Math.floor(t / 60),
    maxEnemies: Math.min(90, 8 + Math.floor(t / 3)),
    hpMultiplier: 1 + t / 100,
    speedMultiplier: Math.min(1.8, 1 + t / 300),
    level: 1 + Math.floor(t / 30),
  };
}

export function availableEnemyTypes(seconds) {
  return Object.entries(ENEMY_TYPES)
    .filter(([, def]) => seconds >= def.unlockAt)
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
