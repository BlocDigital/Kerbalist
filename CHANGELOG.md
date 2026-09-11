# Changelog

All notable changes to Kerbalist will be documented in this file.

## [3.5.0] - 2026-09-06

### Added

- **Full Label Interactivity**: Planet and moon names are now fully interactive and much larger (16px, bold). Click to set origin, double-click to lock camera, right-click for context menu. Works identically for planets and moons.
- **Middle-Click Panning**: Pan the map with middle-click + drag (equivalent to Shift+drag). Adds an alternative to shift-dragging for camera panning.

### Fixed

- **Body Selection System**: Fixed broken setOrigin/setDestination functions. All body selection now works directly via the origin/destination select elements with proper change event firing.
- **Label Positioning**: Removed CSS transitions that caused labels to lag while panning. Labels now snap instantly to their correct positions, only animating color/glow on hover.
- **Clickable Label Container**: Fixed pointer-events blocking—label container is now pointer-events: none with individual labels at pointer-events: auto, so labels are clickable but canvas can still be panned.
- **World-Space Orbit Lines & Bodies**: Restructured moon orbits and bodies to use true world-space positioning instead of being nested under planet meshes. Planets and moons now sit exactly on their orbit lines. Orbit lines properly track parent planet positions each frame.
- **Camera Tracking**: Camera now properly locks to and follows focused bodies as they orbit, keeping them in view even as the system evolves.

### Technical Details

- Moon orbits and bodies removed from planet mesh hierarchy; both now added to scene root with world-space positioning.
- moonLocalPosition() now returns full world coordinates including parent planet's position.
- updateMap() positions moon orbit lines at parent planet's world location each frame.
- focusedPlanet mechanism updated to track camera target continuously.

## [3.0 - 3.4 Consolidated] - 2026-09-06

### Major Changes

#### Scaling & Coordinate System (v3.0)

