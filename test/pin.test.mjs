// Pin tests for the pure math parts (311 data, 312 orbital mechanics, 313 clock constants).
// Run: node --test test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './load-parts.mjs';

const K = loadParts(
  ['311-js-01-data.js', '312-js-02-orbital-mechanics.js', '313-js-03-sim-clock.js'],
  ['KERBOL', 'PLANETS', 'MOONS', 'findBody', 'solveKepler', 'stateAt', 'lambertSolve', 'DAY_SEC', 'YEAR_DAYS']
);
const near = (a, b, rel, msg) => assert.ok(Math.abs(a - b) <= rel * Math.max(1, Math.abs(b)), `${msg}: ${a} vs ${b}`);

test('data: 7 planets, 11 moons, every moon has a real parent', () => {
  assert.equal(K.PLANETS.length, 7);
  assert.equal(K.MOONS.length, 11);
  for (const m of K.MOONS) assert.ok(K.PLANETS.some((p) => p.name === m.parent), `${m.name} parent ${m.parent}`);
  assert.ok(K.findBody('Drast') && K.findBody('Beyl'), 'Dres moons present');
});

test('clock constants: 425-day year, 6h day', () => {
  assert.equal(K.YEAR_DAYS, 425);
  assert.equal(K.DAY_SEC, 21600);
});

test('solveKepler satisfies Kepler\'s equation across e and M', () => {
  for (const e of [0, 0.05, 0.26, 0.5, 0.9]) {
    for (let M = 0.1; M < 6.2; M += 0.7) {
      const E = K.solveKepler(M, e);
      near(E - e * Math.sin(E), M, 1e-9, `e=${e} M=${M}`);
    }
  }
});

test('stateAt obeys vis-viva for every planet and moon at several times', () => {
  for (const b of [...K.PLANETS, ...K.MOONS]) {
    const mu = b.parent ? K.PLANETS.find((p) => p.name === b.parent).mu : K.KERBOL.mu;
    for (const f of [0, 0.13, 0.5, 0.77]) {
      const s = K.stateAt(b, f * b.period);
      near(s.vx * s.vx + s.vy * s.vy, mu * (2 / s.r - 1 / b.a), 1e-6, `${b.name} @${f}`);
      assert.ok(s.r >= b.a * (1 - b.e) * 0.999999 && s.r <= b.a * (1 + b.e) * 1.000001, `${b.name} radius in [peri, apo]`);
    }
  }
});

test('stateAt is periodic', () => {
  for (const b of [...K.PLANETS, ...K.MOONS]) {
    const s0 = K.stateAt(b, 0), s1 = K.stateAt(b, b.period);
    near(s1.x, s0.x, 1e-6, b.name + ' x'); near(s1.y, s0.y, 1e-6, b.name + ' y');
  }
});

test('lambertSolve: quarter of a circular orbit gives circular speed', () => {
  const a = K.findBody('Kerbin').a, mu = K.KERBOL.mu;
  const tof = (Math.PI / 2) / Math.sqrt(mu / (a * a * a));
  const sol = K.lambertSolve([a, 0], [0, a], tof, mu);
  assert.ok(sol, 'solution found');
  const vc = Math.sqrt(mu / a);
  near(Math.hypot(sol.v1[0], sol.v1[1]), vc, 1e-3, '|v1|');
  near(sol.v1[1], vc, 1e-3, 'v1 points along +y');
});

// ───────────────────────── transfer window + ejection geometry ─────────────────────────
const W = loadParts(
  ['311-js-01-data.js', '312-js-02-orbital-mechanics.js', '313-js-03-sim-clock.js', '326-js-06a-transfer-math.js'],
  ['KERBOL', 'findBody', 'stateAt', 'computeTransfer', 'windowGapDeg', 'solveWindowUT', 'ejectionBurnPoint', 'DAY_SEC', 'YEAR_DAYS']
);
const D = W.DAY_SEC, Y = W.YEAR_DAYS;
const ut = (y, d, h = 0) => (y * Y + d) * D + h * 3600;

test('window: same answer no matter when you ask (used to drift ~5 days as it approached)', () => {
  const first = W.computeTransfer('Kerbin', 'Duna', ut(14, 109));
  const target = first.windowUT;
  for (const day of [109, 125, 140, 150, 155]) {
    const r = W.computeTransfer('Kerbin', 'Duna', ut(14, day));
    assert.ok(Math.abs(r.windowUT - target) < 5, `asked at ${day}d: window moved by ${r.windowUT - target}s`);
    assert.ok(Math.abs(r.waitSec - (target - ut(14, day))) < 5);
  }
});

