# Changelog

All notable changes to Kerbalist will be documented in this file.

## [3.7.0] - 2026-09-25

### Added

- **Bug Report Feature**: New 🐛 button in the bottom-left corner (next to the changelog version badge) opens a modal form for submitting bug reports directly to GitHub. Users can describe the bug, attach a screenshot (PNG/JPG/GIF, max 5MB), and the issue opens pre-filled on GitHub with all context included. No backend required — entirely client-side.
- **Screenshot Support in Bug Reports**: File upload with both click-to-browse and drag-and-drop support. Screenshots are converted to base64 and embedded in the GitHub issue body as inline markdown images so developers see the bug context immediately.
- **HUD Layout Reorganization**: Repositioned all on-map HUD elements to eliminate overlap with the sidebar and improve visual hierarchy:
  - **Top-left**: Origin/Destination dropdowns (new HUD panel, fully synced with sidebar)
  - **Top-right**: Keyboard shortcuts and warp controls
  - **Middle-right**: Camera HUD (zoom %, tilt, rotation, focus)
  - **Bottom-right**: Zoom controls (+/− buttons, reset), Map legend
  - All elements properly spaced and no longer hidden behind the sidebar

### Changed

- **Sidebar Origin/Dest Dropdowns**: Now fully synced with new top-left HUD dropdowns. Changes in either location update both in real time. Swap button (⇄) works identically in both places.
- **HUD Styling**: Added orange color variable (`--orange: #ff8c3c`) and applied consistent styling across all new HUD elements to match existing design language.

### Technical Details

