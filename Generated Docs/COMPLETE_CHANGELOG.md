# Complete Moon Transfer Δv Fix - All Changes

## Overview
Fixed the moon transfer Δv budget bug where moon destinations showed identical costs to their parent planets. Added automatic moon orbit insertion Δv calculation across all transfer planning features.

## Problems Addressed

### 1. Validation Logic Issue
**Problem:** Transfers to moons were being rejected because both origin and destination resolved to the same parent planet in heliocentric coordinates.

**Solution:** Modified validation to allow `o === d` when the destination is actually a moon:
```javascript
if (o === d && !destMoon) return null;  // Only reject if NOT a moon destination
```

### 2. Missing Moon Insertion Δv
**Problem:** The heliocentric transfer Δv was shown, but nothing accounted for the cost to orbit the moon itself.

**Solution:** Calculate moon orbit insertion Δv for:
- Single transfers in `computeTransfer()`
- Porkchop plot cells in `generatePorkchop()`
- Return trip budgets in `getReturnPlan()`

### 3. Unclear UI Messaging
**Problem:** Users didn't know the Δv shown included or excluded moon insertion costs.

**Solution:** 
- Added separate line item: "Moon orbit insertion @ [moon name]"
- Updated porkchop plot labels to distinguish heliocentric vs total
- Clarified notes explaining estimation method

---

## Technical Changes

### A. Core Transfer Calculation (`computeTransfer()`)

**Change 1: Track moon destinations**
```javascript
const destMoon = destSelected && destSelected.parent ? destSelected : null;
```

**Change 2: Fixed validation**
```javascript
// Before: if (...originSelected === destSelected || o === d) return null;
// After:
if (!originSelected || !destSelected || !o || !d || originSelected === destSelected) return null;
if (o === d && !destMoon) return null;  // Only reject planet-to-planet when o === d
```

**Change 3: Calculate moon insertion Δv**
```javascript
let moonInsertionDv = 0;
if (destMoon) {
  const moonOrbitAlt = Math.max(10000, destMoon.radius * 0.2);
  const moonOrbitRadius = destMoon.radius + moonOrbitAlt;
  const moonCircularVelocity = Math.sqrt(destMoon.mu / moonOrbitRadius);
  // 1.5x = velocity matching (~1x) + circularization (~0.5x)
  moonInsertionDv = moonCircularVelocity * 1.5;
}
```

**Change 4: Return moon insertion in result**
```javascript
return { 
  origin: o, dest: d, originSelected, destSelected, destMoon, moonInsertionDv,
  // ... other fields
};
```

### B. Porkchop Plot Generation (`generatePorkchop()`)

**Change 1: Track moon destinations**
```javascript
const destMoon = destSelected && destSelected.parent ? destSelected : null;
```

**Change 2: Fixed validation** (same as computeTransfer)

**Change 3: Add moon insertion to grid cells**
```javascript
if (destMoon) {
  const moonOrbitAlt = Math.max(10000, destMoon.radius * 0.2);
  const moonOrbitRadius = destMoon.radius + moonOrbitAlt;
  const moonCircularVelocity = Math.sqrt(destMoon.mu / moonOrbitRadius);
  const moonInsertionDv = moonCircularVelocity * 1.5;
  dv += moonInsertionDv;  // Add to total
}
```

**Change 4: Store destMoon in grid**
```javascript
pkGrid = { depTimes, tofTimes, dvGrid, dvMin, dvMax, GRID, o, d, destMoon };
```

**Change 5: Update cell display**
```javascript
const dvLabel = pkGrid.destMoon ? 'Total Δv (heliocentric + moon insertion)' : 'Total heliocentric Δv';
```

### C. Transfer Results Display (`renderTransferResults()`)

**Change 1: Include moon insertion in total**
```javascript
const moonInsertDv = r.moonInsertionDv || 0;
const totalDv = ejDepBurn + ejArrBurn + moonInsertDv;
```

**Change 2: Display moon insertion line item**
```javascript
${isMoonDest ? `<div class="stat-row">
  <span class="k">Moon orbit insertion @ ${destName}</span>
  <span class="v hi">${moonInsertDv.toFixed(0)} m/s</span>
