# Kerbalist Architecture Index

**Single-file SPA** — `index.html` only. No build step, no framework. Vanilla JS + Three.js (3D) + Chart.js (porkchop).

## File Map

```
index.html          4,315 lines / ~162 KB    Single-file SPA
CHANGELOG.md        ~300 lines              Version history
README.md           ~200 lines              Feature overview
ARCHITECTURE.md     this file               Codebase index & task router
```

## DOM Structure (HTML, lines ~1348–1551)

```
<div class="app">                          ← Root flex column
  <header>                                 ← Brand, UT clock, warp, live-sync
    .brand                                ← Logo + title
    .ut-clock                             ← UT display + input
    .live-sync-wrap                       ← kRPC2 / file-watch bridge
    .warp-controls                        ← 1x / 2x / 10x / 100x
  </header>

  <div class="main">                       ← Flex row: map + sidebar
    <div class="map-wrap" id="mapWrap">    ← 3D canvas area
      #mapCanvas                          ← Three.js WebGL canvas
      #labelContainer                     ← Planet/moon labels
      .map-hud                            ← Origin/dest chips
      .shortcuts-bubble                   ← Controls cheat sheet
      .zoom-controls                      ← Zoom +/−/reset
      .map-version                        ← v2.7 (clicks → changelog)
      .legend                             ← Color key
    </div>

    <div class="sidebar">                  ← Controls + results
      .select-row                         ← Origin / Swap / Destination
      .transfer-actions                   ← Plan / Swap / Clear buttons
      .tabs                               ← Transfer | Assists | Porkchop | Body Info
      .tab-panels
        #panel-transfer                   ← Results + Δv breakdown
        #panel-assists                    ← Gravity assist options
        #panel-porkchop                   ← Porkchop chart + heatmap
        #panel-info                       ← Body info cards
    </div>
  </div>

  <a class="support-btn-vp" ...>           ← Fixed viewport bottom-right
  <div class="changelog-overlay" ...>      ← Full changelog popup
  <div class="changelog-popup">            ← Scrollable modal
```

## CSS Sections (4 sections, ~900 lines)

| Lines | Section | Key classes |
|-------|---------|-------------|
| 15–62 | Reset, vars, body | `:root` color tokens |
| 64–396 | Header | `.brand`, `.ut-clock`, `.warp-controls`, `.live-btn`, `.live-panel` |
| 398–824 | Main layout | `.main`, `.map-wrap`, `.map-hud`, `.shortcuts-bubble`, `.zoom-controls`, `.map-version`, `.legend`, `.support-btn-vp`, `.changelog-overlay`, `.changelog-popup` |
| 826–1347 | Sidebar | `.sidebar`, `.select-row`, `.swap-btn`, `.card`, `.tabs`, `.tab`, `.tab-panels`, `.tab-panel`, `.transfer-actions`, `.placeholder`, `.stat-row`, `.big-num`, `.countdown`, `.phase-gauge`, `.mission-stepper`, `.assist-item`, `.info-title`, `.pk-canvas-wrap`, `.pk-controls` |

## JavaScript Sections (module, lines 1814–4312)

