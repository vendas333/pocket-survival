// Upgrades — definitions, costs and derived player stats (pure).

export const BASE_STATS = {
  damage: 1,
  fireInterval: 650, // ms between auto-shots
  speed: 95, // px/s
  maxHp: 100,
  projectiles: 1,
  harvestInterval: 420, // ms between harvest hits
  range: 170,
};

export const UPGRADES = {
  damage: { name: 'Sharp Stones', desc: '+1 damage', icon: 'icon_damage', maxLevel: 10, cost: { wood: 4, stone: 4 } },
  fireRate: { name: 'Quick Hands', desc: 'Shoot 12% faster', icon: 'icon_fire', maxLevel: 8, cost: { wood: 5, stone: 2 } },
  speed: { name: 'Light Boots', desc: '+10% move speed', icon: 'icon_speed', maxLevel: 6, cost: { wood: 3, stone: 1 } },
  maxHp: { name: 'Tough Skin', desc: '+20 max HP, heal 20', icon: 'icon_heart', maxLevel: 8, cost: { wood: 3, stone: 3 } },
  multishot: { name: 'Sling Spread', desc: '+1 projectile', icon: 'icon_multi', maxLevel: 3, cost: { wood: 10, stone: 8 } },
  harvest: { name: 'Stone Axe', desc: 'Harvest 20% faster', icon: 'icon_axe', maxLevel: 5, cost: { wood: 2, stone: 3 } },
};

export const UPGRADE_ORDER = ['damage', 'fireRate', 'multishot', 'maxHp', 'speed', 'harvest'];

export function emptyLevels() {
  return Object.fromEntries(Object.keys(UPGRADES).map((id) => [id, 0]));
}

// Cost grows 55% per level, rounded up.
export function getCost(id, level) {
  const def = UPGRADES[id];
  if (!def || level >= def.maxLevel) return null;
  const factor = Math.pow(1.55, level);
  return {
    wood: Math.ceil(def.cost.wood * factor),
    stone: Math.ceil(def.cost.stone * factor),
  };
}

export function canAfford(resources, cost) {
  return !!cost && resources.wood >= cost.wood && resources.stone >= cost.stone;
}

// Attempts to buy; returns { ok, resources, levels } without mutating inputs.
export function buyUpgrade(id, levels, resources) {
  const cost = getCost(id, levels[id] ?? 0);
  if (!canAfford(resources, cost)) return { ok: false, resources, levels };
  return {
    ok: true,
    resources: { ...resources, wood: resources.wood - cost.wood, stone: resources.stone - cost.stone },
    levels: { ...levels, [id]: (levels[id] ?? 0) + 1 },
  };
}

export function computeStats(levels) {
  const l = { ...emptyLevels(), ...levels };
  return {
    damage: BASE_STATS.damage + l.damage,
    fireInterval: Math.round(BASE_STATS.fireInterval * Math.pow(0.88, l.fireRate)),
    speed: Math.round(BASE_STATS.speed * (1 + 0.1 * l.speed)),
    maxHp: BASE_STATS.maxHp + 20 * l.maxHp,
    projectiles: BASE_STATS.projectiles + l.multishot,
    harvestInterval: Math.round(BASE_STATS.harvestInterval * Math.pow(0.8, l.harvest)),
    range: BASE_STATS.range,
  };
}

export function anyAffordable(levels, resources) {
  return UPGRADE_ORDER.some((id) => canAfford(resources, getCost(id, levels[id] ?? 0)));
}
