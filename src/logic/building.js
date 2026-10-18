// Simple building: wood -> beams -> structures (pure, unit-tested).
// kind: 'craft' (makes a resource) | 'wall' (blocks everyone) | 'door' (blocks zombies only)
//       'trap' (hurts zombies) | 'fire' (light + healing)

export const BUILD_RECIPES = {
  beam: { name: 'Beam', desc: 'Saw 2 wood into a beam', icon: 'beam', kind: 'craft', cost: { wood: 2 }, gives: 'beams' },
  wall: { name: 'Wooden Wall', desc: 'Blocks zombies until broken', icon: 'wall', kind: 'wall', cost: { wood: 5 }, hp: 60 },
  stoneWall: { name: 'Stone Wall', desc: 'Much tougher than wood', icon: 'stoneWall', kind: 'wall', cost: { stone: 6 }, hp: 350 },
  door: { name: 'Door', desc: 'You walk through, zombies do not', icon: 'door', kind: 'door', cost: { wood: 6 }, hp: 50 },
  spikes: { name: 'Spike Trap', desc: 'Hurts zombies that step on it', icon: 'spikes', kind: 'trap', cost: { wood: 4, stone: 2 }, hp: 40 },
  campfire: { name: 'Campfire', desc: 'Light at night, slowly heals', icon: 'campfire', kind: 'fire', cost: { wood: 4, stone: 3 }, hp: 30 },
};

// For now you only build traps and fires; walls come from the camp palisade
export const BUILD_ORDER = ['spikes', 'campfire'];

// Touching walls: wood repairs, stone upgrades wood -> stone
export const WALL_CARE = {
  repairPerWood: 12, // hp restored per wood spent
  repairEveryMs: 250,
  upgradeCost: 4, // stone
  upgradeMs: 1200, // hold contact this long to upgrade
};

// One repair tick: spends 1 wood if the wall is damaged. Returns { hp, wood, repaired }
export function repairTick(hp, maxHp, wood) {
  if (hp >= maxHp || wood <= 0) return { hp, wood, repaired: false };
  return { hp: Math.min(maxHp, hp + WALL_CARE.repairPerWood), wood: wood - 1, repaired: true };
}

// A wooden wall at full health can be upgraded with stone
export function canUpgradeWall(id, hp, maxHp, stone) {
  return id === 'wall' && hp >= maxHp && stone >= WALL_CARE.upgradeCost;
}

export function canPay(resources, cost) {
  return Object.entries(cost).every(([key, amount]) => (resources[key] ?? 0) >= amount);
}

// Returns new resources after paying (or null if unaffordable). Never mutates input.
export function pay(resources, cost) {
  if (!canPay(resources, cost)) return null;
  const next = { ...resources };
  for (const [key, amount] of Object.entries(cost)) next[key] -= amount;
  return next;
}

export function costLabel(cost) {
  return Object.entries(cost)
    .map(([key, amount]) => `${amount} ${key}`)
    .join('  ');
}
