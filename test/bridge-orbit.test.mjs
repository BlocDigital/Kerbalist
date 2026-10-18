// Tests the orbit-from-state maths used for the bridge rings (part 331a). Uses real values from a KSP2 save.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './load-parts.mjs';

const { bridgeOrbitLoop, applyBridgeAxisMap, BRIDGE_TO_SCENE_MAP } =
  loadParts(['331a-js-08a-bridge-frame.js'], ['bridgeOrbitLoop', 'applyBridgeAxisMap', 'BRIDGE_TO_SCENE_MAP']);

const KERBOL_MU = 1.1723327948324918e18;
const KERBIN = { r: { x: -5566401857.544323, y: 0, z: -12408498110.127804 }, v: { x: 8471.1810775017129, y: 0, z: -3800.137427342057 } };
const DUNA   = { r: { x: 11455918304.858368, y: -21090154.301386468, z: 16978674499.80431 }, v: { x: -6511.7479391509332, y: 1.8381609141678008, z: 3938.0707410388013 } };

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

test('the orbit passes through the body state it was built from', () => {
  for (const s of [KERBIN, DUNA]) {
    const loop = bridgeOrbitLoop(s.r, s.v, KERBOL_MU, 7200);
    const best = Math.min(...loop.map(p => dist(p, s.r)));
    assert.ok(best / Math.hypot(s.r.x, s.r.y, s.r.z) < 1e-3, `closest sample ${best} m off`);
  }
});

test('Kerbin (circular) gives a constant radius of about 13.6 Gm', () => {
  const loop = bridgeOrbitLoop(KERBIN.r, KERBIN.v, KERBOL_MU, 720);
  for (const p of loop) {
    const rr = Math.hypot(p.x, p.y, p.z);
    assert.ok(Math.abs(rr - 13.6e9) / 13.6e9 < 1e-3, `radius ${rr}`);
  }
});

test('Duna (eccentric) peri/apo come from the state vector, and the ring is planar', () => {
  const loop = bridgeOrbitLoop(DUNA.r, DUNA.v, KERBOL_MU, 3600);
  const radii = loop.map(p => Math.hypot(p.x, p.y, p.z));
  const peri = Math.min(...radii), apo = Math.max(...radii);
  assert.ok(apo > peri && peri > 19e9 && apo < 22e9, `peri ${peri} apo ${apo}`);
  // The orbit normal is fixed, so every point should be perpendicular to it.
  const h = { x: DUNA.r.y * DUNA.v.z - DUNA.r.z * DUNA.v.y, y: DUNA.r.z * DUNA.v.x - DUNA.r.x * DUNA.v.z, z: DUNA.r.x * DUNA.v.y - DUNA.r.y * DUNA.v.x };
  for (const p of loop.filter((_, i) => i % 300 === 0)) {
    const dot = (p.x * h.x + p.y * h.y + p.z * h.z) / (Math.hypot(p.x, p.y, p.z) * Math.hypot(h.x, h.y, h.z));
    assert.ok(Math.abs(dot) < 1e-6, `not planar: ${dot}`);
  }
});

test('the bridge-to-scene map keeps Kerbin prograde (same sense as the app)', () => {
  // Angular momentum z-component of the mapped orbit: positive means counter-clockwise, i.e. prograde.
  const rS = applyBridgeAxisMap(BRIDGE_TO_SCENE_MAP, KERBIN.r), vS = applyBridgeAxisMap(BRIDGE_TO_SCENE_MAP, KERBIN.v);
  const hy = rS.z * vS.x - rS.x * vS.z;
  assert.ok(hy > 0, `angular momentum y ${hy}`);
  const hyBridge = KERBIN.r.z * KERBIN.v.x - KERBIN.r.x * KERBIN.v.z;
  assert.ok(hyBridge < 0, 'raw bridge frame is clockwise, so the flip is required');
});
