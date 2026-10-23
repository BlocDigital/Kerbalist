# Kerbalist v4.7

Astrodynamics Suite for Kerbal Space Program 2 Redux

Kerbalist helps you plan efficient transfers between planets in Kerbal Space Program. Calculate transfer windows, ejection angles, and capture requirements all in one tool.

## Features

- **Transfer Window Calculator**: Find the next window to your destination with accurate timing based on real orbital mechanics.
- **Exact Transfer Numbers**: Flight time, ΔV, v∞, arrival time—all calculated from the actual trajectory drawn on the map.
- **HUD Widgets**: Pin transfer info cards (Window, Phase Angle, Ejection Angle, Transfer Time, Ghost Body) directly to the map as draggable, resizable widgets.
- **Interactive Map**: Real-time orbital visualization with transfer arcs, phase lines, and departure ghosts.
- **Themes and Menu**: A header menu with Reset HUD layout, the Telemetry Bridge release page, the changelog, and four themes (Cyan, Red, Yellow, Green) that recolour the whole app.
- **Bug Reports**: Report issues directly to GitHub with automatic app screenshots.
- **Persistent State**: All your preferences and widget positions are saved to localStorage.

## Getting Started

1. Watch the tutorial for a full breakdown of Kerbalist features
2. Select your origin and destination from the dropdowns
3. The map shows the transfer window and current phase angle
4. Pin transfer info cards to the map for reference while flying

## Live Sync with KSP2

Live sync needs the **Kerbalist Telemetry Bridge** mod running inside KSP2. It sends the game's time, planet and moon positions and the active vessel to Kerbalist while the game runs.

1. Download the mod from the [release page](https://github.com/BlocDigital/KerbalistTelemetryBridge/releases/).
2. Install it by following the instructions on that release page.
3. Start KSP2 with the mod enabled and load a save.
4. In Kerbalist, open the time panel, choose **KSP2 Telemetry Bridge** and press **Connect**. The default address `ws://127.0.0.1:8765/ws` works unless you have changed the mod's port.

While live sync is on, the time buttons show a LIVE SYNC overlay, because the game drives the clock.

## Version History

- **v4.7** (2026-10-22): Anonymous usage stats (on by default, turn off in the menu), assist route phase and ejection cards, theme colours for the top bar and sidebar
- **v4.6** (2026-10-21): Header menu with themes (Cyan, Red, Yellow, Green), tutorial button restyle, HUD text and diagram fitting, game calendar
- **v4.5** (2026-10-21): Tutorial video
- **v4.4** (2026-10-18): Active vessel orbit line, vessel marker on its orbit, apoapsis and periapsis from the bridge, game calendar, small-body halos
- **v4.3.1** (2026-10-18): Fixed active vessel apoapsis and periapsis
- **v4.3** (2026-10-18): Active vessel HUD element, vessel tag, Settings tab with HUD layout reset, live sync overlay, game orbits in live sync, HUD scaling
- **v4.2** (2026-10-17): Live sync from the [KSP2 Telemetry Bridge](https://github.com/BlocDigital/KerbalistTelemetryBridge/releases/), active vessel HUD
- **v4.1** (2026-10-07): HUD Widgets — pin transfer info cards to the map
- **v4.0** (2026-10-03): Exact transfer numbers, bug report system
- [See full changelog](CHANGELOG.md)

## Technical

- Single-file web app (no dependencies)
- Modular source code in `src/parts/` (54 files, none over ~600 lines)
- Built with Three.js for 3D visualization
- Includes physics tests and CI checks
- Works offline

## Browser Support

Modern browsers with WebGL support. Desktop and tablet recommended (mobile map rendering not yet supported).

## Known Limitations

- Transfers are flat (coplanar). Moho and Eeloo won't intercept exactly due to their orbital tilt.
- Return-trip estimates use simplified circular-orbit calculations.

## License

Copyright (c) 2026 - Kerbol Astrodynamics Team - Bloc Digital

---

**Report bugs**: Click the "Submit a bug" button in the bottom-left, or [open an issue on GitHub](https://github.com/blocdigital/kerbalist/issues).
