// Local persistence (high score + settings). Storage is injectable for tests and
// every access is guarded: private browsing / blocked storage must never crash the game.

const KEY_HIGH = 'pocketSurvival.highScore';
const KEY_MUTED = 'pocketSurvival.muted';

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getHighScore(storage = defaultStorage()) {
  try {
    const value = Number.parseInt(storage?.getItem(KEY_HIGH) ?? '0', 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

// Returns true when `score` is a new record (and stores it).
export function submitScore(score, storage = defaultStorage()) {
  const best = getHighScore(storage);
  if (!(score > best)) return false;
  try {
    storage?.setItem(KEY_HIGH, String(Math.floor(score)));
  } catch {
    // ignore — record just won't persist
  }
  return true;
}

export function getMuted(storage = defaultStorage()) {
  try {
    return storage?.getItem(KEY_MUTED) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted, storage = defaultStorage()) {
  try {
    storage?.setItem(KEY_MUTED, muted ? '1' : '0');
  } catch {
    // ignore
  }
}
