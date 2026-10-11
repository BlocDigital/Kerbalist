# Kerbalist — Project Instructions

**Kerbalist** is a single-file vanilla JS SPA (`index.html` ~360 KB) for planning interplanetary transfers in Kerbal Space Program 2. It uses Three.js (CDN) for the 3D orbital map and Chart.js for porkchop plots. Users download and open one file — **`index.html` is generated** from 47 small parts in `src/parts/` joined by `tools/manifest.json`.

## Commands (Node 18+, no `npm install`)

| Command | What |
|---------|------|
| `npm run build` | Join all parts → `index.html` |
| `npm run check` | JS syntax + physics pin tests + verify `index.html` is up to date (CI runs this) |
| `npm run test` | Physics pin tests only (`node --test test/pin.test.mjs`) |
| `npm run report` | Line/token counts per part |
| `npm run index` | Regenerate `src/INDEX.md` from `tools/manifest.json` |

## Layout

| Prefix | Kind | Role |
|--------|------|------|
| `010`–`102`, `300`, `900`–`901` `.html` | html | Page markup. `<style>` split across 010 (open) and 100 (close). `<script>` tags live in HTML parts. |
| `020`–`030` `.css` | css | Styles, cascade order from manifest. |
| `200`–`203` `.js` | classic | One plain `<script>`: changelog toggle, bug report (captcha, screenshots, GitHub issue). |
| `310`–`335` `.js` | module | App: data → orbital mechanics → clock → scene (14 sub-parts) → UI → transfer math → porkchop → HUD widgets → main loop. |

All module parts share **one closure** — no `import`/`export` between parts. Order matters for top-level `const`/`let`. Function declarations are hoisted.

## How to change code

1. Find the part: `grep -ln "functionName" src/parts/*` or check `src/INDEX.md`.
2. Edit that part.
3. `npm run build && npm run check`, open `index.html` in a browser.
4. **Commit both the part and the regenerated `index.html`.** CI (`check.yml`) fails if they disagree.

Adding a part: create `src/parts/NNN-name.js`, add it to `tools/manifest.json` (with `kind` and `desc`), then `npm run index`. The build refuses if a file is not in the manifest.

## Tests

- `test/pin.test.mjs` — pure-math physics tests (Kepler, vis-viva, Lambert, ejection geometry, exact transfer verification via numerical integration). Uses `test/load-parts.mjs` to stitch parts into a sandboxed `Function`.
- E2E smoke test: `test/e2e/smoke.py` (Python + Playwright + Chromium; serves `three-stub.js` for Three.js). `pip install playwright && playwright install chromium`.

## Releasing

1. Bump `version` in `package.json`.
2. Update version in **five** locations: `100-html-shell.html`, `102-html-changelog-modal.html`, `203-js-bugreport-submit-dragdrop.js`, `310-js-00-boot-splash.js`, `901-html-bugreport-modal.html` (`npm test` names any you miss).
3. Add entry to **both** `CHANGELOG.md` (repo root) and `102-html-changelog-modal.html` (separate copy; the popup does not read the `.md`).
4. `npm run build && npm run check`, commit parts + `index.html`.

## Pitfalls

- **`index.html` is generated.** Never hand-edit it — edits are lost on next `npm run build`. Edit `src/parts/*` instead.
- **Mixed line endings (CRLF/LF).** The build joins bytes verbatim. Do NOT mass-convert line endings or `index.html` will change everywhere.
- **Manifest is the gate.** Every file in `src/parts/` must be in `tools/manifest.json` and vice versa. Orphan files cause build failure.
- **Module order matters.** `const`/`let` must be defined above code that uses them at startup. Functions are fine anywhere.
- **Three.js from CDN.** Headless tests use `test/e2e/three-stub.js` as a stand-in. Opening `index.html` directly requires internet (or a local Three.js mirror).
- **Model limits:** transfers are flat (coplanar). Moho (7°) and Eeloo (6°) won't intercept exactly. Return-trip estimates use circular-orbit approximations.
- **Each `.js` part must stay under ~300 lines.** The original refactor split at this size.
