// Placement, collision rectangles and structure damage (pure, unit-tested).
// Rectangles are { x, y, w, h } with x/y = top-left corner.

export const GRID = 24;
export const MAX_BUILD_DISTANCE = 140;

export function snap(value, grid = GRID) {
  return Math.round(value / grid) * grid;
}

export function centeredRect(cx, cy, w, h) {
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

// Strict overlap (touching edges do not count, so walls can sit side by side)
export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Width/height of a structure after rotation (0 = horizontal, 90 = vertical)
export function rotatedSize(w, h, angle) {
  return angle === 90 ? { w: h, h: w } : { w, h };
}

export function footprint(cx, cy, w, h, angle) {
  const size = rotatedSize(w, h, angle);
  return centeredRect(cx, cy, size.w, size.h);
}

/**
 * Returns '' when the structure can be placed, otherwise a short reason.
 * blockers: rectangles of walls, obstacles, zombies and the player.
 */
export function validatePlacement({ area, worldWidth, worldHeight, playerX, playerY, blockers = [], maxDistance = MAX_BUILD_DISTANCE }) {
  if (area.x < 0 || area.y < 0 || area.x + area.w > worldWidth || area.y + area.h > worldHeight) return 'Cannot build here';
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  if (Math.hypot(cx - playerX, cy - playerY) > maxDistance) return 'Too far away';
  if (blockers.some((b) => overlaps(area, b))) return 'Space is blocked';
  return '';
}

export function applyDamage(hp, amount) {
  const next = Math.max(0, hp - amount);
  return { hp: next, destroyed: next <= 0 };
}

export function isFree(area, blockers) {
  return !blockers.some((b) => overlaps(area, b));
}

// Soft crowd separation: a push vector (length <= 1) away from neighbours closer than `radius`.
// Works on anything with x/y (Phaser sprites or plain objects).
export function separation(self, others, radius) {
  let x = 0;
  let y = 0;
  for (const o of others) {
    if (o === self || o.active === false) continue;
    const dx = self.x - o.x;
    const dy = self.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d > 0 && d < radius) {
      const strength = (radius - d) / radius;
      x += (dx / d) * strength;
      y += (dy / d) * strength;
    }
  }
  const len = Math.hypot(x, y);
  return len > 1 ? { x: x / len, y: y / len } : { x, y };
}

// Day zombies only chase once they have been seen; at night everyone hunts.
export function shouldChase({ isNight, onScreen, aggro }) {
  return Boolean(isNight || aggro || onScreen);
}
