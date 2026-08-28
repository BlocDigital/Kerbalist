# Orbital Epoch Desynchronization Issue - Complete Guide

## Problem Summary

When you set Kerbalist to the same in-game UT as your KSP2 game, the orbital positions shown in Kerbalist don't match your game. The planets appear at completely different angles.

**Root Cause:** The `m0Deg` (mean anomaly at epoch) values in Kerbalist's orbital data don't correspond to the actual orbital positions at UT=0 in your KSP2 game.

---

## How Orbital Position Calculation Works

Kerbalist calculates a body's orbital position using this formula:

```
M(t) = m0 + n * t

Where:
  M(t)  = Mean anomaly at time t (in radians)
  m0    = Mean anomaly at epoch (t=0) 
  n     = Mean motion = 2π / orbital_period (radians/second)
  t     = Time in seconds since epoch (UT=0)
```

The **epoch is assumed to be at UT=0** (Year 1, Day 1, 00:00:00 in KSP2).

**The issue:** The m0 values baked into Kerbalist were calculated from some reference point, but they may not match your specific KSP2 game's starting configuration.

Example:
```
// In Kerbalist:
Kerbin: m0Deg = 180°

// But in your game at UT=0:
Kerbin actual position = 183°

// Therefore:
Offset = 183° - 180° = +3°
```

This +3° offset applies at **every** UT value. So at UT=1 year + 18 days, the positions will still be 3° off from reality.

---

## How to Detect and Fix

### Step 1: Check What Kerbalist Predicts

Open your browser's developer console (F12, then go to Console tab) and run:

```javascript
debugOrbitalState()
```

This will print out what Kerbalist thinks the orbital positions are at UT=0:

```
=== ORBITAL STATE AT UT=0 ===
Moho: theta=180.0° (m0=180.0°, orient=85.0°)
Eve: theta=180.0° (m0=180.0°, orient=15.0°)
Kerbin: theta=180.0° (m0=180.0°, orient=0.0°)
Duna: theta=180.0° (m0=180.0°, orient=135.5°)
...
```

The **theta** value is the orbital angle Kerbalist calculates.

### Step 2: Check Actual Positions in KSP2

1. **In KSP2**, set your game time to **UT = 0** (Year 1, Day 1, 00:00:00)
2. **Switch to Map View**
3. **For each planet**, record its orbital angle relative to a fixed reference

