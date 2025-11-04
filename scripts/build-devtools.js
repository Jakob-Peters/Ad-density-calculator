#!/usr/bin/env node
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const entryPoint = resolve(projectRoot, 'src/devtools-entry.ts');
const outFile = resolve(projectRoot, 'dist/adscore-devtools.js');

async function main() {
  mkdirSync(dirname(outFile), { recursive: true });

  try {
    await build({
      entryPoints: [entryPoint],
      outfile: outFile,
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['es2020'],
      sourcemap: true,
      banner: {
        js: `/* AdScore DevTools bundle - ${(new Date()).toISOString()} */`
      }
    });

    console.log(`[build-devtools] Bundle created at ${outFile}`);
  } catch (error) {
    console.error('[build-devtools] Failed to build bundle');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
