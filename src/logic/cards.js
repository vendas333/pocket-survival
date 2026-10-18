// Level-up cards: XP from kills, pick 1 of 3 random cards (pure; rand is injectable).

export const XP_PER_KILL = { zombie: 1, runner: 2, brute: 6 };

// XP needed to go from `level` to `level + 1`
export function xpToNext(level) {
  return 4 + level * 3;
}

// Adds xp; returns { level, xp, levelsGained }
export function addXp(level, xp, amount) {
  let l = level;
  let x = xp + amount;
  let gained = 0;
  while (x >= xpToNext(l)) {
    x -= xpToNext(l);
    l += 1;
    gained += 1;
  }
  return { level: l, xp: x, levelsGained: gained };
}

// rarity: 'common' | 'rare' (rare cards show up less often)
export const CARDS = {
  sharp: { name: 'Sharp Stones', desc: '+1 damage', icon: 'icon_damage', max: 5, rarity: 'common' },
  quick: { name: 'Quick Hands', desc: 'Throw 15% faster', icon: 'icon_fire', max: 5, rarity: 'common' },
  multi: { name: 'Sling Spread', desc: '+1 stone per throw', icon: 'icon_multi', max: 3, rarity: 'rare' },
  pierce: { name: 'Piercing Throw', desc: 'Stones go through +1 zombie', icon: 'icon_damage', max: 3, rarity: 'rare' },
  vitality: { name: 'Tough Skin', desc: '+25 max HP and heal 25', icon: 'icon_heart', max: 5, rarity: 'common' },
  boots: { name: 'Light Boots', desc: '+12% move speed', icon: 'icon_speed', max: 3, rarity: 'common' },
  regen: { name: 'Second Wind', desc: 'Regenerate 1 HP per second', icon: 'icon_heart', max: 3, rarity: 'rare' },
  explode: { name: 'Volatile Dead', desc: 'Killed zombies explode', icon: 'icon_fire', max: 3, rarity: 'rare' },
  lumber: { name: 'Lumberjack', desc: '+1 wood/stone per gather', icon: 'icon_axe', max: 2, rarity: 'common' },
  magnet: { name: 'Magnet', desc: 'Pick up items from further', icon: 'icon_multi', max: 2, rarity: 'common' },
  crit: { name: 'Headshot', desc: '15% chance of triple damage', icon: 'icon_damage', max: 3, rarity: 'rare' },
  eagle: { name: 'Eagle Eye', desc: '+20% throw range', icon: 'icon_speed', max: 3, rarity: 'common' },
  mason: { name: 'Mason', desc: 'Structures +40% HP, repair by day', icon: 'icon_axe', max: 2, rarity: 'rare' },
  bloodlust: { name: 'Bloodlust', desc: 'Heal 1 HP per kill', icon: 'icon_heart', max: 3, rarity: 'common' },
};

const WEIGHT = { common: 3, rare: 1.4 };

export function availableCards(owned) {
  return Object.keys(CARDS).filter((id) => (owned[id] ?? 0) < CARDS[id].max);
}

// Picks up to `count` distinct cards, weighted by rarity
export function rollCards(owned, rand = Math.random, count = 3) {
  const pool = availableCards(owned);
  const picks = [];
  while (picks.length < count && pool.length > 0) {
    const total = pool.reduce((sum, id) => sum + WEIGHT[CARDS[id].rarity], 0);
    let roll = rand() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= WEIGHT[CARDS[pool[i]].rarity];
      if (roll < 0) {
        index = i;
        break;
      }
    }
    picks.push(pool[index]);
    pool.splice(index, 1);
  }
  return picks;
}

// Turns owned cards into modifiers used by the game
export function cardModifiers(owned = {}) {
  const n = (id) => owned[id] ?? 0;
  return {
    damage: n('sharp'),
    fireIntervalMultiplier: Math.pow(0.85, n('quick')),
    projectiles: n('multi'),
    pierce: n('pierce'),
    maxHp: 25 * n('vitality'),
    speedMultiplier: 1 + 0.12 * n('boots'),
    regen: n('regen'),
    explodeDamage: 2 * n('explode'),
    gatherBonus: n('lumber'),
    pickupBonus: 60 * n('magnet'),
    critChance: 0.15 * n('crit'),
    rangeMultiplier: 1 + 0.2 * n('eagle'),
    structureHpMultiplier: 1 + 0.4 * n('mason'),
    repairPerSecond: n('mason'),
    healPerKill: n('bloodlust'),
  };
}