test('window: at the window the destination sits exactly opposite the origin at arrival', () => {
  for (const [o, d] of [['Kerbin', 'Duna'], ['Kerbin', 'Eve'], ['Kerbin', 'Jool'], ['Duna', 'Kerbin'], ['Eve', 'Moho'], ['Kerbin', 'Eeloo'], ['Kerbin', 'Dres']]) {
    const r = W.computeTransfer(o, d, ut(14, 100));
    assert.ok(Math.abs(W.windowGapDeg(r.origin, r.dest, r.windowUT, r.tt)) < 1e-4, `${o}->${d} gap`);
    assert.ok(r.windowUT >= ut(14, 100) - r.windowGraceSec - 1, `${o}->${d} not in the past`);
    assert.ok(r.windowUT <= ut(14, 100) + r.synodicSec, `${o}->${d} within one synodic period`);
  }
});

test('window: required phase is the true phase at the window (and differs from the circular value for eccentric Duna)', () => {
  const r = W.computeTransfer('Kerbin', 'Duna', ut(14, 109));
  const so = W.stateAt(r.origin, r.windowUT), sd = W.stateAt(r.dest, r.windowUT);
  let phase = (sd.theta - so.theta) * 180 / Math.PI; phase = ((phase + 540) % 360) - 180;
  near(r.requiredPhase, phase, 1e-9, 'requiredPhase');
  assert.ok(Math.abs(r.requiredPhase - 44.36) > 1, 'no longer the circular-orbit 44.4 deg');
});

test('window: the flat-Hohmann burn misses Duna by less here than at the old early "window open" time', () => {
  const r = W.computeTransfer('Kerbin', 'Duna', ut(14, 109)), Kb = r.origin, Du = r.dest;
  const miss = (t) => {                       // far point of the transfer ellipse vs where Duna actually is on arrival
    const kb = W.stateAt(Kb, t), du = W.stateAt(Du, t + r.tt);
    return Math.hypot(du.x - Du.a * Math.cos(kb.theta + Math.PI), du.y - Du.a * Math.sin(kb.theta + Math.PI));
  };
  const atWindow = miss(r.windowUT);
  for (const dd of [-8, -4, -2, 2, 4, 8]) assert.ok(miss(r.windowUT + dd * D) >= atWindow - 1e3, `${dd}d`);
  assert.ok(atWindow < miss(ut(14, 156, 1.3)) , 'better than the old countdown-zero time (~156d)');
});

test('window: stays open for the grace period, then rolls to the next one one synodic period later', () => {
  const r0 = W.computeTransfer('Kerbin', 'Duna', ut(14, 109));
  const inside = W.computeTransfer('Kerbin', 'Duna', r0.windowUT + 0.5 * r0.windowGraceSec);
  assert.ok(Math.abs(inside.windowUT - r0.windowUT) < 5 && inside.waitSec < 0, 'still the same (open) window');
  const after = W.computeTransfer('Kerbin', 'Duna', r0.windowUT + 1.5 * r0.windowGraceSec);
  near(after.windowUT - r0.windowUT, r0.synodicSec, 0.03, 'next window ~ one synodic period later');
});

