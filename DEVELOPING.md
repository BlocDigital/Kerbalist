# Developing Kerbalist

`index.html` is **generated**. The source of truth is `src/parts/` — 43 small files (none over ~600 lines; every JavaScript part is under ~300) that are joined end to end, in the order listed in `tools/manifest.json`, into the single `index.html` that GitHub Pages serves. Users still download and open one file.

```
npm run build     # src/parts/*  ->  index.html
npm run check     # JS syntax + physics tests + "index.html is up to date"   (CI runs this)
npm run report    # list parts with line counts
```

Needs Node 18+. No dependencies to install.

## Day to day

1. Find the code: `grep -ln "functionName" src/parts/*` (or see `src/INDEX.md`).
2. Edit that part.
3. `npm run build && npm run check`, open `index.html` in a browser.
4. Commit **both** the part and the regenerated `index.html`. CI fails if they disagree.

## Layout

| Parts | What |
|-------|------|
| `010`, `100`–`102`, `300`, `900`–`901` `.html` | Page markup. `010` ends with the opening `<style>`, `100` starts with `</style>`; the `<script>` tags live in the HTML parts, never in the `.js` parts. |
| `020`–`028` `.css` | Styles, in cascade order. |
| `200`–`203` `.js` | Plain `<script>`: changelog/legend toggles, bug report (captcha, screenshots, GitHub issue). |
| `310`–`332` `.js` | The app: `<script type="module">`. Data → orbital mechanics → clock → 3D map → UI → transfer maths → results → main loop. |

## Rules for the module parts (310–332)

- They share **one closure**: just call functions and use variables from any other module part. Do **not** add `import`/`export` between parts or wrap a part in its own function.
- **Order matters** for top-level `const`/`let` (a `const` must be defined above the code that runs it at start-up). Function declarations can be used from anywhere.
- Keep `.js` parts free of `<script>` tags.

## Adding or splitting a part

Create `src/parts/NNN-name.js`, add it to `tools/manifest.json` at the right position with a `kind` (`html`, `css`, `classic`, `module`) and a one-line `desc`, then `npm run index` to refresh `src/INDEX.md`. The build refuses to run if a file in `src/parts/` is not in the manifest, so it can't be silently left out.

## Tests (`test/pin.test.mjs`)

Plain `node --test`, no framework. `test/load-parts.mjs` loads the pure-maths parts (no DOM, no Three.js) so they can be tested directly. They check physics rather than implementation: Kepler's equation, vis-viva, Lambert, that the transfer window is the same time whenever you ask and rolls to the next window only after it has passed, that the ejection burn point sends the ship the right way (numerical integration), and that a ship flown on the planner's departure velocity actually arrives at the destination planet.

To test another part, add it to a `loadParts([...], ['names', 'to', 'export'])` call. If it throws `X is not defined`, add the part that defines `X`.

## Optional: run the real app headless

`test/e2e/smoke.py` opens `index.html` in Chromium (Python + Playwright: `pip install playwright && playwright install chromium`), plans transfers through the real UI and warps time through a window to watch the countdown open and roll over. Three.js normally comes from a CDN, so the script serves `test/e2e/three-stub.js`, a tiny stand-in that lets the app's own logic run without rendering. It tests behaviour, not graphics — still look at the map yourself.

## Releasing

1. Bump `version` in `package.json` (`4.0.0` shows in the app as `v4.0`; `4.0.1` as `v4.0.1`).
2. Change the version in the five places the app shows it (`npm test` fails and names any you miss): the badge in `100-html-shell.html`, the footer in `102-html-changelog-modal.html`, `203-js-bugreport-submit-dragdrop.js`, `310-js-00-boot-splash.js`, `901-html-bugreport-modal.html`.
3. Add the entry to **both** `CHANGELOG.md` (repo root, not in `src/`) and the popup in `102-html-changelog-modal.html`. They are separate copies; the popup does not read the `.md`. The test checks the popup's newest heading matches the version.
4. `npm run build && npm run check`, commit parts and `index.html`.

## Good to know

- **Line endings** are mixed (CRLF/LF) from earlier edits. The build joins bytes exactly, so this has no effect; don't mass-convert them or `index.html` will change everywhere.
- **Model limits**: transfers are flat (coplanar). Duna and Eve are fine; Moho (7°) and Eeloo (6°) won't intercept exactly. The return-trip estimate uses the quick circular-orbit numbers.
- GitHub Pages serves the root `index.html`, so keep it committed.
