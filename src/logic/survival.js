// Hunger (pure, unit-tested).

export const HUNGER = {
  max: 100,
  perSecond: 100 / 150, // empty after 2.5 minutes
  starveDamagePerSecond: 1.5,
  berryFood: 25,
  berryHeal: 5,
};

// Advances hunger by dt seconds. Returns { hunger, damage } (damage only when starving).
export function tickHunger(hunger, dt) {
  const next = Math.max(0, hunger - HUNGER.perSecond * dt);
  return { hunger: next, damage: next === 0 ? HUNGER.starveDamagePerSecond * dt : 0 };
}

export function eat(hunger, food) {
  return Math.min(HUNGER.max, hunger + food);
}
