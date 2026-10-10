// Loads pure (no DOM / no THREE) parts from src/parts into a sandboxed function so they can be unit-tested
// without ES modules or a bundler. Parts share one closure in the real app, so pass every part the code needs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const parts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/parts');

export function loadParts(files, exportNames) {
  const code = files.map((f) => fs.readFileSync(path.join(parts, f), 'utf8')).join('\n');
  const body = code + '\nreturn { ' + exportNames.join(', ') + ' };';
  return new Function('performance', 'console', 'window', body)(performance, { log() {}, warn() {}, error: console.error }, {});
}
