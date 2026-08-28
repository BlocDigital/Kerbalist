# Fixing Orbital Epoch Desynchronization in Kerbalist

## The Problem

Kerbalist's orbital positions don't match your in-game positions because the **mean anomaly at epoch (m0Deg)** values don't correspond to your game's actual starting positions.

All planets in Kerbalist have:
```
m0Deg: 180  (at various eccentricities)
```

But this only works if the actual KSP2 game positions at UT=0 match these values. If they don't, all calculations will be offset by a constant angle for the entire game.

## Why This Happens

- Kerbalist's orbital data was set up for a specific game configuration
- Different KSP2 versions or mod setups may have different initial positions
- The m0Deg values were calculated at some point, but may not match your current save file

## How to Verify

### Step 1: Check Kerbalist at UT=0
Open your browser console (F12 or right-click → Inspect → Console) and run:

```javascript
debugOrbitalState()
```

This will show what Kerbalist thinks the positions are at UT=0, in orbital angles (degrees).

### Step 2: Check In-Game at UT=0

1. Go to your KSP2 game at **Year 1, Day 1, 00:00:00** (UT = 0)
2. Use Map View to see the orbital positions
3. For each planet, note its approximate angle relative to some reference direction

### Step 3: Compare

If the angles in Kerbalist don't match your game, the m0Deg values need to be recalculated.

## How to Fix It

### Option A: Manual Recalibration (Recommended for accuracy)

1. **Get reference positions from your game at UT=0**
   - For each planet, record its orbital position angle in Map View
   - Reference: 0° is to the right, 90° is up, 180° is left, 270° is down

2. **Calculate the correction**
   
   For each planet:
   ```
   Correction = (Actual angle in game) - (Angle Kerbalist shows at UT=0)
   New m0Deg = Current m0Deg + Correction
   ```

3. **Update the RAW_PLANETS data**
   
   In `index.html`, find the planet definition and update m0Deg:
   
   ```javascript
   {
     name: 'Kerbin', ..., m0Deg: 180, ...  // Change this
   }
   ```

### Option B: Auto-Recalibrate from Current UT

If you're already at a specific UT in the game and can read the current positions:

1. Open Kerbalist's console and run:
   ```javascript
   window.currentUT = 1234567890  // (or whatever your game UT is in seconds)
   debugOrbitalState()
   ```

2. Compare Kerbalist's predicted positions at that UT with your actual in-game positions

3. Calculate the offset for each planet and update m0Deg values

## Mathematical Verification

The orbital calculation uses:
```
M(t) = m0 + n * t

Where:
- M(t) = Mean anomaly at time t
- m0 = Mean anomaly at epoch (t=0)
- n = Mean motion = 2π / orbital_period
- t = Time in seconds since epoch
```

If KSP2 and Kerbalist use the same epoch (UT=0) but show different positions, the m0 values are different.

## Example

Let's say:
- **At UT=0, Kerbalist shows Kerbin at theta = 180°**
- **At UT=0, KSP2 shows Kerbin at 183°**
- **Correction needed = 183° - 180° = +3°**
- **New m0Deg = 180 + 3 = 183**

## After Fixing

Once you update the m0Deg values to match your game's starting positions:

1. Save your changes to `index.html`
2. Refresh the page
3. Set Kerbalist to UT=0
4. Verify that the displayed positions now match your game

Then as time advances (UT increases), both Kerbalist and KSP2 should show planets moving in sync.

## Testing

After updating the m0Deg values:

1. Set Kerbalist to your current in-game UT
2. Take a screenshot of Kerbalist's map
3. Go to your game at that same UT
4. Compare the positions visually
5. They should now match!

## Note on Moons

Moons all have `m0Deg: 0` in Kerbalist, which may also be wrong if your game's moon positions at UT=0 differ. Apply the same correction process to moon m0Deg values.

## Where to Find the Data to Update

In `index.html`, search for:

```javascript
const RAW_PLANETS = [
  // Update m0Deg in these definitions
  { name: 'Kerbin', ..., m0Deg: 180, ... },
  { name: 'Duna', ..., m0Deg: 180, ... },
  // etc.
];

const RAW_MOONS = [
  // And these
  { name: 'Mun', ..., m0Deg: 0, ... },
  // etc.
];
```

Simply replace the `m0Deg` values with your corrected angles.
