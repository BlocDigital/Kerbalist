#!/usr/bin/env node
// index.html is generated: it is src/parts/* joined end to end, in the order listed in tools/manifest.json.
//   node tools/build.mjs            build ./index.html
//   node tools/build.mjs --verify   exit 1 if ./index.html is not exactly what the parts build (used by CI)
//   node tools/build.mjs --syntax   syntax-check the JavaScript parts
//   node tools/build.mjs --report   list parts with size
//   node tools/build.mjs --index    rewrite src/INDEX.md
//   node tools/build.mjs --out FILE build somewhere else
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const partsDir = path.join(root, 'src/parts');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/manifest.json'), 'utf8'));
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const fail = (msg) => { console.error('FAIL: ' + msg); process.exit(1); };
const read = (p) => fs.readFileSync(path.join(partsDir, p.file));

// every manifest entry must exist, and every file in src/parts must be in the manifest
const listed = new Set(manifest.parts.map((p) => p.file));
for (const p of manifest.parts) if (!fs.existsSync(path.join(partsDir, p.file))) fail(`src/parts/${p.file} is listed in tools/manifest.json but missing`);
const orphans = fs.readdirSync(partsDir).filter((f) => !listed.has(f));
if (orphans.length) fail(`not in tools/manifest.json (so NOT in the build): ${orphans.join(', ')}`);

const built = () => Buffer.concat(manifest.parts.map(read));

if (has('--report') || has('--index')) {
  const rows = manifest.parts.map((p) => { const t = read(p).toString('utf8'); return { p, n: t.split('\n').length, tok: Math.round(t.length / 3.5) }; });
  if (has('--report')) {
    for (const r of rows) console.log(String(r.n).padStart(5) + ' lines  ~' + String(r.tok).padStart(6) + ' tok  ' + r.p.file.padEnd(46) + r.p.desc);
  }
  if (has('--index')) {
    const md = ['# Source parts', '', '`index.html` is these files joined in this order (see `tools/manifest.json`). Edit a part, then run `npm run build`.', '',
      '| # | File | Lines | What is in it |', '|---|------|------:|---------------|',
      ...rows.map((r, i) => `| ${i + 1} | \`${r.p.file}\` | ${r.n} | ${r.p.desc} |`), '',
      '`classic` parts (200-203) are one plain `<script>`; `module` parts (310-332) are the app\'s `<script type="module">` and share a single closure, so they can call each other\'s functions freely but must keep their order.', ''].join('\n');
    fs.writeFileSync(path.join(root, 'src/INDEX.md'), md);
    console.log('wrote src/INDEX.md');
  }
  process.exit(0);
}

if (has('--syntax')) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kerbalist-'));
  let bad = 0;
  for (const [kind, ext] of [['classic', 'js'], ['module', 'mjs']]) {
    const code = manifest.parts.filter((p) => p.kind === kind).map((p) => read(p).toString('utf8')).join('');
    const f = path.join(tmp, `${kind}.${ext}`);
    fs.writeFileSync(f, code);
    try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); console.log(`syntax OK  ${kind} script`); }
    catch (e) { bad++; console.error(`syntax FAIL ${kind} script\n` + String(e.stderr).split('\n').slice(0, 8).join('\n')); }
  }
  process.exit(bad ? 1 : 0);
}

const out = built();
if (has('--verify')) {
  const cur = fs.existsSync(path.join(root, 'index.html')) ? fs.readFileSync(path.join(root, 'index.html')) : Buffer.alloc(0);
  if (Buffer.compare(cur, out) !== 0) fail('index.html is out of date with src/parts. Run `npm run build` and commit index.html.');
  console.log('OK: index.html matches src/parts');
  process.exit(0);
}
const oi = args.indexOf('--out');
const outPath = oi !== -1 ? path.resolve(args[oi + 1]) : path.join(root, 'index.html');
fs.writeFileSync(outPath, out);
console.log(`built ${path.relative(root, outPath) || outPath}  ${out.length} bytes  (${manifest.parts.length} parts)`);