**How to measure angle in KSP2 Map View:**
- Imagine a circle around the Sun
- 0° is to the right (3 o'clock)
- 90° is up (12 o'clock)
- 180° is to the left (9 o'clock)
- 270° is down (6 o'clock)

For example, if Kerbin appears at the bottom-left, that's roughly 225°.

### Step 3: Calculate Corrections

For each planet, use Kerbalist's calculator:

```javascript
// Example: At UT=0, Kerbin is actually at 183° in your game
calculateM0Correction("Kerbin", 183, 0)
```

This will output:
```javascript
{
  bodyName: "Kerbin",
  current_m0Deg: "180.00",
  predicted_theta_deg: "180.00",
  actual_theta_deg: "183.00",
  offset_deg: "3.00",
  corrected_m0Deg: "183.00",
  explanation: "Change m0Deg from 180.0 to 183.0"
}
```

**This means:** Change Kerbin's `m0Deg` from 180 to 183.

### Step 4: Get All Corrections at Once

Create an array of corrections. In the console, run:

```javascript
const corrections = calculateAllM0Corrections([
  { bodyName: "Moho", actualTheta: 182 },
  { bodyName: "Eve", actualTheta: 181 },
  { bodyName: "Kerbin", actualTheta: 183 },
  { bodyName: "Duna", actualTheta: 185 },
  { bodyName: "Dres", actualTheta: 190 },
  { bodyName: "Jool", actualTheta: 176 },
  { bodyName: "Eeloo", actualTheta: 192 }
]);
```

### Step 5: Generate Corrected Code

Once you have all the corrections, run:

```javascript
generateCorrectedOrbitalData(corrections)
```

This will output JavaScript code showing all planets with their corrected m0Deg values:

```javascript
const RAW_PLANETS = [
  { name: 'Moho', ..., m0Deg: 182.0, ... },
  { name: 'Eve', ..., m0Deg: 181.0, ... },
  { name: 'Kerbin', ..., m0Deg: 183.0, ... },
  // etc.
];
```

### Step 6: Update Kerbalist's Code

1. Open `index.html` in a text editor
2. Find this section (around line 1335):
   ```javascript
   const RAW_PLANETS = [
     { name: 'Moho', color: '#b98a56', a: 5263138304, ..., m0Deg: 180, ... },
     ...
   ];
   ```

3. Replace the `m0Deg` values with the corrected values from Step 5

4. **Save the file**

5. **Refresh your browser** to load the updated code

6. **Test:** Set Kerbalist to UT=0 and verify the positions now match your game

---

## Alternative: Quick Fix Without UT=0

If you can't easily get to UT=0 in your game, you can use any known UT:

1. **In your game**, note:
   - Current UT (Year, Day, Time)
   - Position of each planet (estimated angle in Map View)

2. **Convert the game time to seconds**:
   - 1 year = 426 days (in KSP)
   - 1 day = 86,400 seconds
   - Formula: `UT_seconds = (years * 426 + days) * 86400 + hours * 3600 + minutes * 60 + seconds`

3. **In Kerbalist's console**, set the current UT:
   ```javascript
   UT = 12345678;  // Your calculated UT in seconds
   ```

4. **Run the calculator**:
   ```javascript
   calculateAllM0Corrections([
     { bodyName: "Kerbin", actualTheta: 185 },
     ...
   ])
   ```

The calculator automatically uses the current `UT` value to compute corrections.

---

## Verification

After updating the m0Deg values:

1. **Set Kerbalist to your current in-game UT**
2. **Take a screenshot of Kerbalist's map**
3. **Go to KSP2 at the same UT**
4. **Compare the two visually**
5. **They should now match!**

---

## Why This Matters

Once the orbital epoch is synchronized:
- Transfer windows calculated by Kerbalist will be accurate
- Orbital positions at any future UT will match your game
- You can plan missions with confidence that the timing is correct
- Delta-v calculations will be for the actual windows, not off-time windows

---

## Technical Details

### Mean Anomaly to Orbital Angle Conversion

Kerbalist uses this process:

```
1. Calculate mean anomaly:     M(t) = m0 + n * t
2. Solve Kepler's equation:    E = solveKepler(M, e)  (eccentric anomaly)
3. Calculate true anomaly:     ν = atan2(√(1-e²)sin(E), cos(E)-e)
4. Calculate orbital angle:    θ = ν + ω  (true anomaly + argument of periapsis)
```

If step 1 starts with wrong `m0`, all subsequent steps produce wrong results.

### Circular Orbits vs Eccentric Orbits

For circular orbits (e=0):
- True anomaly ν ≈ Mean anomaly M
- The angle directly corresponds to the orbital position

For eccentric orbits:
- True anomaly ν ≠ Mean anomaly M
- The body moves fastest near periapsis and slowest near apoapsis
- But **the offset between Kerbalist and your game remains constant**

So the fix works for all eccentricities.

---

## Troubleshooting

**Q: The angle in Map View seems different from theta° in Kerbalist**

A: Map View may use a different reference frame. Try measuring from Kerbin's current position as reference, not from an absolute cardinal direction.

**Q: The correction doesn't work**

A: Make sure:
1. You're measuring the angle correctly (0° right, 90° up, 180° left, 270° down)
2. The UT value you're using matches exactly
3. You refreshed the browser after editing `index.html`
4. There are no typos in the m0Deg values

**Q: Should I update moon m0Deg values too?**

A: Yes, use the same process for `RAW_MOONS`. Moons all have `m0Deg: 0` currently, which may also be wrong.

---

## Console Functions Reference

| Function | Purpose |
|---|---|
| `debugOrbitalState()` | Show current orbital state at UT=0 |
| `calculateM0Correction(bodyName, actualTheta, knownUT)` | Calculate corrected m0Deg for one body |
| `calculateAllM0Corrections(array)` | Calculate corrections for multiple bodies at once |
| `generateCorrectedOrbitalData(corrections)` | Generate code snippet to paste into index.html |

---

## Files Modified

- `index.html` - Added diagnostic functions (debugOrbitalState, calculateM0Correction, etc.)

No changes to core orbital calculations; only additions for diagnosis and correction.
