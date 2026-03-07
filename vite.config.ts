import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      include: ['src'],
    }),
  ],
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
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UniView',
      formats: ['es', 'cjs'],
      fileName: (format) => `uniview.${format === 'es' ? 'esm' : 'cjs'}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
  },
  worker: {
    format: 'es',
  },
  test: {
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    globals: true,
  },
});
