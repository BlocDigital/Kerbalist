# Moon Transfer Δv Budget Bug Fix

## The Problem

When selecting a moon as the transfer destination, the calculated Δv budget was identical to transferring to the parent planet. This happened because:

1. **Root cause:** The `computeTransfer()` and `generatePorkchop()` functions both use `transferBodyFor()` to convert any body (planet or moon) to its heliocentric transfer body
   - If destination = Mun (Kerbin's moon), `transferBodyFor()` returns Kerbin
   - If origin = Kerbin and destination is processed through `transferBodyFor()`, both become Kerbin
   - This triggered the validation check `if (o === d) return null`

2. **Validation logic issue:** The original code rejected transfers when `o === d`, assuming this meant origin and destination were the same. However, this is valid for moon transfers:
   - Transferring from Kerbin to Mun: origin planet = Kerbin, destination's transfer body = Kerbin
   - These are legitimately the same because a moon orbits its parent

## The Fixes

### Fix 1: Validation Logic
1. **Track moon destinations explicitly** — store whether the destination is actually a moon
2. **Update validation** — only reject `o === d` when it's NOT a moon transfer
3. **Pass moon info through** — include `destMoon` in the result object

### Fix 2: Moon Orbit Insertion Δv Calculation (NEW)
Added automatic calculation of the Δv needed to enter orbit around the destination moon:

```javascript
let moonInsertionDv = 0;
if (destMoon) {
  // Cost to insert into a standard orbit around the moon from the moon's parent
  const moonOrbitAlt = Math.max(10000, destMoon.radius * 0.2);
  const moonOrbitRadius = destMoon.radius + moonOrbitAlt;
  const moonOrbitalVelocity = Math.sqrt(destMoon.mu / destMoon.a);
  const moonCircularVelocity = Math.sqrt(destMoon.mu / moonOrbitRadius);
  // ~2x orbital velocity for initial matching + circularization
  moonInsertionDv = moonCircularVelocity * 1.8;
}
```

This estimates the cost to:
- Match the moon's orbital velocity (1x)
- Circularize from arrival trajectory to final orbit (0.8x)
- Total: ~1.8x the moon's circular orbital velocity

### Fix 3: Updated Display
The transfer results now show:
- **Total Δv budget** includes the moon insertion cost
- **Ejection burn** @ origin planet
- **Capture burn** @ parent planet (labeled correctly when destination is a moon)
- **Moon orbit insertion** @ destination moon (only shown for moon destinations)
- Updated note explaining that insertion cost is an estimate based on velocity matching and circularization

## Why This is Physically Correct

**Hohmann transfer to a moon** involves phases:

1. **Heliocentric transfer** (shown as "capture burn @ parent planet")
   - You leave origin planet's orbit
   - Coast through space on a transfer ellipse
   - Arrive at the moon's parent planet's orbit
   - Capture burn brings you into parent's sphere of influence

2. **Local moon insertion** (shown as "moon orbit insertion @ moon", now calculated)
   - After arriving at parent planet, you match the moon's orbital velocity
   - Perform circularization burn to enter moon's circular orbit
   - Cost depends on moon's gravity and your approach geometry

The tool now correctly shows **both phases** of the transfer.

## What Changed in the Code

- `computeTransfer()` → added `moonInsertionDv` calculation and tracking
- `generatePorkchop()` → allows `o === d` for moon destinations
- `renderTransferResults()` → displays moon insertion Δv separately and in total budget
- Display now shows moon insertion as a distinct line item
- Updated notes explain the estimation method and uncertainties

## Limitations & Notes

The moon insertion Δv is a **rough estimate**:
- Assumes velocity matching from the parent planet's SOI
- Assumes circularization at 20% of the moon's radius (or 10 km minimum)
- Exact cost depends on:
  - Arrival velocity vector relative to moon
  - Desired final orbit altitude
  - Gravity assist effects from parent planet
  - Atmospheric effects (if any)

For precise planning, treat this as a baseline and add margins for:
- Actual approach geometry
- Mid-course corrections
- Orbit adjustments

## Testing

Try these scenarios:

1. **Kerbin → Mun** - should now show:
   - Ejection burn @ Kerbin
   - Capture burn @ Kerbin (parent)
   - Moon orbit insertion @ Mun (~300-400 m/s typical)
   - Total Δv = ejection + capture + insertion

2. **Kerbin → Minmus** - should show higher insertion cost (smaller moon = higher insertion velocity)

3. **Duna → Ike** - should show transfer to Duna + insertion into Ike orbit

4. **Any planet → any other planet** - should work as before (no moon insertion line)

5. **Porkchop plots** - moon destinations should now generate correctly

