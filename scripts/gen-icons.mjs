// Generates the PWA / home-screen icons as PNG files from the game's own pixel art.
// Pure Node (zlib only) — no image libraries or external assets.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { PALETTE, SPRITES } from '../src/gfx/sprites.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// --- minimal PNG encoder ----------------------------------------------------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, getPixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = getPixel(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- icon artwork (pixel grid) -------------------------------------------------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function buildGrid(gridSize, artOffset) {
  const grid = [];
  for (let y = 0; y < gridSize; y++) {
    const row = [];
    for (let x = 0; x < gridSize; x++) {
      const ay = y - artOffset;
      row.push(ay >= 13 ? '#3e8948' : '#29366f');
    }
    grid.push(row);
  }
  const put = (x, y, color) => {
    const gx = x + artOffset;
    const gy = y + artOffset;
    if (gx >= 0 && gy >= 0 && gx < gridSize && gy < gridSize) grid[gy][gx] = color;
  };
  // stars + moon
  [[2, 2], [7, 1], [11, 4], [3, 7]].forEach(([x, y]) => put(x, y, '#f4f4f4'));
  [[14, 1], [15, 1], [13, 2], [14, 2], [15, 2], [16, 2], [14, 3], [15, 3]].forEach(([x, y]) => put(x, y, '#ffcd75'));
  // grass highlights
  [[1, 15], [6, 17], [16, 16], [12, 18]].forEach(([x, y]) => put(x, y, '#a7f070'));
  // hero
  SPRITES.player0.forEach((line, y) => {
    [...line].forEach((ch, x) => {
      if (PALETTE[ch]) put(x + 4, y + 5, PALETTE[ch]);
    });
  });
  return grid;
}

function writeIcon(file, size, gridSize, artOffset) {
  const grid = buildGrid(gridSize, artOffset);
  const cell = size / gridSize;
  const png = encodePNG(size, (x, y) => hex(grid[Math.min(gridSize - 1, Math.floor(y / cell))][Math.min(gridSize - 1, Math.floor(x / cell))]));
  writeFileSync(join(outDir, file), png);
  console.log(`icon: public/icons/${file} (${size}x${size})`);
}

writeIcon('icon-192.png', 192, 20, 0);
writeIcon('icon-512.png', 512, 20, 0);
writeIcon('apple-touch-icon.png', 180, 20, 0);
// Maskable: art kept inside the central safe zone
writeIcon('icon-maskable-512.png', 512, 26, 3);
