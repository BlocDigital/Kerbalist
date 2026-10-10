# Source parts

`index.html` is these files joined in this order (see `tools/manifest.json`). Edit a part, then run `npm run build`.

| # | File | Lines | What is in it |
|---|------|------:|---------------|
| 1 | `010-head.html` | 13 | doctype, <head>, opening <style> |
| 2 | `020-css-base.css` | 60 | CSS variables, reset, breakpoints |
| 3 | `021-css-header.css` | 134 | header bar, UT clock, warp buttons |
| 4 | `022-css-calendar-modal.css` | 531 | Kerbol calendar modal styles |
| 5 | `023-css-layout-hud.css` | 414 | main layout, map HUD, bottom-left bar, camera HUD |
| 6 | `024-css-bugreport-modal.css` | 577 | bug report modal, screenshot cards, captcha styles |
| 7 | `025-css-changelog-modal.css` | 217 | changelog modal styles |
| 8 | `026-css-origindest-labels.css` | 246 | origin/dest HUD, legend, 3D labels |
| 9 | `027-css-sidebar.css` | 409 | sidebar, tabs, cards, stat rows |
| 10 | `028-css-porkchop-info-splash-responsive.css` | 469 | porkchop, info panel, splash, tablet/mobile media queries |
| 11 | `029-css-hud-widgets.css` | 237 | HUD widgets: draggable, resizable, pinnable transfer info containers |
| 12 | `100-html-shell.html` | 158 | </style>, <body>, splash, header, map area, HUD elements |
| 13 | `101-html-sidebar.html` | 125 | sidebar markup (tabs, results containers) |
| 14 | `102-html-changelog-modal.html` | 616 | changelog modal markup (LARGE static HTML - do not open) + opening <script> |
| 15 | `200-js-changelog-modal.js` | 40 | classic script: show/hideChangelog + map legend toggle |
| 16 | `201-js-bugreport-modal-captcha.js` | 143 | classic script: showBugReportModal + captcha |
| 17 | `202-js-bugreport-screenshots.js` | 271 | classic script: Option 1 capture / Option 2 upload / clipboard |
| 18 | `203-js-bugreport-submit-dragdrop.js` | 157 | classic script: hide modal, submit to GitHub, drag/drop/paste |
| 19 | `300-html-script-boundary.html` | 3 | </script> + opening <script type=module> |
| 20 | `310-js-00-boot-splash.js` | 31 | module: THREE import, VERSION, splash |
| 21 | `311-js-01-data.js` | 109 | module: physical data (planets, moons) |
| 22 | `312-js-02-orbital-mechanics.js` | 194 | module: Kepler / Lambert / orbital math |
| 23 | `313-js-03-sim-clock.js` | 32 | module: simulation clock (UT, warp) |
| 24 | `314-js-04a-scene-setup.js` | 214 | module: scene, camera, renderer, scale, orbit lines |
| 25 | `315-js-04b-coordinates-bodies.js` | 141 | module: moonLocalPosition, bodyWorldPositionAt, body meshes |
| 26 | `316-js-04c-ghosts-raycaster.js` | 135 | module: orbital ghost planets, raycaster |
| 27 | `317-js-04d-transfer-return-arcs.js` | 255 | module: transfer arc + return trip overlays |
| 28 | `318-js-04e-assist-arcs.js` | 192 | module: gravity assist arcs |
| 29 | `319-js-04f-phase-lines-ghost.js` | 129 | module: phase lines + ghost marker |
| 30 | `320-js-04g-map-update-labels.js` | 140 | module: updateMap, worldToScreen, updateLabels |
| 31 | `321-js-04h-camera-controls.js` | 302 | module: mouse/touch camera controls, context menu, controls bubble tracking |
| 32 | `322-js-04i-mobile-map.js` | 113 | module: mobile map/controls toggle |
| 33 | `323-js-05a-ui-setup-tabs.js` | 84 | module: dropdown setup, HUD sync, tabs |
| 34 | `324-js-05b-calendar.js` | 241 | module: Kerbol calendar modal logic |
| 35 | `325-js-05c-live-sync.js` | 131 | module: live sync (bridge / save file) |
| 36 | `326-js-06a-transfer-math.js` | 288 | module: computeTransfer, window solver, exact (Lambert) transfer, ejection burn point |
| 37 | `327-js-06b-assists-clear.js` | 158 | module: assist detection, clearTransfer |
| 38 | `328-js-06c-return-render-results.js` | 202 | module: return plan, renderTransferResults, assist list |
| 39 | `329-js-06d-svg-diagrams.js` | 72 | module: ejection diagram + phase gauge SVG |
| 40 | `330-js-07-info-panel.js` | 26 | module: planet info panel |
| 41 | `331-js-08-porkchop.js` | 120 | module: porkchop plot |
| 42 | `332-js-09-main-loop.js` | 99 | module: main animation loop |
| 43 | `333-js-10-hud-widgets.js` | 126 | module: HUD widget system (drag, resize, pin, localStorage state) |
| 44 | `334-js-11-hud-transfer-widgets.js` | 131 | module: transfer results integration (pin buttons, live updates) |
| 45 | `900-html-calendar-modal.html` | 64 | </script> + calendar modal markup |
| 46 | `901-html-bugreport-modal.html` | 103 | bug report modal markup + </body></html> |

`classic` parts (200-203) are one plain `<script>`; `module` parts (310-332) are the app's `<script type="module">` and share a single closure, so they can call each other's functions freely but must keep their order.
