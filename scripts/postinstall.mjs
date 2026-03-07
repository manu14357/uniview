#!/usr/bin/env node

/**
 * univiewer postinstall script
 * Automatically copies worker files and WASM binary to the consuming project's public/workers/ directory.
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Workers source directory (inside the npm package)
const workersSource = resolve(__dirname, '..', 'workers');

// Find the consuming project's root by walking up from node_modules
function findProjectRoot() {
  let dir = resolve(__dirname, '..');
  // Walk up until we exit node_modules
  while (dir.includes('node_modules')) {
    dir = resolve(dir, '..');
  }
  return dir;
}

// Skip if running in the univiewer repo itself (dev mode)
if (existsSync(resolve(__dirname, '..', 'src', 'core', 'UniView.tsx'))) {
  process.exit(0);
}

// Skip if workers source doesn't exist
if (!existsSync(workersSource)) {
  console.warn('[univiewer] Workers directory not found in package. Skipping setup.');
  process.exit(0);
}

const projectRoot = findProjectRoot();
const targetDir = join(projectRoot, 'public', 'workers');

// Create target directory
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

// Copy all worker files
const files = readdirSync(workersSource);
let copied = 0;

for (const file of files) {
  const src = join(workersSource, file);
  const dest = join(targetDir, file);
  try {
    copyFileSync(src, dest);
    copied++;
  } catch (err) {
    console.warn(`[univiewer] Failed to copy ${file}: ${err.message}`);
  }
}

if (copied > 0) {
  console.log(`[univiewer] ✓ Copied ${copied} worker files to public/workers/`);
}
