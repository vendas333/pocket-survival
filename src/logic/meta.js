// Permanent progression between runs: souls + upgrades (pure; storage is injectable).

const KEY = 'pocketSurvival.meta';

export const META_UPGRADES = {
  vitality: { name: 'Vitality', desc: '+15 max HP', icon: 'icon_heart', maxLevel: 5, baseCost: 30 },
  sharpshooter: { name: 'Sharpshooter', desc: '+1 damage', icon: 'icon_damage', maxLevel: 2, baseCost: 80 },
  startWood: { name: 'Woodpile', desc: 'Start with +10 wood', icon: 'icon_axe', maxLevel: 3, baseCost: 25 },
  startStone: { name: 'Stone Cache', desc: 'Start with +8 stone', icon: 'icon_multi', maxLevel: 3, baseCost: 25 },
  toughWalls: { name: 'Reinforced', desc: '+25% structure HP', icon: 'icon_fire', maxLevel: 3, baseCost: 40 },
  forager: { name: 'Forager', desc: 'Hunger drains 15% slower', icon: 'icon_speed', maxLevel: 3, baseCost: 35 },
};

export const META_ORDER = ['vitality', 'sharpshooter', 'startWood', 'startStone', 'toughWalls', 'forager'];

export function emptyMeta() {
  return { souls: 0, totalSouls: 0, runs: 0, levels: Object.fromEntries(META_ORDER.map((id) => [id, 0])) };
}

// Souls earned at the end of a run
export function computeSouls({ kills = 0, nightsSurvived = 0, bloodMoonsSurvived = 0 }) {
  return kills + nightsSurvived * 15 + bloodMoonsSurvived * 25;
}

export function metaCost(id, level) {
  const def = META_UPGRADES[id];
  if (!def || level >= def.maxLevel) return null;
  return def.baseCost * (level + 1);
}

// Returns a new meta object (or null if it can't be bought)
export function buyMeta(meta, id) {
  const level = meta.levels[id] ?? 0;
  const cost = metaCost(id, level);
  if (cost === null || meta.souls < cost) return null;
  return { ...meta, souls: meta.souls - cost, levels: { ...meta.levels, [id]: level + 1 } };
}

export function addSouls(meta, souls) {
  return { ...meta, souls: meta.souls + souls, totalSouls: meta.totalSouls + souls, runs: meta.runs + 1 };
}

// Modifiers applied at the start of every run
export function metaModifiers(levels = {}) {
  const l = (id) => levels[id] ?? 0;
  return {
    maxHpBonus: 15 * l('vitality'),
    damageBonus: l('sharpshooter'),
    startWood: 10 * l('startWood'),
    startStone: 8 * l('startStone'),
    structureHpMultiplier: 1 + 0.25 * l('toughWalls'),
    hungerMultiplier: Math.pow(0.85, l('forager')),
  };
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadMeta(storage = defaultStorage()) {
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? 'null');
    if (!raw || typeof raw !== 'object') return emptyMeta();
    const base = emptyMeta();
    return {
      souls: Number(raw.souls) || 0,
      totalSouls: Number(raw.totalSouls) || 0,
      runs: Number(raw.runs) || 0,
      levels: { ...base.levels, ...(raw.levels ?? {}) },
    };
  } catch {
    return emptyMeta();
  }
}

export function saveMeta(meta, storage = defaultStorage()) {
  try {
    storage?.setItem(KEY, JSON.stringify(meta));
  } catch {
    // ignore — progress just won't persist
  }
}