- Bug report form validates file type (must be image/*) and size (max 5MB) before upload
- Screenshots converted to data URIs and embedded in GitHub issue markdown: `![filename](data:image/png;base64,...)`
- HUD positioning changed from sidebar-width-offset calculations to flush-edge positioning (`right: 16px`, `left: 16px`)
- Origin/Dest HUD dropdowns synced via JavaScript event listeners

## [3.6.6] - 2026-09-22

### Fixed

- **Map View Off-Center (Not a Camera Bug)**: `.map-wrap` had `position: fixed; inset: 0;` — almost certainly a leftover from the v3.6.5 UI relocation work — which made it span the entire browser window instead of just the space left after the sidebar. The 3D scene itself was rendering correctly centered on its own camera target; what was visible was only the left portion of a full-window-wide canvas, with the sidebar painting over the rest, so the Sun and planets appeared shifted well right of the actual center of the visible map area. Restored `.map-wrap` to `position: relative; flex: 1 1 auto; min-width: 0;` so it's a normal flex child of `.main` again, sized to the space actually available. All other map overlays (`.zoom-controls`, `.legend`, `#labelContainer`, `.map-hud`) already used `position: absolute` and re-anchor correctly now that their positioned ancestor is sized properly again — no other changes were needed.

## [3.6.5] - 2026-09-16

### Added

- **Live Camera HUD**: Added a subtle, semi-transparent real-time info HUD displaying camera position (X, Y, Z), zoom radius, focused celestial body, and orbital time warp level.
- **Orbital Ghost Planet Halos**: Added faint ghost spheres (sized matching departure ghost spheres, radius 6.5) of matching planet color that fade out when zooming in close (97% zoom, threshold `camR < 75`) or when focusing near a body.

### Changed

- **UI Button Scaling & Layout**:
  - Reduced "Buy me a beer" and "Changelog" button sizes by 25%.
  - Placed "Set Time" and "Live Sync" buttons side-by-side on a single row across desktop and mobile layouts.
  - Relocated camera control buttons upward so they no longer overlap with the map legend.
  - Scaled top-left origin/destination chips, top-right shortcuts bubble, and camera HUD size by +25%.
  - Scaled map legend size by +15%.

## [3.6.4] - 2026-09-15

### Fixed

- **Sidebar Rendering Below the Map on Desktop**: A stray extra closing `<div>` left over from an earlier edit (immediately after the version badge) was silently closing `.bottom-left-bar`, then cascading to prematurely close `.map-wrap` and `.main` one element too early. The net effect: the sidebar ended up as a sibling of `.main` instead of nested inside it, so it rendered full-width below the map instead of beside it on desktop widths. This was a pure HTML nesting bug, not a CSS/media-query issue — the responsive breakpoints themselves were never at fault.
- **Orbital Drift Root Cause Fix Restored**: An orbital calibration fix from earlier work had gone missing from this branch and is restored here. The in-game calendar uses 425 days per year, not 426 as previously assumed — a one-day-per-year discrepancy that compounds with every year elapsed, which is why the long-standing "orbits drift after 1-2 years" issue was small at first and grew steadily worse over time. `YEAR_DAYS` corrected from 426 to 425, and `m0Deg` recalibrated for all six planets using direct in-game Mean Anomaly readings taken ~15 years apart, cross-validated to within 0.01° per planet. Orbital periods and orientDeg values were independently confirmed already correct (via Kepler's third law and self-consistent Argument-of-Periapsis/LAN readings) and did not need to change. New m0Deg values: Moho 124.90, Eve 314.44, Duna 348.60, Dres 110.74, Jool 334.08, Eeloo 158.80 (previously 108.64 / 165.54 / 350.99 / 116.10 / 339.25 / 163.48).

### Known Issues

- **LAN Not Modeled Separately**: The 3D orbit renderer combines Argument of Periapsis and Longitude of Ascending Node into a single `orientDeg` value and applies inclination as a simple tilt, which is exact only when LAN is 0. Real LAN values are nonzero for every planet, so there's a small residual (constant, not growing over time) out-of-plane position error, largest for higher-inclination bodies like Moho (7°) and Eeloo (6.15°), negligible for Jool (1.3°). A fully correct fix would track LAN separately with proper 3-axis rotation.
- **kRPC2 Dependency Mod Doesn't Work**: The kRPC2 dependency mod on the KSP2 side does not work yet — the Python bridge (`kerbalist_bridge.py`) cannot connect to KSP2 because the required server-side mod is not functional.
- **Map Does Not Render on Mobile**: The 3D map canvas fails to initialize or render on mobile browsers (both iOS Safari and Android Chrome). The sidebar controls and all non-map UI elements still work correctly.

## [3.6.3] - 2026-09-15

### Changed

- **Map Legend Visual Updates**: Current phase and required phase indicators now use lines instead of dots to match their on-map representation. Required phase is a dashed line, transfer arc is a dashed green line, and the arrival ghost dot is joined by a green dot for the departure ghost.
- **Controls Documentation**: Added right-click context menu to the in-app controls bubble and README Map Controls table.

## [3.6.2] - 2026-09-15

### Fixed

- **Right-Click Context Menu No Longer Appears on Drag**: Right-clicking and immediately dragging the mouse no longer shows the context menu. The menu now only appears on a clean right-click release, matching standard OS behavior.

## [3.6.1] - 2026-09-14

### Fixed

- **Double-Click Body Info Sync**: Double-clicking a planet or moon label on the map now updates the Body Info panel to show the selected body's data and switches to the Body Info tab. Previously the camera would zoom to the body but the info panel remained stale.

## [3.6] - 2026-09-13

### Added

- **Full Mobile Responsive Design**: Kerbalist now works great on phones and tablets. On small screens, a Map / Controls toggle lets you view the 3D map or the sidebar controls — whichever you need. The map stays fully interactive with touch controls (1-finger rotate, 2-finger zoom & pan). Sidebar elements are touch-friendly with larger tap targets, compact layouts, and smooth scrolling.

## [3.5.6] - 2026-09-13

### Fixed

- **Moon Transfer Visualization Bug (Critical)**: Fixed a coordinate double-counting bug where transfers involving a moon rendered ghost arrival markers, dashed lines, transfer arcs, and return lines in incorrect positions—often roughly twice as far from the sun. Planet-to-planet transfers were unaffected.
- **Moon Camera Lock**: Fixed moon tracking when double-clicking or using right-click "Zoom in". Camera-follow and context-menu logic now check both planet and moon meshes.
- **Orbit Line Polygon Count Increased**: Planet orbit lines raised from 1200 to 4000 segments and moon lines from 600 to 2000, preventing visible drift at extreme zoom.
- **Drast Rendering Fused With Dres**: Moon orbit display radius now clamps to 1.3× its parent planet's physical radius, keeping Drast and similar moons clearly outside their parent.
- **Deeper Zoom Range**: Lowered minimum camera distance from 0.02 to 0.012 world units, adding roughly 4–5 zoom-in steps.

### Technical Details

- Root cause: moonLocalPosition() returns a moon's full world-space position (parent position already added internally), but bodyWorldPositionAt() was adding the parent's position a second time on top of that result.
- bodyWorldPositionAt() now calls moonLocalPosition() directly for moons without re-adding the parent offset.
- This single fix corrects every visualization that depends on bodyWorldPositionAt() for a moon: ghost arrival marker, dashed arrival line, transfer arc, and return trip overlay lines.
- updateMap()'s per-frame camera-follow check and the context menu's zoom-in handler now resolve the focused body via `planetMeshes[focusedPlanet] || moonMeshes[focusedPlanet]`.
- moonOrbitDisplayRadius() now returns `Math.max(rawOrbitRadius, parentPhysicalRadius * 1.3)`, and the Dres ring's inner-radius calculation now reuses this same clamped function instead of its own separate clamp.

### Known Issues

- **Orbital Drift After 1-2 Years**: Planetary orbits begin to drift noticeably after approximately 1-2 in-game years from the reference UT.
- **kRPC2 Dependency Mod Doesn't Work**: The kRPC2 dependency mod on the KSP2 side does not work yet — the Python bridge (`kerbalist_bridge.py`) cannot connect to KSP2 because the required server-side mod is not functional.
