# Source parts

`index.html` is these files joined in this order (see `tools/manifest.json`). Edit a part, then run `npm run build`.

| # | File | Lines | What is in it |
|---|------|------:|---------------|
| 1 | `010-head.html` | 13 | undefined |
| 2 | `020-css-base.css` | 60 | undefined |
| 3 | `021-css-header.css` | 134 | undefined |
| 4 | `022-css-calendar-modal.css` | 531 | undefined |
| 5 | `023-css-layout-hud.css` | 414 | undefined |
| 6 | `024-css-bugreport-modal.css` | 577 | undefined |
| 7 | `025-css-changelog-modal.css` | 217 | undefined |
| 8 | `026-css-origindest-labels.css` | 246 | undefined |
| 9 | `027-css-sidebar.css` | 552 | undefined |
| 10 | `028-css-porkchop-info-splash-responsive.css` | 469 | undefined |
| 11 | `029-css-hud-widgets.css` | 238 | undefined |
| 12 | `030-css-stats-overlay.css` | 64 | undefined |
| 13 | `031-css-vessel-hud.css` | 185 | telemetry bridge: vessel labels, filter panel, active-vessel HUD |
| 14 | `100-html-shell.html` | 148 | undefined |
| 15 | `101-html-sidebar.html` | 135 | undefined |
| 16 | `102-html-changelog-modal.html` | 636 | undefined |
| 17 | `200-js-changelog-modal.js` | 40 | undefined |
| 18 | `201-js-bugreport-modal-captcha.js` | 143 | undefined |
| 19 | `202-js-bugreport-screenshots.js` | 271 | undefined |
| 20 | `203-js-bugreport-submit-dragdrop.js` | 157 | undefined |
| 21 | `300-html-script-boundary.html` | 3 | undefined |
| 22 | `310-js-00-boot-splash.js` | 31 | undefined |
| 23 | `311-js-01-data.js` | 109 | undefined |
| 24 | `312-js-02-orbital-mechanics.js` | 194 | undefined |
| 25 | `313-js-03-sim-clock.js` | 32 | undefined |
| 26 | `314-js-04a-scene-setup.js` | 223 | undefined |
| 27 | `315-js-04b-coordinates-bodies.js` | 144 | undefined |
| 28 | `316-js-04c-ghosts-raycaster.js` | 135 | undefined |
| 29 | `317-js-04d-transfer-return-arcs.js` | 255 | undefined |
| 30 | `318-js-04e-assist-arcs.js` | 192 | undefined |
| 31 | `319-js-04f-phase-lines-ghost.js` | 129 | undefined |
| 32 | `320-js-04g-map-update-labels.js` | 148 | undefined |
| 33 | `321-js-04h-camera-controls.js` | 288 | undefined |
| 34 | `322-js-04i-mobile-map.js` | 113 | undefined |
| 35 | `323-js-05a-ui-setup-tabs.js` | 151 | undefined |
| 36 | `324-js-05b-calendar.js` | 241 | undefined |
| 37 | `325-js-05c-live-sync.js` | 117 | undefined |
| 38 | `326-js-06a-transfer-math.js` | 288 | undefined |
| 39 | `327-js-06b-assists-clear.js` | 158 | undefined |
| 40 | `328-js-06c-return-render-results.js` | 250 | undefined |
| 41 | `329-js-06d-svg-diagrams.js` | 72 | undefined |
| 42 | `330-js-07-info-panel.js` | 26 | undefined |
| 43 | `331-js-08-porkchop.js` | 120 | undefined |
| 44 | `331a-js-08a-bridge-frame.js` | 51 | pure maths: fit telemetry-bridge axes to the analytic model |
| 45 | `331b-js-08b-bridge-live.js` | 212 | telemetry bridge WebSocket client; bridge body positions; LIVE sync UT |
| 46 | `331c-js-08c-vessel-layer.js` | 204 | vessel markers, filter panel and active-vessel HUD (bridge) |
| 47 | `332-js-09-main-loop.js` | 108 | undefined |
| 48 | `333-js-10-hud-widgets.js` | 213 | undefined |
| 49 | `334-js-11-hud-transfer-widgets.js` | 135 | undefined |
| 50 | `335-js-12-stats-overlay.js` | 130 | undefined |
| 51 | `900-html-calendar-modal.html` | 64 | undefined |
| 52 | `901-html-bugreport-modal.html` | 103 | undefined |

`classic` parts (200-203) are one plain `<script>`; `module` parts (310-332) are the app's `<script type="module">` and share a single closure, so they can call each other's functions freely but must keep their order.
