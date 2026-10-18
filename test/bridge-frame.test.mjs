// Tests the telemetry-bridge frame fit (part 336). Pure maths, no DOM or Three.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './load-parts.mjs';

const { chooseBridgeAxisMap, applyBridgeAxisMap, bridgeAxisCandidates } =
  loadParts(['331a-js-08a-bridge-frame.js'], ['chooseBridgeAxisMap', 'applyBridgeAxisMap', 'bridgeAxisCandidates']);

// Deterministic "planet" vectors in scene units, spread so no two candidate maps look alike.
const expected = [
  { x: 1.0, y: 0.1, z: -0.3 }, { x: -0.4, y: 0.7, z: 0.2 }, { x: 0.2, y: -0.9, z: 0.5 },
  { x: 0.6, y: 0.3, z: 0.8 }, { x: -0.8, y: -0.2, z: -0.6 }, { x: 0.05, y: 0.4, z: -0.95 }
];

test('there are 48 signed permutations', () => {
  assert.equal(bridgeAxisCandidates().length, 48);
});

test('recovers a known mirrored, permuted convention exactly', () => {
  const truth = { perm: [2, 0, 1], sign: [1, -1, 1] };          // a plausible Unity-style remap
  const pairs = expected.map(e => ({ bridge: e, expected: applyBridgeAxisMap(truth, e) }));
  const fit = chooseBridgeAxisMap(pairs);
  assert.ok(fit.relError < 1e-12, `expected a perfect fit, got ${fit.relError}`);
  for (const p of pairs) {
    const m = applyBridgeAxisMap(fit.map, p.bridge);
    assert.ok(Math.abs(m.x - p.expected.x) < 1e-12 && Math.abs(m.y - p.expected.y) < 1e-12 && Math.abs(m.z - p.expected.z) < 1e-12);
  }
});

test('small analytic-model error still fits within the 5% tolerance', () => {
  const truth = { perm: [0, 2, 1], sign: [-1, 1, 1] };
  const pairs = expected.map((e, i) => {
    const noisy = { x: e.x * (1 + 0.004 * Math.sin(i)), y: e.y, z: e.z * (1 - 0.003 * i) };
    return { bridge: applyBridgeAxisMap(truth, noisy), expected: e };
  });
  const fit = chooseBridgeAxisMap(pairs);
  assert.ok(fit.relError < 0.05, `relError ${fit.relError}`);
  assert.deepEqual(fit.map, truth);
});

test('inconsistent data is rejected by a large relative error', () => {
  const pairs = expected.map((e, i) => ({
    bridge: { x: Math.cos(i * 1.7), y: Math.sin(i * 2.3), z: Math.cos(i * 0.9) * 2 },
    expected: e
  }));
  const fit = chooseBridgeAxisMap(pairs);
  assert.ok(fit.relError > 0.05, `relError ${fit.relError} should be above tolerance`);
});