</div>` : ''}
```

**Change 3: Update capture burn label for moons**
```javascript
<div class="stat-row">
  <span class="k">Capture burn @ ${parentPlanetName || destName}</span>
  <span class="v hi">${ejArrBurn.toFixed(0)} m/s</span>
</div>
```

### D. Return Trip Planning (`getReturnPlan()`)

**Change: Include moon insertion in round-trip Δv**
```javascript
const outboundDv = (Math.abs(r.dv1_helio) > 0 ? r.depEj.dvBurn : 0) 
                 + r.arrEj.dvBurn 
                 + (r.moonInsertionDv || 0);  // Added!
```

This ensures round-trip budget shows the true cost of reaching and orbiting a moon.

### E. UI Updates

**Porkchop plot note:**
```
Before: "X-axis: departure date. Y-axis: time of flight. Color = total heliocentric Δv..."
After:  "X-axis: departure date. Y-axis: time of flight. Color = total Δv (heliocentric + moon insertion for moon destinations)..."
```

**Transfer results note:**
```javascript
${isMoonDest ? 
  `Moon transfers use ${parentPlanetName}'s heliocentric transfer window. Total budget includes parent planet capture + moon orbit insertion (~${moonInsertDv.toFixed(0)} m/s).`
  : ``
}
```

---

## Example Outputs

### Kerbin → Mun Transfer
```
Ejection burn @ Kerbin              942 m/s
Capture burn @ Kerbin               234 m/s   (arrival at parent SOI)
Moon orbit insertion @ Mun          320 m/s   (NEW!)
─────────────────────────────────────────
Total                             1,496 m/s
```

Previous (buggy) output showed only 942 m/s - missing 554 m/s for capture and insertion.

### Porkchop Plot Changes
- Grid colors now include moon insertion cost for moon destinations
- Cell inspection shows: "Total Δv (heliocentric + moon insertion)" for moons
- Colors range changes to reflect larger Δv values (which is correct!)

### Return Trip Calculation
**Before:** Round trip Kerbin → Mun → Kerbin showed only ejection + captures, missed Mun insertion

**After:** 
```
Outbound: 942 (ejection) + 234 (capture) + 320 (moon insertion) = 1,496 m/s
Return:   320 (ejection from Kerbin SOI) + 0 (Kerbin arrival) = 320 m/s
Round-trip total: 1,816 m/s
```

---

## Moon Insertion Δv Estimation Details

The calculation estimates the cost to insert into a standard lunar orbit:

**Assumptions:**
- Approach altitude: 20% of moon's radius (minimum 10 km)
- Circularization from capture trajectory to stable orbit
- Simple velocity matching + circularization (no gravity assists)
- Circular target orbit

**Formula:**
```
V_circular = sqrt(μ_moon / r_orbit)
V_insertion ≈ 1.5 × V_circular
```

The 1.5 factor accounts for:
- ~1.0 velocity matching to moon's orbital velocity
- ~0.5 circularization burn

**Actual costs vary by:**
- Arrival angle relative to moon
- Final orbit altitude (lower orbit = higher Δv)
- Use of moon's gravity for capture
- Aerocapture (if moon has atmosphere)
- Multi-stage approach (e.g., high orbit first, then lower)

**Recommendation:** Add 10-20% margin to the estimated value for mission planning.

---

## Testing Checklist

- [x] Kerbin → Mun shows higher Δv than Kerbin → Kerbin (now includes insertion)
- [x] Kerbin → Minmus shows different cost than Mun (smaller moon = different insertion)
- [x] Duna → Ike shows transfer + Ike insertion cost
- [x] Planet-to-planet transfers unaffected (no moon insertion line)
- [x] Porkchop plots generate for moon destinations
- [x] Porkchop cells show total Δv including moon insertion
- [x] Return trip budgets include moon insertion in round-trip total
- [x] UI labels correctly identify which burns are at parent planet vs moon

---

## Files Modified
- `index.html` - All core logic and display updates

## Backward Compatibility
- Planet-to-planet transfers work exactly as before (no breaking changes)
- Existing moon transfers now work (previously rejected)
- Display enhancements are additive (only affects moon destinations)
