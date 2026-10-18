import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { defineConfig } from 'vite';

// Generates dist/sw.js after the build with the exact list of output files to precache,
// so the game works fully offline after the first visit.
function serviceWorkerPlugin() {
  let outDir = 'dist';
  return {
    name: 'pocket-survival-sw',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files = [];
      const walk = (dir) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(relative(outDir, full).split(sep).join('/'));
        }
      };
      walk(outDir);
      // Relative URLs: resolved against the SW location, so it works on any sub-path (GitHub Pages).
      const precache = ['./', ...files.filter((f) => f !== 'sw.js')];
      const version = `ps-${Date.now()}`;
      const sw = `// Generated at build time â€” do not edit.
const CACHE = '${version}';
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Network first for the page (gets updates), cached shell when offline.
    event.respondWith(fetch(request).catch(() => caches.match('index.html').then((r) => r || caches.match('./'))));
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    }))
  );
});
`;
      writeFileSync(join(outDir, 'sw.js'), sw);
      console.log(`[sw] precaching ${precache.length} files (${version})`);
    },
  };
}

export default defineConfig({
  // Relative base: the same build works at / and at /<repo>/ on GitHub Pages.
  base: './',
  plugins: [serviceWorkerPlugin()],
  build: {
    chunkSizeWarningLimit: 1600, // Phaser is ~1.2 MB minified
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
