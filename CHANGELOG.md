# Changelog

All notable changes to Kerbalist will be documented in this file.

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