// Patched-conic check: integrate the escape from the parking orbit and see which way the ship actually leaves.
function escapeHeadingDeg(muP, rp, vInf, burnPhiDeg) {
  const vBurn = Math.sqrt(vInf * vInf + 2 * muP / rp), phi = burnPhiDeg * Math.PI / 180;
  let s = [rp * Math.cos(phi), rp * Math.sin(phi), -Math.sin(phi) * vBurn, Math.cos(phi) * vBurn];
  const f = (q) => { const r = Math.hypot(q[0], q[1]), k = -muP / (r * r * r); return [q[2], q[3], k * q[0], k * q[1]]; };
  while (Math.hypot(s[0], s[1]) < 5e9) {
    const dt = Math.max(1, Math.hypot(s[0], s[1]) / Math.hypot(s[2], s[3]) / 2000);
    const k1 = f(s), k2 = f(s.map((v, i) => v + dt / 2 * k1[i])), k3 = f(s.map((v, i) => v + dt / 2 * k2[i])), k4 = f(s.map((v, i) => v + dt * k3[i]));
    s = s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  return Math.atan2(s[3], s[2]) * 180 / Math.PI;
}

test('ejection: burning at the shown point sends the ship out exactly along the transfer\'s departure direction', () => {
  for (const [o, d] of [['Kerbin', 'Duna'], ['Kerbin', 'Jool'], ['Kerbin', 'Eeloo'], ['Kerbin', 'Eve'], ['Kerbin', 'Moho'], ['Duna', 'Kerbin'], ['Eve', 'Moho']]) {
    const r = W.computeTransfer(o, d, ut(14, 100)), bp = W.ejectionBurnPoint(r);
    const heading = escapeHeadingDeg(r.origin.mu, r.depEj.rp, r.depEj.vInf, bp.burnCCW);
    const err = Math.abs(((heading - r.depDirCCW + 540) % 360) - 180);
    assert.ok(err < 0.5, `${o}->${d}: leaves at ${heading.toFixed(1)} deg, transfer needs ${r.depDirCCW.toFixed(1)} (${bp.text})`);
  }
});

test('ejection: the OLD instruction ("ahead of prograde" for outbound) sent the ship the wrong way', () => {
  const r = W.computeTransfer('Kerbin', 'Duna', ut(14, 100));
  const old = escapeHeadingDeg(r.origin.mu, r.depEj.rp, r.depEj.vInf, +r.depEj.ejAngleFromPeri);
  assert.ok(Math.abs(Math.abs(old) - 180) < 0.5, `old advice leaves at ${old.toFixed(1)} deg (against the planet)`);
});

test('main loop: runs the REAL countdown snippet from part 332 across a whole approach (no drift, no early flip)', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/parts/332-js-09-main-loop.js', import.meta.url), 'utf8');
  const m = src.match(/\/\/ Window countdown:[\s\S]*?else currentResult\.waitSec = toWindow;\r?\n\s*\}\r?\n/);
  assert.ok(m, 'countdown block found in part 332');
  const W2 = loadParts(['311-js-01-data.js', '312-js-02-orbital-mechanics.js', '313-js-03-sim-clock.js', '326-js-06a-transfer-math.js'],
    ['computeTransfer', 'applyWindow']);
  const step = new Function('currentResult', 'UT', 'applyWindow', m[0]);
  const res = W2.computeTransfer('Kerbin', 'Duna', ut(14, 109));
  const firstWindow = res.windowUT;
  const windows = [firstWindow];
  let openSeen = false;
  for (let t = ut(14, 109); t < ut(14, 109) + 1.2 * res.synodicSec; t += D / 4) {
    const before = res.windowUT;
    step(res, t, W2.applyWindow);
    if (res.windowUT !== before) windows.push(res.windowUT);
    if (res.windowUT === firstWindow) {
      assert.ok(res.waitSec <= (firstWindow - ut(14, 109)) + 1, 'countdown only ever counts down');
      if (res.waitSec < 1) openSeen = true;      // "WINDOW OPEN NOW" is shown on the UI at waitSec < 1
    }
  }
  assert.equal(windows.length, 3, 're-solved only when a window had actually passed (twice in 1.2 synodic periods), never mid-approach');
  assert.ok(openSeen, 'shows "window open" for a while instead of flipping straight to the next one');
  near(windows[1] - windows[0], res.synodicSec, 0.05, 'then jumps about one synodic period ahead');
});

