<p align="center">
  <img src="./Kerbalist.png" alt="Kerbalist" width="400">
</p>

# Kerbalist - KSP2 Interplanetary Transfer Planner
(Redux, including Beta 7 / Snapshot 26w32a and above, with the 2 new moons of Dres)

**Live sync-capable* transfer calculator with optional gravity assist optimization.**

Current version: **v4.0**

What's new in v4.0

## [4.0] - 2026-10-03

### Added

- **Verification code on bug reports**: "Open GitHub Issue" unlocks after you type the 5 characters shown in the form.
- **Automatic app screenshot**: Opening the bug report form captures the whole app and copies it to the clipboard. Press Ctrl+V in the GitHub issue to attach it. You can retake it or remove it.
- **Your own screenshot**: Click, drag and drop, or paste an image instead (PNG, JPG, GIF or WebP, up to 5 MB). Dropping works anywhere on the form.
- **Collapsible legend**: The map legend is now a box with a minimize button, like Controls. Press L to toggle it. The zoom buttons sit above it.

### Changed

- **Transfer window timing**: "Window opens at" is now worked out from the real orbit positions instead of average speeds. It no longer shifts as you get close (for Kerbin to Duna it used to move by about 5 days), the countdown no longer reaches zero a few days early, and the window stays open until the phase is off by 1° (about 2.5 days for Duna) before the countdown moves on to the next one.
- **Required phase angle**: Shows the real angle for the window instead of the circular-orbit value. For eccentric destinations like Duna it can differ by a degree or two.
- **Exact transfer numbers**: Flight time, ejection and capture Δv, v∞, transfer orbit size, arrival time and the burn angle now come from the same trajectory that is drawn on the map, using the cheapest flight time for the window. The old numbers assumed circular orbits and would have missed Duna by about a million km. Following the new ones reaches the planet.
- **Ejection card**: Now titled "Ejection Angle (burn point)". The diagram marks the reference point (RG for retrograde, PG for prograde) and the burn angle is measured from it. The orange exhaust lines on the burn marker are gone.
- **Source layout**: The code is now 43 small files in `src/parts` that `npm run build` joins into the single `index.html`, with physics tests and a GitHub check. Nothing changes for users.

### Fixed

- **Ejection angle was on the wrong side**: For an outbound transfer it said to burn ahead of prograde, which sends the ship out against the planet's motion. It now says how far ahead of retrograde to burn (outbound) or ahead of prograde (inbound), including any tilt in the departure direction.
- **Bug report with a screenshot didn't open**: The image was packed into the GitHub link, which made it too long. Screenshots now go through the clipboard.
- **Dropped images opened in a new tab**: Only the small drop box caught drops. Dropping now works anywhere on the form.
- **JPG screenshots couldn't be copied**: The clipboard only takes PNG, so uploads are converted first.
- **Submit button off-screen on short windows**: The bug report form now scrolls inside the window.

*WIP

---

## Features

### Core Transfer Planning
- **All 7 stock planets** (Moho, Eve, Kerbin, Duna, Dres, Jool, Eeloo) with accurate orbital data
- **11 moons** including the Dres moons Drast and Beyl, selectable as transfer origins or destinations below their parent planets
- **Moon orbit insertion Δv calculation**: Automatic estimation of capture and circularization burns for moon destinations (~1.5x circular orbital velocity)
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

### Bug Reporting (NEW in v3.7.0)
- **🐛 Submit bug report button** in bottom-left corner
- **Screenshot upload** with drag-drop and file browse support
- **Pre-filled GitHub issues** with title, description, screenshot, version, browser, timestamp
- Zero backend — uses GitHub's web form with pre-filled fields

### Mobile
- **Responsive layout** - Map / Controls toggle for small screens, larger tap targets and compact sidebar layouts
- **Touch controls implemented** - 1-finger rotate, 2-finger zoom & pan gestures are wired up for the 3D map
- ⚠️**Known issue**: the 3D map canvas currently fails to initialize/render properly on mobile browsers (iOS Safari, Android Chrome). See Known Issues in CHANGELOG.md.

## How to Use

### Basic Transfer
1. Open **index.html** in your browser.
2. Set your ingame UT time.
3. Select **Origin** and **Destination** from the dropdowns (top-left HUD or sidebar).
4. Click **Plan Transfer** to compute the direct route.
5. The map shows the transfer arc.
6. Check the **Transfer** tab for delta-v, flight time, and window countdown.

### Gravity Assists
1. After planning a transfer, open the **Assist Options** tab.
2. If available for your route, assists list each candidate planet with flight time and delta-v savings.
3. Click an assist to show the multi-leg trajectory, flyby marker, and assist-specific timing.

