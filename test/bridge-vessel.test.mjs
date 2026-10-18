// Tests the active-vessel apsides and map tag (part 331a), using values from the KSP2 save.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './load-parts.mjs';

const { vesselApsides, vesselAcronym } =
  loadParts(['331a-js-08a-bridge-frame.js'], ['vesselApsides', 'vesselAcronym']);

test('circular orbit: apoapsis and periapsis both equal the altitude', () => {
  const mu = 3.5316e12, R = 600000, h = 300000, r = R + h;
  const v = Math.sqrt(mu / r);
  const { ap, pe } = vesselApsides(h, v, v, R, mu);
  assert.ok(Math.abs(ap - h) < 1, `ap ${ap}`);
  assert.ok(Math.abs(pe - h) < 1, `pe ${pe}`);
});

test('Tylo vessel from the save: apsides between Kerbin and Jool orbits', () => {
  // altitude 71,540,674,169 m, horizontal 2274.02 m/s, orbital 2282.04 m/s, around Kerbol.
  const { ap, pe } = vesselApsides(71540674169.286087, 2274.0200088308638, 2282.0441611183387, 261600000, 1.1723327948324918e18);
  assert.ok(ap > 6.5e10 && ap < 7.5e10, `ap ${ap}`);
  assert.ok(pe > 1.0e10 && pe < 1.6e10, `pe ${pe}`);
  assert.ok(ap > pe);
});

test('unbound speed returns null (no apoapsis)', () => {
  assert.equal(vesselApsides(100000, 5000, 5000, 600000, 3.5316e12), null);
});

test('map tag takes initials and keeps numbered parts', () => {
  assert.equal(vesselAcronym('Superlight-Survey-Scan+Land'), 'SSSL');
  assert.equal(vesselAcronym('Bloc_Duna_Mysterio_complete-13'), 'BDMC13');
  assert.equal(vesselAcronym(''), '?');
});

test('near-circular Kerbin orbit from the screenshot: apsides match the in-game HUD within 50 km', () => {
  // In-game: AP 2,866.90 km, PE 2,840.00 km (altitudes). Speed 1,010 m/s relative to the body's centre.
  const v = 1010, vr = 0;
  const vt = Math.sqrt(Math.max(0, v * v - vr * vr));
  const { ap, pe } = vesselApsides(2856000, vt, v, 600000, 3.5316e12);
  assert.ok(Math.abs(ap / 1000 - 2866.9) < 50, `ap ${ap / 1000} km`);
  assert.ok(Math.abs(pe / 1000 - 2840.0) < 50, `pe ${pe / 1000} km`);
});
