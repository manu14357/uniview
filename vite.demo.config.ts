import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Verify that pre-built worker files exist in demo/public/workers/.
 * These workers (dxf-parser-worker, libredwg-parser-worker, mtext-renderer-worker)
 * are pre-built and committed to the repo. This plugin just validates they're present.
 */
function verifyWorkers() {
  return {
    name: 'verify-cad-workers',
    buildStart() {
      const workersDir = resolve(__dirname, 'demo/public/workers');
      mkdirSync(workersDir, { recursive: true });

      const requiredWorkers = [
        'dxf-parser-worker.js',
        'libredwg-parser-worker.js',
        'mtext-renderer-worker.js',
      ];

      for (const worker of requiredWorkers) {
        if (!existsSync(resolve(workersDir, worker))) {
          console.warn(`[uniview-dwg] Missing worker: ${worker} in demo/public/workers/`);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), verifyWorkers()],
  root: resolve(__dirname, 'demo'),
  resolve: {
    alias: {
      'buffer': 'buffer/',
      'stream': 'stream-browserify',
      'events': 'events',
      'util': 'util',
      '@': resolve(__dirname, 'src'),
      '@uniview/viewer': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-viewer'),
      '@uniview/three-renderer': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-three-renderer'),
      '@uniview/svg-renderer': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-svg-renderer'),
      '@uniview/data-model': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-data-model'),
      '@uniview/dwg-converter': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-dwg-converter'),
      '@uniview/dwg-wasm': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-dwg-wasm'),
      '@uniview/common': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-common'),
      '@uniview/geometry': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-geometry'),
      '@uniview/graphics': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-graphics'),
      '@uniview/mtext-renderer': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-mtext-renderer'),
      '@uniview/viewcube': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-viewcube'),
      '@uniview/mtext-parser': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-mtext-parser'),
      '@uniview/shx-parser': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-shx-parser'),
      '@uniview/dxf-parser': resolve(__dirname, 'src/vendor/uniview-dwg/uniview-dxf-parser'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'stream-browserify', 'events', 'util'],
  },
  server: {
    port: 3000,
    open: true,
  },
  base: process.env.GITHUB_ACTIONS ? '/uniview/demo/' : '/',
  build: {
    outDir: resolve(__dirname, 'docs/demo'),
    emptyOutDir: true,
  },
  worker: {
    format: 'es',
  },
});