// Fly the planner's own departure velocity through the Sun's gravity and see where the ship ends up.
function flyHeliocentric(mu, p, v, T, dt = 900) {
  let s = [p[0], p[1], v[0], v[1]];
  const f = (q) => { const r = Math.hypot(q[0], q[1]), k = -mu / (r * r * r); return [q[2], q[3], k * q[0], k * q[1]]; };
  for (let t = 0; t < T; t += dt) {
    const h = Math.min(dt, T - t);
    const k1 = f(s), k2 = f(s.map((x, i) => x + h / 2 * k1[i])), k3 = f(s.map((x, i) => x + h / 2 * k2[i])), k4 = f(s.map((x, i) => x + h * k3[i]));
    s = s.map((x, i) => x + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  return s;
}

test('exact transfer: the ship following the planner\'s departure velocity arrives AT the destination', () => {
  for (const [o, d] of [['Kerbin', 'Duna'], ['Kerbin', 'Eve'], ['Kerbin', 'Jool'], ['Kerbin', 'Eeloo'], ['Kerbin', 'Dres'], ['Kerbin', 'Moho'], ['Duna', 'Kerbin'], ['Eve', 'Duna']]) {
    const r = W.computeTransfer(o, d, ut(14, 100));
    assert.ok(r.exact, `${o}->${d} has an exact solution`);
    const so = W.stateAt(r.origin, r.windowUT), sd = W.stateAt(r.dest, r.windowUT + r.tof);
    const end = flyHeliocentric(W.KERBOL.mu, [so.x, so.y], [so.vx + r.exact.vi[0], so.vy + r.exact.vi[1]], r.tof);
    const miss = Math.hypot(end[0] - sd.x, end[1] - sd.y);
    assert.ok(miss < 1e6, `${o}->${d}: misses by ${(miss / 1e3).toFixed(0)} km (a planet's sphere of influence is tens of thousands of km)`);
    assert.ok(r.tof > 0.69 * r.tt && r.tof < 1.36 * r.tt, `${o}->${d}: flight time inside the searched range`);
  }
});

test('exact transfer: the old Hohmann recipe missed Duna by ~1 Gm; the exact one by < 1000 km', () => {
  const r = W.computeTransfer('Kerbin', 'Duna', ut(14, 100)), so = W.stateAt(r.origin, r.windowUT);
  const vo = Math.hypot(so.vx, so.vy), vt = r.vt1;                          // old recipe: just speed up along the orbit to the Hohmann speed
  const old = flyHeliocentric(W.KERBOL.mu, [so.x, so.y], [so.vx / vo * vt, so.vy / vo * vt], r.tt);
  const sdOld = W.stateAt(r.dest, r.windowUT + r.tt);
  assert.ok(Math.hypot(old[0] - sdOld.x, old[1] - sdOld.y) > 5e8, 'old recipe misses by hundreds of Mm');
  const so2 = W.stateAt(r.origin, r.windowUT), sd = W.stateAt(r.dest, r.windowUT + r.tof);
  const end = flyHeliocentric(W.KERBOL.mu, [so2.x, so2.y], [so2.vx + r.exact.vi[0], so2.vy + r.exact.vi[1]], r.tof);
  assert.ok(Math.hypot(end[0] - sd.x, end[1] - sd.y) < 1e6, 'exact recipe hits');
});

test('exact transfer: shown v-infinity / burn numbers come from the same solution; return-plan mode stays Hohmann', () => {
  const r = W.computeTransfer('Kerbin', 'Duna', ut(14, 100));
  near(Math.abs(r.dv1_helio), r.exact.vInfDep, 1e-9, 'dep v_inf'); near(Math.abs(r.dv2_helio), r.exact.vInfArr, 1e-9, 'arr v_inf');
  near(r.depEj.vInf, r.exact.vInfDep, 1e-9, 'ejection uses it'); assert.equal(r.at, r.exact.a);
  const q = W.computeTransfer('Kerbin', 'Duna', ut(14, 100), false);
  assert.equal(q.exact, undefined); assert.equal(q.tof, q.tt); near(Math.abs(q.dv1_helio), 918, 0.01, 'Hohmann v_inf');
});

test('exact transfer: stable while you approach the window (numbers do not change as time passes)', () => {
  const a = W.computeTransfer('Kerbin', 'Duna', ut(14, 109)), b = W.computeTransfer('Kerbin', 'Duna', ut(14, 150));
  near(a.tof, b.tof, 1e-6, 'tof'); near(a.depEj.dvBurn, b.depEj.dvBurn, 1e-6, 'dv'); near(a.depDirCCW, b.depDirCCW, 1e-5, 'dir');
});

test('version: package.json and every place the app shows it agree (and the popup\'s newest entry matches)', async () => {
  const fs = await import('node:fs');
  const read = (f) => fs.readFileSync(new URL('../src/parts/' + f, import.meta.url), 'utf8');
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  const shown = pkg.replace(/\.0$/, '');                     // 4.0.0 -> 4.0, 4.0.1 -> 4.0.1
  const places = { '100-html-shell.html': `>v${shown}</div>`, '102-html-changelog-modal.html': `Kerbalist v${shown} &middot;`,
                   '203-js-bugreport-submit-dragdrop.js': `App Version:** v${shown}`, '310-js-00-boot-splash.js': `VERSION = 'v${shown}'`,
                   '901-html-bugreport-modal.html': `App Version: v${shown}<` };
  for (const [file, needle] of Object.entries(places)) assert.ok(read(file).includes(needle), `${file} should contain ${needle}`);
  const firstEntry = read('102-html-changelog-modal.html').match(/<h2>\[([^\]]+)\]/)[1];
  assert.equal(firstEntry, shown, 'newest entry in the in-app changelog');
});
