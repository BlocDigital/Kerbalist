# Kerbalist v4.1

**Astrodynamics Suite for Kerbal Space Program 2 Redux

Kerbalist helps you plan efficient transfers between planets in Kerbal Space Program. Calculate transfer windows, ejection angles, and capture requirements all in one tool.

## Features

- **Transfer Window Calculator**: Find the next window to your destination with accurate timing based on real orbital mechanics.
- **Exact Transfer Numbers**: Flight time, ΔV, v∞, arrival time—all calculated from the actual trajectory drawn on the map.
- **HUD Widgets**: Pin transfer info cards (Window, Phase Angle, Ejection Angle, Transfer Time, Ghost Body) directly to the map as draggable, resizable widgets.
- **Interactive Map**: Real-time orbital visualization with transfer arcs, phase lines, and departure ghosts.
- **Bug Reports**: Report issues directly to GitHub with automatic app screenshots.
- **Persistent State**: All your preferences and widget positions are saved to localStorage.

## Getting Started

1. Select your origin and destination from the dropdowns
2. The map shows the transfer window and current phase angle
3. Adjust warp speed to see when transfers are available
4. Pin transfer info cards to the map for reference while flying

## Version History

- **v4.1** (2026-10-07): HUD Widgets — pin transfer info cards to the map
- **v4.0** (2026-10-03): Exact transfer numbers, bug report system
- [See full changelog](CHANGELOG.md)

## Technical

- Single-file web app (no dependencies)
- Modular source code in `src/parts/` (43 files, ~12KB each)
- Built with Three.js for 3D visualization
- Includes physics tests and CI checks
- Works offline

## Browser Support

Modern browsers with WebGL support. Desktop and tablet recommended (mobile map rendering not yet supported).

## Known Limitations

- Transfers are flat (coplanar). Moho and Eeloo won't intercept exactly due to their orbital tilt.
- Return-trip estimates use simplified circular-orbit calculations.
- kRPC2 bridge support not yet available.

## License

© 2026 Larry. All rights reserved.

---

**Report bugs**: Click the "Submit a bug" button in the bottom-left, or [open an issue on GitHub](https://github.com/blocdigital/kerbalist/issues).