- **Map Rewritten to Real KSP2 Proportions**: Single unified physical scale (world units per meter) replaces all custom tuning. All distances—heliocentric and moon-relative—use the same linear scale. Deleted "inner system expansion" (32% Duna inflation) and per-planet moon-orbit tuning buckets.
- **Raw System View**: Moons appear tightly clustered at full-system zoom (correct—that's what the real proportions look like). Zoom in to resolve them at accurate scale.

#### Camera & Zoom (v3.1 & v3.4)

- **Zoom-Based Scale Transition (LOD)**: Map fades between exaggerated overview (far) and true-to-scale physical view (near), exactly like KSP2. Smooth blend as camera approaches a planet.
- **Deeper Zoom Range**: Camera min distance 30 → 0.02 units; near plane 0.5 → 0.0005. Logarithmic depth buffer for stable rendering across the huge range.
- **Camera Lock to Focused Body**: Zoom into a planet or use context menu to lock camera. Camera stays locked to body's center as it orbits. Reset zoom clears lock.

#### Interactivity (v3.2 - v3.4)

- **Moon Label Visibility**: Moon labels hidden at far zoom (they cluster on planet); fade in as you zoom close.
- **Right-Click Context Menu**: Right-click planet/moon for menu with zoom, set origin/destination, clear, reset, show info options.
- **Click Helper Spheres**: Invisible collision spheres (10× planet, 5× moon) make bodies much easier to select without zooming extremely close.

#### Orbital Data (v2.6)

- **Jool Landing Removed**: Jool is a gas giant; removed misleading landing Δv estimate.
- **Moon Data**: All moon gravitational parameters (μ) added for accurate moon insertion/landing calculations.

### Technical Summary

v3.0-3.4 represents a major rewrite to match KSP2's true system proportions and interactivity model. Core architecture now separates exaggerated overview (for usability at full-system zoom) from true-scale near-view (for accurate planning when zoomed in). All interactive elements (labels, right-click, camera focus) now work reliably on both planets and moons.

## [2.8] - 2026-09-06

### Fixed

- **Negative Landing Δv Bug**: Fixed moon landing Δv reference estimate returning a negative value for small airless moons (e.g. Gilly), where low-orbit and surface velocities are nearly identical, making a velocity-difference formula unstable. Landing estimate now scales directly from low-orbit velocity instead.

### Technical Details

**Moon landing Δv formula:**
- Before: `(lowOrbitVelocity − surfaceVelocity) × 1.5` — could go negative for airless moons with near-flat velocity profiles
- After: `lowOrbitVelocity × 1.1` — always positive, still a rough reference estimate

## [2.6] - 2026-09-05

### Added

- **KSP2 Moon Gravitational Parameters**: Added actual KSP2 gravitational parameters (mu values) to all moon definitions in RAW_MOONS data. Ensures calculations use true KSP2 physics instead of derived values.
- **KSP2 Redux Dres Moon System**: Confirmed Drast and Beyl remain as Dres moons with proper KSP2 Redux system gravitational parameters (Drast: 3.7392×10⁶ m³/s², Beyl: 4.8695448×10⁷ m³/s²).

### Changed

- **Orbital Data Architecture**: Switched from modified/scaled orbital data to using original unmodified KSP2 orbital parameters for all physics calculations. Map view scaling now applies only to Three.js visualization layer, not to calculation data.
- **Moon Insertion Calculation**: Simplified to use actual orbital velocity formula with proper mu values: `lowOrbitVelocity × 1.2` (velocity matching + circularization). Removed complex compensation factors.
- **Moon Landing Calculation**: Changed to orbital velocity difference approach: `(lowOrbitVelocity - surfaceVelocity) × 1.5`. Uses actual moon gravitational parameters instead of escape velocity estimates.
- **getMoonMu() Function**: Updated to prioritize pre-defined KSP2 mu values from RAW_MOONS data, falling back only when necessary.

### Fixed

- **Small Moon Δv Budgets**: Fixed catastrophically incorrect values for small moons (e.g., Kerbin → Gilly showed 26,750 m/s insertion). Root cause: missing moon mu values forced incorrect Kepler-law derivation. Now uses actual KSP2 gravitational parameters.
- **Moon Orbital Mechanics**: All moon insertion and landing calculations now use correct orbital velocity formulas based on accurate gravitational parameters rather than compensation multipliers.
- **Physics-Visualization Separation**: Cleanly separated orbital data (unchanged KSP2 values) from visualization scaling (Three.js camera/viewport). Calculations now use pure, unmodified KSP2 data.

### Technical Details

**Moon Gravitational Parameters (added to all moons):**
- Gilly: 2.4868349×10⁹ m³/s²
- Mun: 6.5026800×10¹⁰ m³/s²
- Minmus: 1.7658000×10⁹ m³/s²
- Ike: 1.8568369×10¹⁰ m³/s²
- Drast: 3.7392×10⁶ m³/s² (KSP2 Redux)
- Beyl: 4.8695448×10⁷ m³/s² (KSP2 Redux)
- Laythe: 1.962000×10¹² m³/s²
- Vall: 2.2476×10¹⁰ m³/s²
- Tylo: 2.8253×10¹² m³/s²
- Bop: 1.221×10⁹ m³/s²
- Pol: 7.21×10⁸ m³/s²

**Architecture Improvements:**
- Original orbital semi-major axes, periods, radii, eccentricities: unchanged from KSP2
- Physics calculations: use unmodified KSP2 data directly
- Map view: Three.js scaling applied only to visualization (doesn't affect math)
- Result: All calculations now match KSP2 game values without compensation factors

### Backwards Compatibility

All changes are fully backwards compatible:
- Existing features work unchanged
- Map visual appearance and zoom level preserved
- Only difference: moon Δv calculations now accurate instead of using compensation multipliers
- No user action required

## [2.5] - 2026-09-05

### Added

- **Porkchop Plot User Guide**: New informational card above the porkchop plot explaining what it shows, how to read axes/colors, how to identify good transfer windows, and step-by-step workflow for mission planning. Includes detailed instruction on clicking cells to inspect specific transfer opportunities.
- **Landing Δv Reference Estimates**: Added "Landing @ [destination]" line item showing estimated powered descent cost for destination (planets and moons). Displayed as reference value only, depends on approach geometry.
- **getMoonMu() Helper Function**: New utility function calculating moon gravitational parameters from orbital data, with fallback to known KSP2 moon values for accurate moon insertion and landing cost estimates.

### Changed

- **Moon Insertion & Landing Display**: Changed from auto-add-to-total approach to "reference values only" display. Moon insertion and landing Δv now shown as separate informational line items, not included in main transfer total. Updated all related UI notes to clarify this distinction.
- **Total Δv Definition**: Redefined total Δv to show heliocentric transfer cost only (ejection + capture), making it clear what's needed for the interplanetary portion. Moon insertion and landing shown separately as rough estimates that vary with approach geometry.
- **Moon Insertion Formula**: Simplified from `1.5 × sqrt(μ / r_orbit)` to `0.3 × escape_velocity`, preventing unrealistic values for small moons.
- **Landing Formula**: Simplified to `0.4 × escape_velocity` (moons) and `0.5 × escape_velocity` (planets), providing more realistic estimates across gravity variations.
- **Porkchop Plot Display**: Changed colors to show heliocentric transfer Δv only; moon insertion and landing no longer inflate the grid values. Updated note to clarify reference values are shown separately.
- **Return Trip Budgeting**: Updated to use heliocentric transfer cost only, removing inflated moon insertion/landing costs from round-trip totals.
- **Big Number Label**: Changed main total display from "m/s total" to "m/s interplanetary transfer" to clarify it's not the complete mission budget.

### Fixed

- **Outrageous Moon Δv Budgets**: Fixed bug where moon destinations showed unrealistic Δv (e.g., Kerbin → Bop showed 141,336 m/s). Now shows ~3,200 m/s to Bop with ~150 m/s insertion as reference.
- **Zero Moon Insertion Δv**: Fixed moon insertion always showing 0 m/s by implementing proper gravitational parameter calculation via getMoonMu() helper.
- **Porkchop Plot Inflation**: Fixed porkchop grid colors being inflated by landing costs, which obscured actual transfer window valleys and made visual comparison unreliable.
- **Return Budget Inflation**: Fixed return-to-Kerbin budgets including moon insertion/landing costs from outbound journey, inflating realistic estimates.
- **Moon Insertion Reference Accuracy**: Improved accuracy of moon insertion estimates by deriving from escape velocity rather than orbital velocity, better reflecting actual circularization costs.

### Technical Details

- **Orbit Insertion Calculation**: Now uses `moonEscapeVelocity = sqrt(2 × μ_moon / moonRadius)` with 0.3× factor for insertion, 0.4× for moon landing.
- **Planet Landing Calculation**: Uses `planetEscapeVelocity = sqrt(2 × μ_planet / planetRadius)` with 0.5× factor for atmospheric/gravity losses.
- **Transfer Total Isolation**: Separated heliocentric transfer total from local maneuver estimates in both calculation and display layers.
- **Validation Logic**: Maintains moon-friendly validation from v2.4 while fixing resulting display issues.

## [2.4] - 2026-08-28

### Added

- **Moon Transfer Δv Budgeting**: Fixed moon destination transfers showing identical Δv budget to parent planet by adding automatic moon orbit insertion cost calculation (~1.5x the moon's circular orbital velocity). Now correctly displays: ejection burn @ origin, capture burn @ parent planet, and moon orbit insertion @ destination with separate line items in total budget.
- **Moon Insertion Cost Display**: Added dedicated line item "Moon orbit insertion @ [moon name]" showing estimated Δv cost for orbit insertion at destination moon.
- **Porkchop Plot Moon Support**: Moon destinations now appear in porkchop plot generator with colors including moon insertion cost, labeled as "Total Δv (heliocentric + moon insertion)".
- **Return Trip Moon Budgeting**: Round-trip return-to-Kerbin calculations now include outbound moon orbit insertion cost for accurate mission budgeting.

### Technical Updates

- **Validation Logic**: Modified transfer validation to allow same parent planet when destination is a moon (previously rejected such transfers).
- **Orbit Insertion Formula**: Uses `V_insertion = 1.5 × sqrt(μ_moon / r_orbit)` where orbit altitude = max(20% of moon radius, 10km) to estimate capture and circularization burns.
- **UI Clarifications**: Updated notes to distinguish heliocentric-only Δv from total budget including moon insertion costs.

## [2.3] - 2026-08-27

### Added

- **Return-to-Kerbin Δv Budgeting**: Added mission time on target body controls to the Δv Budget card, with step buttons for -20, -10, -1, +1, +10, and +20 days.
- **Return Window Details**: The Δv Budget card now estimates the next target-to-Kerbin transfer window after the mission stay, including return departure UT, Kerbin arrival UT, return ejection burn, Kerbin capture burn, return Δv, and round-trip Δv.
- **Return Trip Map Visualization**: Added an optional checkbox to draw the return transfer arc on the 3D map with distinct colors, including return departure and Kerbin arrival ghost positions.

## [2.2] - 2026-08-11

### Added

- **Heliocentric Δv Total Display**: Added a supplementary heliocentric total m/s readout in a smaller font beneath the main ejection/capture parking orbit Δv budget.
- **Ejection Angle Visual Schematic**: Added a local planetary orbit diagram to the Ejection Angle card showing the parking orbit around the origin body, the prograde marker, and the precise burn position with thrust vector exhaust flames.

### Changed

- **Card Layout & Workflow Reordering**: Moved the Ejection Angle card directly below the Δv Budget card for better visual sequence during mission planning.
- **UI & Typography Scaling**: Scaled all sidebar UI elements, fonts, controls, padding, and borders up by +30% and increased note text size by +20% for improved readability, automatically scaling SVG diagrams to match.
- **Dres Ring System & Drast Orbit Integration**: Re-centered Dres's ring system directly along the orbit of Drast with multi-band ring texturing so Drast orbits embedded within the ring band.

## [2.0] - 2026-08-10

### Added

- **Dres Moon System Expansion**: Added Drast and Beyl as selectable moons of Dres, including local 3D orbits, physical display data from the supplied KSP2 screenshots, labels, click selection, and transfer dropdown entries

### Changed

- **Dres Ring Alignment**: Narrowed the Dres ring band and aligned it with Dres's equatorial plane so it matches the in-game ring appearance more closely
- **Moon Velocity Display**: Moon body info now derives local orbital speed from the parent planet's gravitational parameter instead of Kerbol's

## [1.7.2] - 2026-08-09

### Added

- **Gravity Assist Planning**: New Assists tab automatically detects planets positioned for a viable flyby on the current route and estimates combined delta-v by solving two independent Lambert arcs (origin → assist planet, assist planet → destination), compared directly against the direct Hohmann transfer
- **Assist Route Visualization**: Selecting an assist route draws both transfer legs in the 3D scene, dims the direct arc so the assist route reads as the active option, and drops a glowing marker at the flyby encounter point
- **Assist Route Labels**: Flyby planet name and per-leg origin/assist/destination labels with flight-time annotations, rendered as screen-space labels that track the 3D scene as the camera moves
- **Assist Arrival Ghost**: A second, violet-colored arrival ghost shows the destination's real position at the assist route's own arrival time, distinct from the direct transfer's amber ghost — multi-leg routes often arrive years apart from a direct transfer
- **Gravity Assist Legend Entry**: Map legend now includes a violet swatch identifying gravity-assist-related elements

### Fixed

- **Assist Leg Flight-Time Phasing**: Gravity-assist leg durations were previously estimated with a naive semi-major-axis-only Hohmann-time formula that assumed exact 180-degree opposition between the flyby planet and the next body at arrival. When the flyby planet wasn't actually well-positioned for that assumption, this could force a near-parabolic trajectory (eccentricity ≈ 1) to satisfy the mismatched geometry, producing a sharply distorted, incorrect-looking arc. Leg durations are now refined by numerically searching for genuine opposition between the two bodies, with a small offset applied to avoid landing exactly on the Lambert solver's own singularity at 180 degrees

## [1.7.0] - 2026-08-07

### Changed

- **Hohmann Transfer Arc Correction**: Fixed transfer arc drawing to use a real Lambert trajectory solution instead of an idealized 180-degree ellipse. The previous method could miss the arrival point for eccentric destinations; the new approach solves for the exact elliptical/hyperbolic orbit connecting departure and arrival points at the computed transfer time
- Orbital display scaling adjusted so planet spheres and moon orbits maintain proper physical distance ratios

### Fixed

- Moon orbit rendering tightened to prevent inner-planet moon rings from overlapping neighboring planetary orbits while keeping outer moon systems legible

## [1.6.1] - 2026-08-06

### Added

- **Moon Destination Selection**: Moons now appear in origin and destination dropdowns below their parent planets with dashed labels (e.g., `- Mun`) to distinguish them from planets
- **Clear Transfer Button**: New button beside Plan Transfer to remove transfer arcs, phase lines, arrival ghosts, and reset the transfer panel

### Changed

- **Moon Orbit Display Scaling**: Tightened inner-planet moon orbit rendering for readability while preserving outer moon visibility

## [1.6.0] - 2026-08-05

### Added

- Complete Moon System: All stock KSP/KSP2 moons (Gilly, Mun, Minmus, Ike, Laythe, Vall, Tylo, Bop, Pol) with 3D local orbits, real-time ephemeris propagation, raycast clicking, and physical data inspection
- Double Click Centering: Double-click any planet or moon to snap camera focus directly to that celestial body

### Changed

- Expanded Visual Scale: Scaled down planet spheres and expanded moon orbit radii so moons clearly orbit outside planetary atmospheres
- Subtle Camera Focal Marker: Added minimal dark grey 3D pivot dot tracking camera focus position in space

## [1.5.0] - 2026-08-04

### Added

- Full 3D WebGL Solar System Map: Replaced 2D SVG map with Three.js WebGL scene supporting accurate planetary orbital inclinations
- Free-Look Orbital Camera: Left drag rotates, Shift+drag or middle-click+drag pans, scroll zooms, R key or reset button returns to default view
- Destination Arrival Ghost: Translucent ghost planet shows exact projected destination position at arrival time
- 3D Trajectory Inclination Matching: Transfer arc interpolates inclination angles from departure to destination (e.g., 0 Kerbin 5 Dres)
- UI & Controls HUD: On-screen keyboard/mouse controls overlay card and expanded UT sync input fields supporting 4-digit years

## [1.0] - Initial Release

### Added

- Interactive Kerbol system visualization
- Hohmann transfer calculations
- Delta-V calculator
- Phase angle calculator
- Transfer arc visualization
