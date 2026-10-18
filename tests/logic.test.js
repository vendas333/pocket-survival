import { describe, expect, it } from 'vitest';
import {
  availableEnemyTypes,
  computeScore,
  CYCLE_SECONDS,
  DAY_SECONDS,
  getCycle,
  getDifficulty,
  isBloodMoon,
  pickEnemyType,
} from '../src/logic/difficulty.js';
import {
  BASE_STATS,
  anyAffordable,
  buyUpgrade,
  computeStats,
  emptyLevels,
  getCost,
  UPGRADES,
} from '../src/logic/upgrades.js';
import { getHighScore, getMuted, setMuted, submitScore } from '../src/logic/storage.js';
import { BUILD_ORDER, BUILD_RECIPES, canPay, costLabel, pay } from '../src/logic/building.js';
import { eat, HUNGER, tickHunger } from '../src/logic/survival.js';
import { addXp, availableCards, cardModifiers, CARDS, rollCards, xpToNext } from '../src/logic/cards.js';
import { crateTier, lootLabel, rollLoot } from '../src/logic/loot.js';
import { addSouls, buyMeta, computeSouls, emptyMeta, loadMeta, metaCost, metaModifiers, saveMeta } from '../src/logic/meta.js';
import {
  applyDamage,
  centeredRect,
  chooseTarget,
  footprint,
  isFree,
  overlaps,
  separation,
  shouldChase,
  snap,
  validatePlacement,
} from '../src/logic/placement.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

describe('difficulty', () => {
  it('cycles day and night', () => {
    expect(getCycle(10)).toMatchObject({ day: 1, isNight: false, darkness: 0 });
    expect(getCycle(DAY_SECONDS + 20)).toMatchObject({ day: 1, isNight: true, darkness: 1 });
    expect(getCycle(DAY_SECONDS + 3).darkness).toBeCloseTo(0.5);
    expect(getCycle(CYCLE_SECONDS + 1)).toMatchObject({ day: 2, isNight: false });
  });

  it('nights are much harder than days', () => {
    const day = getDifficulty(30);
    const night = getDifficulty(DAY_SECONDS + 20);
    expect(night.isNight).toBe(true);
    expect(day.maxEnemies).toBeGreaterThan(0); // a few roaming zombies by day
    expect(night.maxEnemies).toBeGreaterThan(day.maxEnemies);
    expect(night.spawnInterval).toBeLessThan(day.spawnInterval);
  });

  it('gets harder every night', () => {
    const night1 = getDifficulty(DAY_SECONDS + 20);
    const night3 = getDifficulty(CYCLE_SECONDS * 2 + DAY_SECONDS + 20);
    expect(night3.spawnInterval).toBeLessThan(night1.spawnInterval);
    expect(night3.hpMultiplier).toBeGreaterThan(night1.hpMultiplier);
    expect(getDifficulty(-5)).toEqual(getDifficulty(0));
  });

  it('blood moon every 3rd night is harder', () => {
    expect(isBloodMoon(3)).toBe(true);
    expect(isBloodMoon(2)).toBe(false);
    const night3 = CYCLE_SECONDS * 2 + DAY_SECONDS + 20;
    expect(getCycle(night3).bloodMoon).toBe(true);
    expect(getCycle(CYCLE_SECONDS * 2 + 10).bloodMoon).toBe(false); // day 3 is safe
    const normal = getDifficulty(CYCLE_SECONDS + DAY_SECONDS + 20);
    expect(getDifficulty(night3).maxEnemies).toBeGreaterThan(normal.maxEnemies);
  });

  it('reports time until night and phase progress', () => {
    expect(getCycle(DAY_SECONDS - 10).untilNight).toBe(10);
    expect(getCycle(DAY_SECONDS / 2).progress).toBeCloseTo(0.5);
  });

  it('respects caps', () => {
    const extreme = getDifficulty(CYCLE_SECONDS * 1000 + DAY_SECONDS + 20);
    expect(extreme.spawnInterval).toBe(1400);
    expect(extreme.maxEnemies).toBe(20);
    expect(extreme.speedMultiplier).toBe(1);
  });

  it('runners only at night, brutes from day 2', () => {
    expect(availableEnemyTypes(10)).toEqual(['zombie']);
    expect(availableEnemyTypes(DAY_SECONDS + 10)).toEqual(['zombie', 'runner']);
    expect(availableEnemyTypes(CYCLE_SECONDS + DAY_SECONDS + 10)).toContain('brute');
    for (let i = 0; i < 50; i++) expect(pickEnemyType(10, () => i / 50)).toBe('zombie');
  });

  it('computes score from time and kills', () => {
    expect(computeScore(61.9, 40)).toBe(101);
  });
});

