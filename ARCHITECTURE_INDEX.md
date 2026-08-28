# Kerbalist Architecture & Memory Index

## Project Overview
**Kerbalist** - A standalone, browser-based interplanetary mission planning tool for Kerbal Space Program 2.

## Core Architecture Components

### 1. Three.js WebGL System (3D Visualization)
- **Renderer**: WebGL 3D scene with accurate planetary orbital inclinations
- **Camera Controls**: 
  - Left Drag: Free rotation
  - Shift + Drag: Panning
  - Scroll: Zoom
  - R key/Reset button: View reset
- **Celestial Bodies**: All KSP2 planets plus 11 moons with local orbit systems
- **Features**:
  - Live ephemeris propagation with epoch clock syncing (T+ elapsed time)
  - Destination arrival position ghost visualization
  - Transfer arc and phase angle lines in 3D space
  - Spacecraft trajectory visualization
  - Ejection & capture angle geometry display

### 2. Orbital Mechanics Engine
- **Hohmann Transfer Calculator**: Automatic transfer orbit computations
- **Phase Angle System**: Current/required phase angles, angular difference
- **Synodic Period Calculator**: Launch window timing
- **Lambert Solver**: Universal Variable numerical solver for:
  - Elliptical transfers
  - Hyperbolic transfers
  - Short/long-way solutions
  - Near-parabolic trajectories
  - 180° transfer edge cases
- **Delta-V Calculator**: Escape, transfer, and capture burn calculations

### 3. Porkchop Plot Generator
- **Canvas-based 2D Heatmap**: Departure date vs. flight time analysis
- **Interactive Elements**: Clickable solution points
- **Lowest ΔV Trajectory Identification**

### 4. Planet/Moon Database
- **Planets**: All stock KSP/KSP2 planets with:
  - Semi-major axis, orbital period, eccentricity
  - Inclination, argument of periapsis
  - Radius, gravitational parameter (μ)
  - Live orbital velocity and current solar distance
- **Moons** (Version 1.6+): Gilly, Mun, Minmus, Ike, Drast, Beyl, Laythe, Vall, Tylo, Bop, Pol
  - Local orbits with real-time propagation
  - Raycast clicking for selection
  - Physical data inspection
  - Dres ring band aligned to the Dres equatorial plane

### 5. User Interface System
- **Theme**: Modern aerospace-inspired dark interface
- **Controls HUD**: On-screen keyboard/mouse controls overlay
- **Epoch Sync**: Customizable inputs (supports multi-digit year entry)
- **Responsive Layout**: High-DPI support, smooth 60 FPS rendering
- **UI Controls**: Transfer panel, Clear button, Plan Transfer button

## Technical Stack
- HTML5 & CSS3
- Vanilla JavaScript
- Three.js (CDN for WebGL)
- HTML5 Canvas (2D Porkchop plots)

## Architecture Index by Version

### Version 1.0 (Foundation)
- Interactive Kerbol system
- Hohmann transfers
- Delta-V calculator
- Phase angle calculator
- Transfer visualization

### Version 1.5 (3D Revolution)
- Three.js WebGL rendering with true inclinations
- Free-look & pan camera controls
- Destination arrival ghost planet
- Lambert solver implementation
- Porkchop plot generator

### Version 1.6 (Moon System)
- Complete 3D stock moon system
- Moon dropdown destinations
- Compact local moon orbit display
- Clear transfer map control
- Double-click centering feature

### Version 2.0 (Gravity Assist and Dres Expansion)
- Gravity assist route detection and multi-leg Lambert visualization
- Assist encounter labels and arrival ghosting
- Drast and Beyl added as Dres moons
- Narrow Dres equatorial ring rendering

## Task Router Protocol

### Quick Reference Commands

#### Visualizations
```
- View 3D: Camera rotation/panning/zoom (left drag, shift+drag, scroll)
- Reset View: R key or ⤾ button
- Focus Body: Double-click any planet/moon
- Clear Transfer: Click Clear button
```

#### Planning Workflow
```
1. Select Origin Planet/Moon from dropdown
2. Select Destination Planet/Moon from dropdown
3. Review current/required phase angles in panel
4. Check transfer window countdown
5. View 3D transfer arc and arrival ghost
6. Inspect ΔV budget breakdown
7. (Optional) Generate Porkchop plot for launch windows
```

#### Calculations Available
```
- Escape burn ΔV
- Interplanetary transfer ΔV
- Capture burn ΔV
- Total mission ΔV
```

#### Data Displayed
```
Planetary:
- Semi-major axis, orbital period, eccentricity
- Inclination, argument of periapsis
- Radius, gravitational parameter (μ)
- Live orbital velocity, current solar distance

Moon-specific:
- Local orbit radius and inclination
- Distance from parent body
- Current position in local orbit
```

## File Structure Notes
```
index.html - Main application file (single-file HTML)
```

## Future Enhancement Areas
- Multi-flyby trajectories
- Plane change optimization
- Inclination matching
- Resonant orbit planner
- Modded planetary systems
- Principia compatibility
- Save/load mission plans
- Export trajectories
- Offline PWA support
- Dark/light themes
- Real-time mission playback
