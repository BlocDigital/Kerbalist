# Quick Fix: Orbital Synchronization in 5 Steps

## TL;DR

The planets in Kerbalist and KSP2 are at different angles. This is an **epoch offset issue** — the starting positions (m0Deg values) don't match.

---

## The 5-Step Fix

### Step 1: Get Your Actual Orbital Positions

1. Go to KSP2 at **UT = 0** (Year 1, Day 1, 00:00:00) or any known UT
2. Open Map View
3. For each major planet, estimate its orbital angle:
   - 0° = to the right
   - 90° = up
   - 180° = to the left  
   - 270° = down

**Example recording:**
```
Kerbin: 183°
Duna: 185°
Jool: 176°
```

### Step 2: Open Kerbalist Console

1. Press **F12** (or right-click → Inspect → Console)
2. You're in the browser console

### Step 3: Calculate Corrections

Copy and paste this into the console (replacing the angles with yours):

```javascript
calculateAllM0Corrections([
  { bodyName: "Kerbin", actualTheta: 183 },
  { bodyName: "Duna", actualTheta: 185 },
  { bodyName: "Jool", actualTheta: 176 }
])
```

**Output:** Shows you the corrected m0Deg values

### Step 4: Generate Corrected Code

Paste this into the console:

```javascript
generateCorrectedOrbitalData(corrections)
```

**Output:** Copy the JavaScript code it generates

### Step 5: Update index.html

1. Open `index.html` in a text editor
2. Find the `const RAW_PLANETS = [` section (around line 1335)
3. Update all `m0Deg` values with the corrected ones from Step 4
4. Save the file
5. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
6. Test: Set Kerbalist to UT=0 and verify positions match

---

## That's it!

After Step 5, Kerbalist will show the correct orbital positions at any UT, and all transfer calculations will be accurate.

---

## If You Don't Have UT=0

If you're already deep into your game and can't easily go back to Year 1:

```javascript
// Convert your game time to seconds first
// Example: Year 2, Day 50, 12:30:00
const UT_sec = (2 * 426 + 50) * 86400 + 12 * 3600 + 30 * 60;

// Then use the same command with your actual positions
calculateAllM0Correction([
  { bodyName: "Kerbin", actualTheta: 185 },
  { bodyName: "Duna", actualTheta: 190 }
])
```

The calculator automatically uses the current in-game UT.

---

## Visual Check

Before and after Step 5:

**Before:**
```
Kerbalist Map View:  Kerbin at 180°
KSP2 Map View:       Kerbin at 183°
❌ Not synchronized
```

**After:**
```
Kerbalist Map View:  Kerbin at 183° ✓
KSP2 Map View:       Kerbin at 183° ✓
✅ Synchronized!
```

---

## Help! It Still Doesn't Work

- **Angle measurement:** Try using a different reference point (like where another planet is)
- **Browser cache:** Do a hard refresh (Ctrl+Shift+Delete to clear cache, then refresh)
- **Copy/paste errors:** Double-check that the m0Deg values were copied correctly
- **Moons:** If moons are off too, update their m0Deg values the same way (all currently 0)

---

## Why This Fixes It

Kerbalist calculates positions using: `M(t) = m0 + n*t`

If your game's actual starting position doesn't match Kerbalist's m0, then at every UT value, Kerbalist will be offset by that constant angle.

Updating m0Deg to match your game's actual starting position means the formula works correctly for all future times.
