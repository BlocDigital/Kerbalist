# 🚀 Kerbal Space Program 2 – Interplanetary Mission Planner

A standalone, browser-based mission planning tool for **Kerbal Space Program 2**.

Designed for both experienced players and newcomers, this application provides accurate interplanetary transfer calculations, interactive orbital visualizations, transfer window analysis, and mission planning tools—all running locally in a single HTML file with no installation required.

---

## Features

### 🌌 Interactive Kerbol System

- Animated Kerbol system map
- Accurate planetary orbits
- Live planet positions
- Zoom and pan controls
- Adjustable simulation speed
- Real-time orbital animation

---

### 🛰 Mission Planning

- Select any origin and destination planet
- Automatic Hohmann transfer calculations
- Current phase angle
- Required phase angle
- Transfer window countdown
- Transfer time
- Departure and arrival dates

---

### 📈 Orbital Visualizations

- Animated transfer ellipse
- Spacecraft trajectory
- Departure burn visualization
- Arrival encounter visualization
- Ejection angle display
- Mission timeline animation

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
- Orbital period
- Radius
- Sphere of Influence
- Orbital velocity
- Gravitational parameter
- Surface gravity

---

### 🥩 Porkchop Plot Generator

Generate real launch window plots using a **Universal Variable Lambert Solver**.

Features include:

- Departure date vs. flight time analysis
- Interactive heatmap
- Lowest ΔV trajectory identification
- Click any solution to inspect the transfer
- Live trajectory visualization

Unlike approximate planners, this is generated from actual Lambert solutions rather than lookup tables.

---

### 🔬 Universal Variable Lambert Solver

The planner uses a numerical Lambert solver capable of handling:

- Elliptical transfers
- Hyperbolic transfers
- Short and long-way solutions
- Near-parabolic trajectories
- 180° transfer edge cases

The implementation has been validated against analytical Hohmann transfers and additional unit tests.

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

- Modern aerospace-inspired design
- Dark theme
- Responsive layout
- Interactive tooltips
- Smooth 60 FPS rendering
- High-DPI support

---

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- HTML5 Canvas
- SVG rendering
- No external dependencies

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
index.html
```

in any modern browser.

Alternatively:

```bash
git clone https://github.com/yourusername/ksp2-mission-planner.git
cd ksp2-mission-planner
```

Open:

```
index.html
```

---

## Roadmap

### Version 1.0

- Interactive Kerbol system
- Hohmann transfers
- Delta-V calculator
- Phase angle calculator
- Transfer visualization

### Version 1.5

- Lambert solver
- Porkchop plots
- Mission timeline
- Improved orbital rendering

### Version 2.0

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
- require an internet connection,
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
