# Kerbalist — KSP2 Interplanetary Transfer Planner

**Live sync-capable transfer calculator with optional gravity assist optimization.**

## Features

### Core Transfer Planning
- **All 7 stock planets** (Moho, Eve, Kerbin, Duna, Dres, Jool, Eeloo) with accurate orbital data
- **Hohmann-style direct transfers** — shows phase angle, transfer time, Δv budget, and window countdown
- **Live time control** — warp clock, manual UT input, or sync to your running KSP2 save (two methods)
- **Interactive 3D map** — pan, zoom, watch planets orbit in real-time as you plan

### Gravity Assists (NEW)
- **Automatic detection** — finds planets positioned favorably for flybys on your chosen route
- **Multi-leg visualization** — see both direct and assisted transfer arcs on the map simultaneously
- **Δv savings calculation** — shows fuel economy vs. time tradeoff for each assist option
- **Ghost planets** — displays assist planet position and SOI at the encounter time
- **Per-leg timing** — know exactly how long each segment of the multi-leg journey takes

## How to Use

### Basic Transfer
1. Open **Kerbalist-GA.html** in your browser
2. Select **Origin** and **Destination** from the top dropdowns
3. Click **Plan Transfer** to compute the direct Hohmann route
4. The map shows the transfer arc (green dashed line)
5. Check **Transfer** tab for Δv, flight time, and window countdown

### Gravity Assists
1. After planning a transfer, open the **Assist Options** tab
2. If available for your route, assists will list each candidate planet with:
   - Flight time (total and time added vs. direct)
   - Δv savings in m/s and percentage
3. Click an assist to select it — the map updates to show:
   - The multi-leg trajectory (violet arcs for each leg)
   - Ghost planet at the assist encounter
   - SOI of the assist planet (dashed circle)
4. The **Transfer** tab updates to show the assist-specific Δv and timing

### Sync to Your Save

#### Option A: Manual Time Entry
Just type into the **Sync to save** boxes and hit **Set** — no live sync needed, but you update manually.

#### Option B: Save-File Watcher (Easiest, Chrome/Edge only, not tested yet)
1. Click the new **Live Sync** button in the header
2. Click **Choose Save File…**
3. Navigate to your KSP2 persistent save:
   ```
   C:\Users\[User]\AppData\LocalLow\Intercept Games\Kerbal Space Program 2\saves\
   ```
4. Pick the `.json` file for your active save
5. Planner auto-syncs every 4 seconds when the game autosaves


## Map Controls

| Action | Result |
|--------|--------|
| **Scroll wheel** | Zoom in/out |
| **Click & drag** | Pan around |
| **+/− buttons** | Zoom (slower) |
| **⤾ button** | Reset to full view |
| **Click planet name** | Open its info panel |

## Notes

- **Coplanar approximation**: All orbits treated as 2D (ecliptic plane). Inclination shown in body info but not used in Δv calculations.
- **Assists are rough estimates**: The gravity assist Δv is simplified; real assists need detailed SOI entry/exit and relative velocity analysis.
- **Porkchop plots** (full grid of all departure/TOF combos) not yet in GA version — available in earlier version if needed.
- **KSP2 UT**: The game uses a fixed 426-day year for calendar purposes, but UT (physical time) is in seconds and doesn't drift.

## Files

- **index.html** — The planner itself (single file, no dependencies)

## Keyboard Shortcuts

Currently none — all UI is clickable. May add arrow keys for time scrubbing in a future update.

## Troubleshooting

**"No gravity assists detected"**
- Not all routes have good flyby opportunities
- Try Kerbin → Jool (outbound) or Eve → Jool (inbound) for classic assists
- The detector finds assists positioned angularly between origin and destination at the midpoint of the transfer

**"Save file sync shows old time"**
- Autosave interval in KSP2 is typically 5+ minutes
- The planner re-reads every 4 seconds but can only sync when the file changes
- Force an autosave by quicksaving (F5) if you need an immediate refresh

## Credits

Built on accurate stock Kerbol orbital data from the KSP wiki.
Lambert solver uses universal variable formulation (Battin's method).
Hohmann transfer phase calculation from classical orbital mechanics.
