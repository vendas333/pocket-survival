// Tiny synthesised sound effects with the Web Audio API (no audio files needed).

import { getMuted, setMuted } from '../logic/storage.js';

let ctx = null;
let master = null;
let muted = getMuted();

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.35;
  master.connect(ctx.destination);
  return ctx;
}

// Must be called from a user gesture (iOS/Android autoplay rules).
export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  setMuted(muted);
  if (master) master.gain.value = muted ? 0 : 0.35;
  return muted;
}

function tone({ freq = 440, to = null, dur = 0.1, type = 'square', vol = 0.3, delay = 0 }) {
  if (muted) return;
  const c = ensureContext();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.12, vol = 0.25, delay = 0 }) {
  if (muted) return;
  const c = ensureContext();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + delay;
  const length = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(gain).connect(master);
  src.start(t0);
}

export const sfx = {
  shoot: () => tone({ freq: 880, to: 440, dur: 0.06, vol: 0.08 }),
  hit: () => tone({ freq: 220, to: 110, dur: 0.07, vol: 0.18 }),
  enemyDie: () => {
    noise({ dur: 0.12, vol: 0.18 });
    tone({ freq: 300, to: 60, dur: 0.15, type: 'sawtooth', vol: 0.12 });
  },
  chop: () => noise({ dur: 0.05, vol: 0.15 }),
  pickup: () => {
    tone({ freq: 660, dur: 0.05, vol: 0.12 });
    tone({ freq: 990, dur: 0.07, vol: 0.12, delay: 0.05 });
  },
  heal: () => {
    tone({ freq: 523, dur: 0.08, type: 'triangle', vol: 0.2 });
    tone({ freq: 784, dur: 0.12, type: 'triangle', vol: 0.2, delay: 0.08 });
  },
  hurt: () => tone({ freq: 160, to: 70, dur: 0.18, type: 'sawtooth', vol: 0.22 }),
  upgrade: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.09, vol: 0.15, delay: i * 0.07 }));
  },
  click: () => tone({ freq: 600, dur: 0.04, vol: 0.1 }),
  wave: () => tone({ freq: 196, to: 392, dur: 0.3, type: 'triangle', vol: 0.18 }),
  gameOver: () => {
    [392, 330, 262, 196].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.22, delay: i * 0.18 }));
  },
};