describe('upgrades', () => {
  it('cost scales with level and stops at max', () => {
    const c0 = getCost('damage', 0);
    const c1 = getCost('damage', 1);
    expect(c1.wood).toBeGreaterThan(c0.wood);
    expect(getCost('damage', UPGRADES.damage.maxLevel)).toBeNull();
    expect(getCost('nope', 0)).toBeNull();
  });

  it('buying spends resources without mutating input', () => {
    const levels = emptyLevels();
    const resources = { wood: 100, stone: 100 };
    const result = buyUpgrade('damage', levels, resources);
    expect(result.ok).toBe(true);
    expect(result.levels.damage).toBe(1);
    expect(result.resources.wood).toBe(100 - getCost('damage', 0).wood);
    expect(levels.damage).toBe(0);
    expect(resources.wood).toBe(100);
  });

  it('refuses when unaffordable', () => {
    const result = buyUpgrade('multishot', emptyLevels(), { wood: 1, stone: 1 });
    expect(result.ok).toBe(false);
    expect(anyAffordable(emptyLevels(), { wood: 0, stone: 0 })).toBe(false);
    expect(anyAffordable(emptyLevels(), { wood: 3, stone: 1 })).toBe(true);
  });

  it('derives stats from levels', () => {
    expect(computeStats(emptyLevels())).toEqual(BASE_STATS);
    const s = computeStats({ damage: 2, fireRate: 1, speed: 1, maxHp: 1, multishot: 2, harvest: 1 });
    expect(s.damage).toBe(3);
    expect(s.fireInterval).toBeLessThan(BASE_STATS.fireInterval);
    expect(s.speed).toBeGreaterThan(BASE_STATS.speed);
    expect(s.maxHp).toBe(120);
    expect(s.projectiles).toBe(3);
  });
});

describe('building', () => {
  it('walls are paid directly with wood', () => {
    expect(pay({ wood: 7 }, BUILD_RECIPES.wall.cost)).toEqual({ wood: 2 });
    expect(pay({ wood: 4 }, BUILD_RECIPES.wall.cost)).toBeNull();
    expect(BUILD_ORDER).not.toContain('beam');
  });

  it('beam recipe still converts wood (legacy)', () => {
    let res = { wood: 9, stone: 0, beams: 0 };
    for (let i = 0; i < 4; i++) {
      res = pay(res, BUILD_RECIPES.beam.cost);
      res.beams += 1;
    }
    expect(res).toEqual({ wood: 1, stone: 0, beams: 4 });
    expect(pay(res, BUILD_RECIPES.beam.cost)).toBeNull(); // only 1 wood left
    expect(pay(res, { beams: 4 }).beams).toBe(0);
    expect(res.beams).toBe(4); // not mutated
  });

  it('spikes need beams and stone', () => {
    expect(canPay({ wood: 4, stone: 1 }, BUILD_RECIPES.spikes.cost)).toBe(false);
    expect(canPay({ wood: 4, stone: 2 }, BUILD_RECIPES.spikes.cost)).toBe(true);
    expect(costLabel(BUILD_RECIPES.spikes.cost)).toBe('4 wood  2 stone');
  });
});

describe('survival', () => {
  it('hunger drains and starving hurts', () => {
    const a = tickHunger(100, 15);
    expect(a.hunger).toBeCloseTo(90);
    expect(a.damage).toBe(0);
    const b = tickHunger(1, 10);
    expect(b.hunger).toBe(0);
    expect(b.damage).toBeCloseTo(15);
  });

  it('eating is capped at max', () => {
    expect(eat(90, HUNGER.berryFood)).toBe(100);
    expect(eat(10, HUNGER.berryFood)).toBe(35);
  });

  it('every structure has a cost and stone walls are tougher', () => {
    for (const id of BUILD_ORDER) expect(Object.keys(BUILD_RECIPES[id].cost).length).toBeGreaterThan(0);
    expect(BUILD_RECIPES.stoneWall.hp).toBeGreaterThan(BUILD_RECIPES.wall.hp);
  });
});