### Porkchop Plot
1. Open the **Porkchop** tab.
2. Generate a departure-date vs. flight-time grid.
3. Inspect lower-delta-v transfer options from the plotted solutions.

### Report a Bug
1. Click the **Submit bug report 🐛** button in the bottom-left corner.
2. Type a bug title (required) and description (optional).
3. Optionally upload a screenshot (PNG/JPG/GIF, max 5MB) by:
   - Clicking the upload area to browse files, OR
   - Dragging an image directly onto the upload area
4. Click **Open GitHub Issue** to generate a pre-filled issue.
5. Review the issue form on GitHub and click **Create issue** to submit.

### Sync to Your Save **|||WORK IN PROGRESS|||**

#### Option A: Save-File Watcher
1. Click **Live Sync** in the header.
2. Click **Choose Save File...**.
3. Navigate to your KSP2 persistent save:
   ```text
   C:\Users\[User]\AppData\LocalLow\Intercept Games\Kerbal Space Program 2\saves\
   ```
4. Pick the `.json` file for your active save.
5. Planner auto-syncs when the game autosaves.

#### Option B: Python Bridge **|||kRPC2 DOESN'T WORK AT THIS MOMENT|||**
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
| **Middle-click (MMB) + drag** | Pan view |
| **+/- buttons** | Zoom controls |
| **Reset button** | Reset to full view |
| **Click planet or moon** | Open body info |
| **Double click planet or moon** | Center camera on that body |
| **Right-click planet or moon** | Context menu (Set as Origin/Destination, Zoom in, Clear) |

## Notes

- **Coplanar approximation**: Inclination is shown in body info and visualized in the map, but transfer delta-v calculations remain simplified. Longitude of Ascending Node (LAN) is also not modeled as a separate value from Argument of Periapsis, so the 3D tilt of higher-inclination orbits (Moho, Eeloo, Dres) has a small, constant positioning error — see Known Issues in CHANGELOG.md.
- **Assists are rough estimates**: Gravity assist delta-v is simplified; real assists need detailed SOI entry/exit and relative velocity analysis.
- **Moon transfers**: Moon selections use the parent planet's heliocentric transfer window.
- **KSP2 UT**: The game uses a fixed 425-day year for calendar purposes, but UT is stored as physical seconds.

## Files

- **index.html** - The planner itself (self-contained, single file)
- **kerbalist_bridge.py** - Companion bridge for live kRPC2 sync
- **CHANGELOG.md** - Release history
- **README.md** - This file

## Bug Reporting

Found a bug? Click the **Submit bug report 🐛** button in the bottom-left corner. The modal lets you:
- Describe the bug (title + detailed description)
- Upload a screenshot to show the exact issue
- Auto-fill app version, browser, and timestamp
- Submit directly to GitHub (pre-filled issue form opens in a new tab)

No GitHub account needed to report — your issue helps us improve!

## Troubleshooting

**"No gravity assists detected"**
- Not all routes have good flyby opportunities.
- Try Kerbin → Jool or Eve → Jool for classic assist routes.
- The detector depends on current orbital positions and selected departure time.

**"Map doesn't appear on mobile"** **|||WORK IN PROGRESS|||**
- The 3D map canvas currently fails to initialize on some mobile browsers (iOS Safari, Android Chrome).
- Desktop browsers are unaffected.
- The sidebar/Controls view still works via the Map / Controls toggle; only the map itself is affected.

**"Live Sync won't connect"** **|||WORK IN PROGRESS|||**
- Check that KSP2 is running and kRPC2 is installed if using bridge mode.
- Verify `http://localhost:5005/ut` is reachable in your browser.
- If the save schema changed, inspect or update `ATTR_PATHS` in `kerbalist_bridge.py`.

**"Save file sync shows old time"** **|||WORK IN PROGRESS|||**
- Autosave intervals can be several minutes.
- Force an autosave by quicksaving if you need an immediate refresh.

**"Screenshot upload rejected"**
- Ensure file is a valid image (PNG, JPG, GIF, WebP, etc.)
- Check file size is under 5MB
- Browser must support FileReader API (all modern browsers do)

## Version History

See **CHANGELOG.md** for complete version history. Latest:

- **v3.7.0** (2026-09-25) - Bug reporting, screenshot support, HUD reorganization
- **v3.6.6** (2026-09-22) - Map centering fix
- **v3.6.5** (2026-09-16) - Live camera HUD, orbital ghosts
- ...and more in CHANGELOG.md

## Credits

Built on stock Kerbol orbital data and classical orbital mechanics.
Lambert solving uses a universal variable formulation.
Bug reporting integrates directly with GitHub Issues API (client-side only).

---

**Kerbalist v3.7.0** — Your KSP2 interplanetary transfer planner  
Single-file, offline-first, no backend required.
