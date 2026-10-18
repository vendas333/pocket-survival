// Loot from supply crates and abandoned cars (pure; rand is injectable for tests).

export const LOOT = {
  openMs: 1500, // hold still next to it for 1.5s
  crateEveryMs: 22000, // a crate drops every ~22s during the day
  maxCrates: 2,
  rareDistance: 450, // crates this far from you are rare
};

const between = (rand, min, max) => min + Math.floor(rand() * (max - min + 1));

// tier: 'common' | 'rare' | 'car'
export function rollLoot(tier, rand = Math.random) {
  if (tier === 'rare') {
    return {
      wood: between(rand, 12, 20),
      stone: between(rand, 8, 14),
      beams: between(rand, 4, 8),
      food: 3,
      souls: between(rand, 5, 10),
      heal: rand() < 0.4 ? 40 : 0,
    };
  }
  if (tier === 'car') {
    return {
      wood: between(rand, 4, 8),
      stone: between(rand, 6, 10),
      beams: between(rand, 2, 4),
      food: 0,
      souls: between(rand, 3, 6),
      heal: rand() < 0.5 ? 40 : 0,
    };
  }
  return {
    wood: between(rand, 6, 12),
    stone: between(rand, 4, 8),
    beams: rand() < 0.3 ? 3 : 0,
    food: rand() < 0.5 ? 2 : 0,
    souls: 0,
    heal: 0,
  };
}

export function crateTier(distance) {
  return distance >= LOOT.rareDistance ? 'rare' : 'common';
}

// Short human-readable summary, e.g. "+12 wood +6 stone +5 souls"
export function lootLabel(loot) {
  return ['wood', 'stone', 'beams', 'souls']
    .filter((k) => loot[k] > 0)
    .map((k) => `+${loot[k]} ${k}`)
    .concat(loot.food > 0 ? [`+${loot.food} berries`] : [], loot.heal > 0 ? ['+MEDKIT'] : [])
    .join('  ');
}
