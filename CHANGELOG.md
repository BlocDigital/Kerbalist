# Changelog

All notable changes to Kerbalist will be documented in this file.

## [2.1] - 2026-08-10

### Added

- **Heliocentric Δv Total Display**: Added a supplementary heliocentric total m/s readout in a smaller font beneath the main ejection/capture parking orbit Δv budget.
- **Ejection Angle Visual Schematic**: Added a local planetary orbit diagram to the Ejection Angles card showing the parking orbit around the origin body, the prograde marker, and the precise burn position with thrust vector exhaust flames.

### Changed

- **Card Layout & Workflow Reordering**: Moved the Ejection Angles card directly below the Δv Budget card for better visual sequence during mission planning.
- **UI & Typography Scaling**: Scaled all sidebar UI elements, fonts, controls, padding, and borders up by +30% and increased note text size by +20% for improved readability, automatically scaling SVG diagrams to match.

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
- Free-Look Orbital Camera: Left drag rotates, Shift+drag pans, scroll zooms, R key or reset button returns to default view
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