```
L1818  VERSION = 'v2.7'
L1827  DEG, DAY_SEC, YEAR_DAYS, YEAR_HOURS, MIN_DAY_A, MIN_MOON_A, SCALE, PARK_ALT, PI
L1879  PLANETS    — 7 planets derived from RAW_PLANETS
L1886  MOONS      — 11 moons derived from RAW_MOONS
L1893  BODY_OPTIONS — flat list of all selectable bodies

L1898  findBody(name)                → Body object
L1902  transferBodyFor(body)         → Heliocentric body (or parent)
L1906  getMoonMu(moon)               → Parent mu for moon capture
L1934  solveKepler(M, e)             → True anomaly via Newton-Raphson
L1945  stateAt(planet, t)            → {x, y, theta, nu, r, vx, vy} at UT
L2038  stumpC(z), stumpS(z)          → Stumpff functions
L2041  lambertSolve(r1, r2, tof, mu) → 2-body Lambert solver (Chamberlain)
L2091  buildLambertArcPoints(...)     → Arc points for rendering
L2133  utToDateString(ut)             → UT → "T+Yy, Dd, HH:MM:SS"
L2142  durationString(sec)            → seconds → "Xy, Dd HH:MM:SS"

L2158–2214  Three.js init
L2187  updateCamera()                → Spherical coords → camera pos
L2203  resetView()
L2214  resizeRenderer()
L2229  heliocentricDisplayScale(r)   → Logarithmic zoom with inner expansion
L2244  toWorld(x, y, incl)           → Heliocentric → Three.js world coords
L2303  buildOrbitLine(planet)        → Orbit line geometry
L2335  createDresRingTexture()       → Procedural ring texture for Dres
L2361  moonOrbitDisplayRadius(m)     → Scaled moon orbit radius
L2387  moonLocalPosition(m, t)       → Moon position relative to parent
L2400  bodyWorldPositionAt(body, t)  → Full world position with mesh+label

L2540  initTransferArc()             → Creates transfer arc THREE.Line
L2558  updateTransferArc()           → Animates along arc
L2627  initReturnTripOverlay()       → Return-to-Kerbin arc overlay
L2691  updateReturnTripOverlay()     → Update return arc
L2792  initAssistArcs()              → Gravity assist arc overlays
L2845  updateAssistArcs()            → Update assist arcs
L2980  initPhaseLines()              → Phase angle visualization
L3033  initGhost(dest)               → Arrival ghost (where dest will be)
L3065  updateGhostPosition()         → Animate ghost
L3097  updateMap()                   → Main render: positions + arcs + ghost + labels
L3111  worldToScreen(worldPos)       → 3D → 2D screen coords
L3122  updateLabels()                → Planet/moon label positions

L3343  refreshHud()                   ← Update HUD chips
L3357  switchTab(name)               ← Tab switching
L3411  setLiveStatus(msg, cls)       ← Live sync status
L3429  syncUtNow(newUt, label)       ← Update UT from bridge
L3442  pollBridge(url)               ← Fetch UT from kRPC2 bridge
L3481  readUtFromFile()              ← Parse save file for UT
L3551  refineFlightTimeForOpposition(...) → Bisection refinement

L3587  computeTransfer(o, d, tRef)   → ★ Core: full transfer calculation
L3679  detectPotentialAssists(...)    → Find gravity assist candidates
L3709  computeAssistTransfer(...)     → Solve assist transfer via two Lambert arcs
L3828  getReturnPlan(r)              → Return-to-Kerbin plan
L3880  renderTransferResults()       → Render transfer Δv breakdown UI
L3985  renderAssistOptions()          → Render assist options list
L4025  ejectionDiagramSvg(r)         → SVG diagram for ejection geometry
L4088  phaseGaugeSvg(c, req)         → Phase angle gauge SVG
L4110  showInfoFor(name)             → Body info card

L4139  resizePkCanvas()              ← Porkchop canvas sizing
L4144  generatePorkchop()            ← 42×42 Δv grid (lambertSolve × 1764)
L4204  drawPorkchop()                ← Render heatmap on canvas
L4254  loop(now)                     → Main animation frame loop
```

## Key Architecture Decisions

1. **Single file, no build step** — Everything in `index.html`. CSS in `<style>`, JS in `<script type="module">`. Edit and refresh.
2. **Three.js for 3D** — CDN-loaded. Custom log-scale display with inner orbit expansion (Duna→Jool region stretched).
3. **Patched-conic approximation** — Circular-coplanar orbits for planning; Lambert solver for precise arcs.
4. **kRPC2 bridge or manual input** — Two UT sync methods: live bridge (recommended) or save-file parsing.
5. **CSS custom properties** — All colors via `:root` variables for theming.
6. **No state management** — Global `currentResult`, `currentAssists`, `UT` variables. Simple and effective for a single-file app.

## What to Edit

- **Add/modify bodies** → `RAW_PLANETS` / `RAW_MOONS` arrays near L1830
- **Change constants** (SCALE, PARK_ALT, etc.) → L1827–1830
- **UI text** → HTML in `.sidebar` (L1423+) and `.map-wrap` (L1387+)
- **CSS** → Corresponding section in `<style>`
- **Core math** → `computeTransfer()` L3587, `lambertSolve()` L2041, `stateAt()` L1945
- **Rendering** → `updateMap()` L3097, `loop()` L4254, arc functions L2540+
- **Porkchop** → `generatePorkchop()` L4144, `drawPorkchop()` L4204
- **Version** → `VERSION` constant L1818, `index.html` L1408, `README.md`, `CHANGELOG.md`