describe('placement & collisions', () => {
  const base = { worldWidth: 1200, worldHeight: 1600, playerX: 600, playerY: 800 };

  it('snaps to the 24px grid', () => {
    expect(snap(611)).toBe(600);
    expect(snap(613)).toBe(624);
  });

  it('rotates the footprint for vertical walls', () => {
    expect(footprint(100, 100, 48, 18, 0)).toEqual({ x: 76, y: 91, w: 48, h: 18 });
    expect(footprint(100, 100, 48, 18, 90)).toEqual({ x: 91, y: 76, w: 18, h: 48 });
  });

  it('walls side by side are allowed, overlapping ones are not', () => {
    const a = footprint(600, 860, 48, 18, 0);
    const touching = footprint(648, 860, 48, 18, 0);
    const half = footprint(624, 860, 48, 18, 0);
    expect(overlaps(a, touching)).toBe(false);
    expect(overlaps(a, half)).toBe(true);
    expect(validatePlacement({ ...base, area: touching, blockers: [a] })).toBe('');
    expect(validatePlacement({ ...base, area: half, blockers: [a] })).toBe('Space is blocked');
  });

  it('cannot build on the player, a zombie or a tree', () => {
    const player = centeredRect(600, 812, 20, 12);
    const zombie = centeredRect(700, 812, 24, 20);
    const tree = { x: 584, y: 900, w: 16, h: 12 };
    expect(validatePlacement({ ...base, area: footprint(600, 816, 48, 18, 0), blockers: [player] })).toBe('Space is blocked');
    expect(validatePlacement({ ...base, area: footprint(696, 816, 48, 18, 0), blockers: [zombie] })).toBe('Space is blocked');
    expect(validatePlacement({ ...base, area: footprint(600, 904, 18, 48, 90), blockers: [tree] })).toBe('Space is blocked');
  });

  it('rejects far away or out of the world', () => {
    expect(validatePlacement({ ...base, area: footprint(900, 800, 48, 18, 0) })).toBe('Too far away');
    expect(validatePlacement({ ...base, playerX: 10, playerY: 10, area: footprint(10, 10, 48, 18, 0) })).toBe('Cannot build here');
  });

  it('structures break when hp runs out', () => {
    expect(applyDamage(60, 5)).toEqual({ hp: 55, destroyed: false });
    expect(applyDamage(4, 5)).toEqual({ hp: 0, destroyed: true });
  });

  it('spawn points must be free', () => {
    const wall = footprint(600, 860, 48, 18, 0);
    expect(isFree(centeredRect(600, 860, 24, 20), [wall])).toBe(false);
    expect(isFree(centeredRect(700, 860, 24, 20), [wall])).toBe(true);
  });

  it('crowd separation pushes zombies apart without exceeding length 1', () => {
    const a = { x: 100, y: 100 };
    const push = separation(a, [a, { x: 110, y: 100 }], 22);
    expect(push.x).toBeLessThan(0);
    expect(push.y).toBe(0);
    const crowd = [a, { x: 101, y: 100 }, { x: 100, y: 101 }, { x: 101, y: 101 }];
    expect(Math.hypot(...Object.values(separation(a, crowd, 22)))).toBeLessThanOrEqual(1.0001);
    expect(separation(a, [a, { x: 200, y: 200 }], 22)).toEqual({ x: 0, y: 0 });
  });

  it('at night the horde goes for the camp unless the player is close', () => {
    expect(chooseTarget({ isNight: true, campAlive: true, distanceToPlayer: 400 })).toBe('camp');
    expect(chooseTarget({ isNight: true, campAlive: true, distanceToPlayer: 100 })).toBe('player');
    expect(chooseTarget({ isNight: true, campAlive: false, distanceToPlayer: 400 })).toBe('player');
    expect(chooseTarget({ isNight: false, campAlive: true, distanceToPlayer: 400 })).toBe('player');
  });

  it('day zombies chase only once seen, night zombies always', () => {
    expect(shouldChase({ isNight: false, onScreen: false, aggro: false })).toBe(false);
    expect(shouldChase({ isNight: false, onScreen: true, aggro: false })).toBe(true);
    expect(shouldChase({ isNight: true, onScreen: false, aggro: false })).toBe(true);
  });
});

describe('meta progression (souls)', () => {
  it('souls come from kills, nights and blood moons', () => {
    expect(computeSouls({ kills: 10, nightsSurvived: 2, bloodMoonsSurvived: 1 })).toBe(10 + 30 + 25);
    expect(computeSouls({})).toBe(0);
  });

  it('buying spends souls, grows cost and respects max level', () => {
    let meta = addSouls(emptyMeta(), 100);
    expect(meta.runs).toBe(1);
    meta = buyMeta(meta, 'vitality'); // 30
    expect(meta.souls).toBe(70);
    expect(metaCost('vitality', 1)).toBe(60);
    expect(buyMeta({ ...meta, souls: 10 }, 'vitality')).toBeNull();
    const maxed = { ...meta, souls: 9999, levels: { ...meta.levels, sharpshooter: 2 } };
    expect(buyMeta(maxed, 'sharpshooter')).toBeNull();
  });

  it('upgrades turn into run modifiers', () => {
    const m = metaModifiers({ vitality: 2, sharpshooter: 1, startWood: 3, toughWalls: 2, forager: 1 });
    expect(m.maxHpBonus).toBe(30);
    expect(m.damageBonus).toBe(1);
    expect(m.startWood).toBe(30);
    expect(m.structureHpMultiplier).toBe(1.5);
    expect(m.hungerMultiplier).toBeCloseTo(0.85);
    expect(metaModifiers({}).structureHpMultiplier).toBe(1);
  });

  it('saves and loads, surviving broken storage', () => {
    const storage = memoryStorage();
    const meta = buyMeta(addSouls(emptyMeta(), 50), 'startWood');
    saveMeta(meta, storage);
    expect(loadMeta(storage)).toEqual(meta);
    const broken = { getItem: () => '{oops', setItem: () => { throw new Error('x'); } };
    expect(loadMeta(broken)).toEqual(emptyMeta());
    expect(() => saveMeta(meta, broken)).not.toThrow();
  });
});

