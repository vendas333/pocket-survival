import { describe, expect, it } from 'vitest';
import {
  availableEnemyTypes,
  computeScore,
  CYCLE_SECONDS,
  DAY_SECONDS,
  getCycle,
  getDifficulty,
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
    expect(night.spawnInterval).toBeLessThan(day.spawnInterval);
    expect(night.maxEnemies).toBeGreaterThan(day.maxEnemies);
  });

  it('gets harder every night', () => {
    const night1 = getDifficulty(DAY_SECONDS + 20);
    const night3 = getDifficulty(CYCLE_SECONDS * 2 + DAY_SECONDS + 20);
    expect(night3.spawnInterval).toBeLessThan(night1.spawnInterval);
    expect(night3.hpMultiplier).toBeGreaterThan(night1.hpMultiplier);
    expect(getDifficulty(-5)).toEqual(getDifficulty(0));
  });

  it('respects caps', () => {
    const extreme = getDifficulty(CYCLE_SECONDS * 1000 + DAY_SECONDS + 20);
    expect(extreme.spawnInterval).toBe(300);
    expect(extreme.maxEnemies).toBe(80);
    expect(extreme.speedMultiplier).toBe(1.6);
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
