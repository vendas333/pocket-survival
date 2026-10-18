// Simple building: wood -> beams -> structures (pure, unit-tested).
// kind: 'craft' (makes a resource) | 'wall' (blocks everyone) | 'door' (blocks zombies only)
//       'trap' (hurts zombies) | 'fire' (light + healing)

export const BUILD_RECIPES = {
  beam: { name: 'Beam', desc: 'Saw 2 wood into a beam', icon: 'beam', kind: 'craft', cost: { wood: 2 }, gives: 'beams' },
  wall: { name: 'Wooden Wall', desc: 'Blocks zombies until broken', icon: 'wall', kind: 'wall', cost: { beams: 4 }, hp: 60 },
  stoneWall: { name: 'Stone Wall', desc: 'Much tougher than wood', icon: 'stoneWall', kind: 'wall', cost: { stone: 6 }, hp: 160 },
  door: { name: 'Door', desc: 'You walk through, zombies do not', icon: 'door', kind: 'door', cost: { beams: 5 }, hp: 50 },
  spikes: { name: 'Spike Trap', desc: 'Hurts zombies that step on it', icon: 'spikes', kind: 'trap', cost: { beams: 3, stone: 2 }, hp: 40 },
  campfire: { name: 'Campfire', desc: 'Light at night, slowly heals', icon: 'campfire', kind: 'fire', cost: { wood: 4, stone: 3 }, hp: 30 },
};

export const BUILD_ORDER = ['beam', 'wall', 'stoneWall', 'door', 'spikes', 'campfire'];

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