describe('loot', () => {
  const seq = (...values) => {
    let i = 0;
    return () => values[i++ % values.length];
  };

  it('far crates are rare and give souls, near ones do not', () => {
    expect(crateTier(200)).toBe('common');
    expect(crateTier(500)).toBe('rare');
    const rare = rollLoot('rare', seq(0));
    const common = rollLoot('common', seq(0.99));
    expect(rare.souls).toBeGreaterThan(0);
    expect(common.souls).toBe(0);
    expect(rare.wood).toBeGreaterThanOrEqual(12);
  });

  it('rolls stay inside their ranges', () => {
    for (let i = 0; i < 200; i++) {
      const l = rollLoot('common');
      expect(l.wood).toBeGreaterThanOrEqual(6);
      expect(l.wood).toBeLessThanOrEqual(12);
      const c = rollLoot('car');
      expect(c.stone).toBeGreaterThanOrEqual(6);
      expect(c.stone).toBeLessThanOrEqual(10);
    }
  });

  it('labels loot for the pop-up', () => {
    expect(lootLabel({ wood: 5, stone: 0, beams: 0, souls: 3, food: 2, heal: 40 })).toBe('+5 wood  +3 souls  +2 berries  +MEDKIT');
  });
});

describe('level-up cards', () => {
  it('xp levels you up, carrying the leftover', () => {
    expect(xpToNext(1)).toBe(7);
    expect(addXp(1, 0, 5)).toEqual({ level: 1, xp: 5, levelsGained: 0 });
    expect(addXp(1, 5, 3)).toEqual({ level: 2, xp: 1, levelsGained: 1 });
    expect(addXp(1, 0, 7 + 10 + 3).levelsGained).toBe(2); // 7 then 10
  });

  it('offers 3 distinct cards you do not have maxed', () => {
    const owned = { multi: CARDS.multi.max, mason: CARDS.mason.max };
    for (let i = 0; i < 100; i++) {
      const picks = rollCards(owned);
      expect(picks).toHaveLength(3);
      expect(new Set(picks).size).toBe(3);
      expect(picks).not.toContain('multi');
      expect(picks).not.toContain('mason');
    }
  });

  it('offers fewer cards when almost everything is maxed', () => {
    const owned = Object.fromEntries(Object.entries(CARDS).map(([id, c]) => [id, c.max]));
    owned.sharp = 0;
    expect(rollCards(owned)).toEqual(['sharp']);
    expect(availableCards(owned)).toEqual(['sharp']);
  });

  it('cards stack into modifiers', () => {
    const m = cardModifiers({ sharp: 2, quick: 1, multi: 1, pierce: 2, explode: 1, crit: 2, mason: 1 });
    expect(m.damage).toBe(2);
    expect(m.fireIntervalMultiplier).toBeCloseTo(0.85);
    expect(m.projectiles).toBe(1);
    expect(m.pierce).toBe(2);
    expect(m.explodeDamage).toBe(2);
    expect(m.critChance).toBeCloseTo(0.3);
    expect(m.structureHpMultiplier).toBeCloseTo(1.4);
    expect(cardModifiers({}).speedMultiplier).toBe(1);
  });
});

describe('storage', () => {
  it('stores only new high scores', () => {
    const storage = memoryStorage();
    expect(getHighScore(storage)).toBe(0);
    expect(submitScore(50, storage)).toBe(true);
    expect(submitScore(30, storage)).toBe(false);
    expect(submitScore(50, storage)).toBe(false);
    expect(getHighScore(storage)).toBe(50);
  });

  it('survives broken or missing storage', () => {
    const broken = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    expect(getHighScore(broken)).toBe(0);
    expect(submitScore(10, broken)).toBe(true);
    expect(getHighScore(null)).toBe(0);
    expect(getMuted(broken)).toBe(false);
  });

  it('persists mute setting', () => {
    const storage = memoryStorage();
    setMuted(true, storage);
    expect(getMuted(storage)).toBe(true);
  });
});
