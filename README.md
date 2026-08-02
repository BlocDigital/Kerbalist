# 🚀 Kerbal Space Program 2 – Interplanetary Mission Planner

A standalone, browser-based mission planning tool for **Kerbal Space Program 2**.

Designed for both experienced players and newcomers, this application provides accurate interplanetary transfer calculations, interactive orbital visualizations, transfer window analysis, and mission planning tools—all running locally in a single HTML file with no installation required.

---

## Features

### 🌌 Interactive 3D Kerbol System

- **3D WebGL Visualization**: Full 3D rendering powered by Three.js with accurate planetary orbital inclinations
- **Orbital Camera Controls**: Free rotation (`Left Drag`), panning (`Shift + Drag`), zoom (`Scroll`), and quick view reset (`R` key or reset button)
- **Arrival Position Ghost**: Displays a translucent "ghost" marker of the destination planet at the exact predicted arrival time upon planning a transfer
- **Live Ephemeris & Time Warp**: Real-time planet propagation with game-accurate epoch clock syncing (T+ elapsed time)

---

### 🛰 Mission Planning

- Select any origin and destination planet
- Automatic Hohmann transfer calculations
- Current and required phase angles
- Transfer window countdown
- Transfer time and ΔV budget estimation
- Arrival time calculation and arrival position ghost visualization

---

### 📈 Orbital Visualizations

- 3D transfer arc and phase angle lines
- Destination arrival ghost with travel trajectory vector
- Spacecraft trajectory visualization
- Ejection & capture angle geometry display

---

### ⚡ Delta-V Calculator

Calculates:

- Escape burn
- Interplanetary transfer burn
- Capture burn
- Total mission ΔV

---

### 🪐 Planet Database

Includes orbital information for every stock KSP2 planet:

- Semi-major axis
- Orbital period & eccentricity
- Inclination & argument of periapsis
- Radius & gravitational parameter (μ)
- Live orbital velocity and current solar distance

---

### 🥩 Porkchop Plot Generator

Generate real launch window plots using a **Universal Variable Lambert Solver**.

Features include:

- Departure date vs. flight time analysis
- Interactive heatmap
- Lowest ΔV trajectory identification
- Click any solution to inspect the transfer

---

### 🔬 Universal Variable Lambert Solver

The planner uses a numerical Lambert solver capable of handling:

- Elliptical transfers
- Hyperbolic transfers
- Short and long-way solutions
- Near-parabolic trajectories
- 180° transfer edge cases

---

### 🎯 Transfer Window Calculator

Instantly displays:

- Current phase angle
- Required phase angle
- Angular difference
- Time until launch window
- Synodic period

---

### 🎨 User Interface

- Modern aerospace-inspired dark interface
- On-screen controls shortcut overlay
- Customizable epoch sync inputs (supports multi-digit year entry)
- Responsive layout with high-DPI support
- Smooth 60 FPS WebGL rendering

---

## Technologies

- HTML5 & CSS3
- Vanilla JavaScript
- Three.js (via CDN for WebGL 3D rendering)
- HTML5 Canvas (2D Porkchop Plot)
- Universal Variable Lambert solver algorithms


Everything runs entirely inside a modern web browser.

---

## Accuracy

The application performs real orbital calculations using Keplerian mechanics.

Implemented calculations include:

- Hohmann transfers
- Phase angle computation
- Synodic periods
- Lambert trajectory solutions
- Orbital propagation
- Transfer ellipse generation
- Delta-V estimation
- Planetary ephemerides

---

## Screenshots

*Coming soon*

---

## Installation

No installation is required.

Simply download the project and open:

```
Kerbalist.html
```

in any modern browser.

## Changelog

### Version 1.5.0 (Current)
- 🪐 **Full 3D WebGL Solar System Map**: Replaced 2D SVG map with Three.js WebGL 3D scene supporting accurate planetary orbital inclinations.
- 🎥 **Free-look Orbital Camera**: Added free rotation (`Left Drag`), panning (`Shift + Drag`), zoom (`Scroll`), and quick view reset (`R` key or `⤾` button).
- 👻 **Destination Arrival Ghost**: Shows a translucent ghost planet at the exact projected position of the destination body upon arrival, connected by a trajectory line.
- 📐 **3D Trajectory Inclination Matching**: Transfer arc path interpolates inclination angles from departure to destination planet (e.g. 0° Kerbin → 5° Dres).
- ⌨️ **UI & Controls HUD**: Added on-screen keyboard/mouse controls overlay card and expanded UT sync input fields to support 4-digit years comfortably.

---

## Roadmap

### Version 1.0 (Completed)
- Interactive Kerbol system
- Hohmann transfers
- Delta-V calculator
- Phase angle calculator
- Transfer visualization

### Version 1.5 (Completed)
- 3D WebGL rendering with true inclinations
- Free-look & pan camera controls
- Destination arrival ghost planet visualization
- Lambert solver & Porkchop plots

### Version 2.0 (Planned)
- Gravity assist planner
- Multi-flyby trajectories
- Plane change optimization
- Inclination matching
- Resonant orbit planner

### Future Ideas

- Modded planetary systems
- Principia compatibility
- Save/load mission plans
- Export trajectories
- Offline PWA support
- Dark/light themes
- Real-time mission playback

---

## Why This Project?

Most KSP transfer calculators either:

- only calculate phase angles,
- use simplified equations,
- or provide little visual feedback.

This project combines accurate orbital mechanics with an interactive visualization system, allowing players to understand *why* a transfer works rather than simply following numbers.

---

## License

MIT License

Feel free to use, modify, and contribute.

---

## Acknowledgements

Inspired by:

- AlexMoon Launch Window Planner
- NASA trajectory planning tools
- ESA mission analysis software
- The Kerbal Space Program community
- Squad and Intercept Games

---

## Contributing

Contributions are welcome.

Possible areas include:

- Performance improvements
- UI enhancements
- Additional mission planners
- More visualization modes
- Bug fixes
- Documentation

Please open an Issue or Pull Request.

---

## Disclaimer

This project is an independent fan-made tool and is not affiliated with, endorsed by, or sponsored by Intercept Games, Private Division, or Take-Two Interactive.

Kerbal Space Program® and Kerbal Space Program 2® are trademarks of their respective owners.
