/**
 * Vite config to build the three vendor web workers that @uniview/viewer
 * expects at runtime:
 *   - dxf-parser-worker.js
 *   - libredwg-parser-worker.js
 *   - mtext-renderer-worker.js
 *
 * Run: npx vite build --config vite.workers.config.ts
 * Output: demo/public/workers/
 */
import { defineConfig, type Plugin } from 'vite';
import { resolve, dirname, join } from 'path';
import { existsSync } from 'fs';

/**
 * Replaces `import.meta.url` in the Emscripten glue code with a
 * worker-safe expression.  Rollup's default IIFE transform rewrites
 * import.meta.url to `document.currentScript.src`, but `document` is
 * not available inside Web Workers.
 *
 * Also strips Node.js-only dynamic imports that Rollup can't resolve.
 */
function workerImportMetaPlugin(): Plugin {
  return {
    name: 'worker-import-meta-fix',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('libredwg-web')) return null;
      let result = code;
      // Replace import.meta.url with a worker-safe expression
      result = result.replace(
        /import\.meta\.url/g,
        "(typeof self !== 'undefined' && self.location ? self.location.href : '')",
      );
      // Strip the Node.js dynamic import that can't be bundled for workers
      result = result.replace(
        /await import\("node:module"\)/g,
        '({})',
      );
      if (result !== code) {
        return { code: result, map: null };
      }
      return null;
    },
  };
}

const vendorBase = resolve(__dirname, 'src/vendor/uniview-dwg');

/** Shared alias map so vendor packages can import each other. */
const aliases: Record<string, string> = {
  'buffer': 'buffer/',
  'stream': 'stream-browserify',
  'events': 'events',
  'util': 'util',
  '@uniview/viewer': resolve(vendorBase, 'uniview-viewer'),
  '@uniview/three-renderer': resolve(vendorBase, 'uniview-three-renderer'),
  '@uniview/svg-renderer': resolve(vendorBase, 'uniview-svg-renderer'),
  '@uniview/data-model': resolve(vendorBase, 'uniview-data-model'),
  '@uniview/dwg-converter': resolve(vendorBase, 'uniview-dwg-converter'),
  '@uniview/dwg-wasm': resolve(vendorBase, 'uniview-dwg-wasm'),
  '@uniview/common': resolve(vendorBase, 'uniview-common'),
  '@uniview/geometry': resolve(vendorBase, 'uniview-geometry'),
  '@uniview/graphics': resolve(vendorBase, 'uniview-graphics'),
  '@uniview/mtext-renderer': resolve(vendorBase, 'uniview-mtext-renderer'),
  '@uniview/viewcube': resolve(vendorBase, 'uniview-viewcube'),
  '@uniview/mtext-parser': resolve(vendorBase, 'uniview-mtext-parser'),
  '@uniview/shx-parser': resolve(vendorBase, 'uniview-shx-parser'),
  '@uniview/dxf-parser': resolve(vendorBase, 'uniview-dxf-parser'),
};

/**
 * The vendor .js files use shortened directory imports, e.g.:
 *   export * from './database'   →  should resolve to  ./uniview-database/index.js
 *   export * from './classes'    →  should resolve to  ./uniview-classes/index.js
 *   import x from '../converter/utils' → ../uniview-converter/utils.js
 *
 * This plugin resolves those by trying `uniview-<name>` prefixed paths.
 */
function vendorDirectoryResolver(): Plugin {
  return {
    name: 'vendor-directory-resolver',
    resolveId(source, importer) {
      if (!importer || !importer.includes('uniview-dwg')) return null;
      if (!source.startsWith('./') && !source.startsWith('../')) return null;

      const dir = dirname(importer);
      const absTarget = resolve(dir, source);

      // If the file exists directly (with .js), let Vite handle it
      if (existsSync(`${absTarget}.js`) || existsSync(absTarget)) return null;

      // Split path parts to find which segment might need `uniview-` prefix
      const parts = source.split('/');
      // Try prefixing each non-leading part with 'uniview-'
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '.' || parts[i] === '..') continue;
        const prefixed = [...parts];
        prefixed[i] = `uniview-${prefixed[i]}`;
        const prefixedPath = resolve(dir, prefixed.join('/'));

        // Try as file
        if (existsSync(`${prefixedPath}.js`)) return `${prefixedPath}.js`;
        // Try as directory with index.js
        if (existsSync(join(prefixedPath, 'index.js'))) return join(prefixedPath, 'index.js');
      }

      // Try just as directory/index.js without prefix
      const dirIndex = join(absTarget, 'index.js');
      if (existsSync(dirIndex)) return dirIndex;

      return null;
    },
  };
}

/**
 * Build three separate self-contained worker bundles.
 * Rollup's inlineDynamicImports option requires a single input,
 * so we export an array of three builds — one per worker.
 */
const workers: Array<{ name: string; entry: string }> = [
  {
    name: 'dxf-parser-worker',
    entry: resolve(
      vendorBase,
      'uniview-data-model/uniview-converter/uniview-worker/uniview-db-dxf-parser-worker.ts',
    ),
  },
  {
    name: 'libredwg-parser-worker',
    entry: resolve(
      vendorBase,
      'uniview-dwg-converter/uniview-db-libre-dwg-parser-worker.ts',
    ),
  },
  {
    name: 'mtext-renderer-worker',
    entry: resolve(
      vendorBase,
      'uniview-mtext-renderer/uniview-worker/uniview-mtext-worker.ts',
    ),
  },
];

/**
 * Build the worker specified by the WORKER_INDEX env variable (0, 1, or 2).
 * Usage: WORKER_INDEX=0 npx vite build --config vite.workers.config.ts
 *
 * Or build all three by calling the npm script.
 */
const idx = parseInt(process.env.WORKER_INDEX ?? '0', 10);
const worker = workers[idx] ?? workers[0];

export default defineConfig({
  plugins: [workerImportMetaPlugin(), vendorDirectoryResolver()],
  resolve: {
    alias: aliases,
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  define: { global: 'globalThis' },
  build: {
    outDir: resolve(__dirname, 'demo/public/workers'),
    emptyOutDir: idx === 0, // Only clear on first worker
    rollupOptions: {
      input: worker.entry,
      output: {
        entryFileNames: `${worker.name}.js`,
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    minify: 'terser',
    target: 'es2020',
    sourcemap: false,
  },
});
