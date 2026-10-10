# Changelog

## [4.1] - 2026-10-07

### Added
- **HUD Widgets**: Transfer info cards (Next Transfer Window, Phase Angle, Ejection Angle, Transfer Time, Ghost Body) can now be pinned to the map as draggable, resizable widgets.
- **On/Off toggle buttons**: Each transfer card has an ON/OFF button in the sidebar. Only one widget of each type can be spawned—clicking ON adds it to the map, OFF removes it.
- **Pin functionality**: Click the 📌 button on a widget to toggle "pinned" mode. Pinned widgets have reduced opacity (10%), non-draggable header, and fixed positioning.
- **Persistent state**: Widget positions, sizes, and pin states are saved to localStorage and restored on page reload.

### Changed
- **Content layout**: HUD widget content is now centered with responsive font sizing that scales to container size.
- **Movability**: Widgets can be dragged from any surface (not just the header). Pinned widgets cannot be moved.
- **T-minus display**: Countdown timer is now 150% larger (1.8em) and uses the same cyan color as the sidebar for visual consistency.
- **Default positions**: All widgets now have sensible default positions on the map, properly spaced to avoid overlap.

### Fixed
- **Sidebar button blinking**: Button state no longer updates on every DOM change—only when you actually toggle ON/OFF.
- **Sidebar content shifting**: Eliminated DOM re-renders that caused sidebar cards to move during widget state updates.
- **HUD element cleanup**: Removed duplicate headers and buttons from pinned widget content.

### Known Issues
- Transfers are flat (no orbital tilt). Duna and Eve are fine, but Moho (7°) and Eeloo (6°) won't intercept exactly.
- The return-trip estimate still uses the quick circular-orbit numbers.
- The map doesn't render on mobile browsers, and the kRPC2 bridge doesn't work yet (see 3.6.4).

---

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

### Known Issues
- Transfers are flat (no orbital tilt). Duna and Eve are fine, but Moho (7°) and Eeloo (6°) won't intercept exactly.
- The return-trip estimate still uses the quick circular-orbit numbers.
- The map doesn't render on mobile browsers, and the kRPC2 bridge doesn't work yet (see 3.6.4).
