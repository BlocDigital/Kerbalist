# Kerbalist - KSP2 Interplanetary Transfer Planner

**Live sync-capable transfer calculator with optional gravity assist optimization.**

Current version: **v2.3**

## Features

### Core Transfer Planning
- **All 7 stock planets** (Moho, Eve, Kerbin, Duna, Dres, Jool, Eeloo) with accurate orbital data
- **11 moons** including the Dres moons Drast and Beyl, selectable as transfer origins or destinations below their parent planets
- **Hohmann-style direct transfers** - shows phase angle, transfer time, delta-v budget, and window countdown
- **Return-trip budgeting** - enter mission time on the target body and estimate the next return-to-Kerbin window and delta-v
- **Live time control** - warp clock, manual UT input, or sync to your running KSP2 save
- **Interactive 3D map** - rotate, pan, zoom, and watch planets and moons orbit in real time
- **Return-trip visualization** - optionally show the return transfer arc and return ghost positions on the map
- **Porkchop plot generator** - compare departure dates and flight times for lower delta-v options

### Gravity Assists
- **Automatic detection** - finds planets positioned favorably for flybys on your chosen route
- **Multi-leg visualization** - see direct and assisted transfer arcs on the map
- **Delta-v savings calculation** - shows fuel economy vs. time tradeoff for each assist option
- **Ghost planets** - displays assist and arrival positions at encounter times
- **Per-leg timing** - shows how long each segment of the multi-leg journey takes

### Dres System
- **Drast and Beyl** - two Dres moons added from KSP2 reference data
- **Narrow Dres ring** - rendered as a thin equatorial ring band matching the in-game look more closely
- **Correct moon velocity display** - moon orbital speed uses the parent planet's gravitational parameter

## How to Use

### Basic Transfer
1. Open **index.html** in your browser.
2. Select **Origin** and **Destination** from the top dropdowns.
3. Click **Plan Transfer** to compute the direct route.
4. The map shows the transfer arc.
5. Check the **Transfer** tab for delta-v, flight time, and window countdown.

### Gravity Assists
1. After planning a transfer, open the **Assist Options** tab.
2. If available for your route, assists list each candidate planet with flight time and delta-v savings.
3. Click an assist to show the multi-leg trajectory, flyby marker, and assist-specific timing.

### Porkchop Plot
1. Open the **Porkchop** tab.
2. Generate a departure-date vs. flight-time grid.
3. Inspect lower-delta-v transfer options from the plotted solutions.

### Sync to Your Save

#### Option A: Save-File Watcher
1. Click **Live Sync** in the header.
2. Click **Choose Save File...**.
3. Navigate to your KSP2 persistent save:
   ```text
   C:\Users\[User]\AppData\LocalLow\Intercept Games\Kerbal Space Program 2\saves\
   ```
4. Pick the `.json` file for your active save.
5. Planner auto-syncs when the game autosaves.

#### Option B: Python Bridge
1. Install kRPC2 into your SpaceWarp BepInEx folder.
2. Install Python kRPC client: `pip install krpc`.
3. Run the companion script:
   ```bash
   python kerbalist_bridge.py
   ```
4. In Kerbalist, choose **Live Sync** -> **Local bridge**, leave URL as `http://localhost:5005/ut`, then click **Connect**.

#### Option C: Manual Time Entry
Type into the **Sync to save** boxes and hit **Set**.

## Map Controls

| Action | Result |
|--------|--------|
| **Scroll wheel** | Zoom in/out |
| **Click and drag** | Rotate orbit view |
| **Shift + drag** | Pan view |
| **+/- buttons** | Zoom controls |
| **Reset button** | Reset to full view |
| **Click planet or moon** | Open body info |
| **Double click planet or moon** | Center camera on that body |

## Notes

- **Coplanar approximation**: Inclination is shown in body info and visualized in the map, but transfer delta-v calculations remain simplified.
- **Assists are rough estimates**: Gravity assist delta-v is simplified; real assists need detailed SOI entry/exit and relative velocity analysis.
- **Moon transfers**: Moon selections use the parent planet's heliocentric transfer window.
- **KSP2 UT**: The game uses a fixed 426-day year for calendar purposes, but UT is stored as physical seconds.

## Files

- **index.html** - The planner itself
- **kerbalist_bridge.py** - Companion bridge for live kRPC2 sync
- **CHANGELOG.md** - Release history
- **ARCHITECTURE_INDEX.md** - Architecture and maintenance notes

## Troubleshooting

**"No gravity assists detected"**
- Not all routes have good flyby opportunities.
- Try Kerbin -> Jool or Eve -> Jool for classic assist routes.
- The detector depends on current orbital positions and selected departure time.

**"Live Sync won't connect"**
- Check that KSP2 is running and kRPC2 is installed if using bridge mode.
- Verify `http://localhost:5005/ut` is reachable in your browser.
- If the save schema changed, inspect or update `ATTR_PATHS` in `kerbalist_bridge.py`.

**"Save file sync shows old time"**
- Autosave intervals can be several minutes.
- Force an autosave by quicksaving if you need an immediate refresh.

## Credits

Built on stock Kerbol orbital data and classical orbital mechanics.
Lambert solving uses a universal variable formulation.
