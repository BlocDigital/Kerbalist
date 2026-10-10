      /* =========================================================
         6. TRANSFER CALCULATION
         ========================================================= */
      const PARK_ALT = 100000;
      function angNorm360(a) { a = a % 360; if (a < 0) a += 360; return a; }
      function angNormPM180(a) { a = angNorm360(a); if (a > 180) a -= 360; return a; }

      /**
       * Given a fixed departure angle/time, search for a flight duration such
       * that the destination body ends up close to true opposition (180
       * degrees away) at arrival — i.e. a well-phased, low-eccentricity
       * transfer, rather than trusting the naive semi-major-axis-only Hohmann
       * time estimate blindly.
       *
       * This matters specifically for gravity-assist legs: the main transfer
       * window is optimized for reaching the *final* destination, so there's
       * no guarantee an intermediate flyby planet is well-positioned relative
       * to whichever body is next in the chain. Forcing the naive time
       * estimate in that case can demand a near-parabolic (e~1) trajectory to
       * connect two points that are barely apart in angle — which is both
       * physically nonsensical and looks like a sharp, wrong-looking kink
       * when drawn.
       *
       * Scans for genuine zero-crossings of the opposition gap (explicitly
       * ignoring the +-180 degree branch-cut, which isn't a real crossing),
       * bisects each one, and picks whichever root is closest to the naive
       * guess (the most "natural" continuation). Falls back to the naive
       * guess if no crossing is found. Nudges slightly off exact 180 degrees
       * since that's the Lambert solver's own singularity.
       */
      function refineFlightTimeForOpposition(originAngleRad, destPlanet, tRef, tofGuess, mu) {
        function gapAt(tof) {
          const s = stateAt(destPlanet, tRef + Math.max(1, tof));
          return angNormPM180((s.theta - originAngleRad) * 180 / Math.PI - 180);
        }
        const guess = Math.max(3600, tofGuess);
        const lo = guess * 0.15, hi = guess * 4 + destPlanet.period;
        const N = 400;
        const step = (hi - lo) / N;
        const brackets = [];
        let prevT = lo, prevG = gapAt(lo);
        for (let i = 1; i <= N; i++) {
          const t = lo + i * step;
          const g = gapAt(t);
          // genuine zero-crossing only — a small sign-flipping jump, not the +-180 branch cut
          if (Math.sign(g) !== Math.sign(prevG) && Math.abs(g - prevG) < 180) {
            brackets.push([prevT, t]);
          }
          prevT = t; prevG = g;
        }
        if (brackets.length === 0) return tofGuess;
        let best = null, bestDist = Infinity;
        for (const [a, b] of brackets) {
          let lo2 = a, hi2 = b, gLo = gapAt(lo2);
          for (let i = 0; i < 50; i++) {
            const mid = (lo2 + hi2) / 2;
            const gMid = gapAt(mid);
            if (Math.sign(gMid) === Math.sign(gLo)) { lo2 = mid; gLo = gMid; } else { hi2 = mid; }
          }
          const root = (lo2 + hi2) / 2;
          const dist = Math.abs(root - guess);
          if (dist < bestDist) { bestDist = dist; best = root; }
        }
        return best + destPlanet.period * 0.002; // nudge off the exact-180 Lambert singularity
      }

      // Hyperbolic escape/capture from a circular parking orbit for a given v-infinity.
      function ejectionBurn(vInf, planet) {
        const rp = planet.radius + PARK_ALT, muP = planet.mu;
        const eH = 1 + rp * vInf * vInf / muP;
        const nuInf = Math.acos(Math.max(-1, Math.min(1, -1 / eH)));
        const ejAngleFromPeri = 180 - nuInf * 180 / Math.PI;
        const vPark = Math.sqrt(muP / rp), vBurnout = Math.sqrt(vInf * vInf + 2 * muP / rp);
        return { ejAngleFromPeri, dvBurn: vBurnout - vPark, vInf, rp };
      }

      /* ---- Transfer window solver ------------------------------------------------------------
         The classic "required phase angle" assumes circular orbits and a constant closing rate, so the old
         countdown (phase difference / mean closing rate) drifted by days as the window approached and called
         the window up to ~4 days early for eccentric targets (Duna e=0.05). It then flipped to the NEXT
         window the instant the phase passed the circular-orbit value.
         Instead, solve for the departure time directly from the real orbits: the moment the destination,
         tt seconds later, sits exactly opposite the origin (where the transfer ellipse's far end is). */
      const WINDOW_GRACE_DEG = 1.0;   // the window stays "open" until the phase error exceeds this

      // Angle (deg, +-180) from the transfer's far point to the destination at arrival. Zero = perfect window.
      function windowGapDeg(o, d, t, tt) {
        const so = stateAt(o, t), sd = stateAt(d, t + tt);
        return angNormPM180((sd.theta - so.theta) * 180 / Math.PI - 180);
      }

      function solveWindowUT(o, d, tRef, tt) {
        const meanRateDeg = (d.n - o.n) * 180 / Math.PI;           // deg/s: mean slope of the gap
        if (Math.abs(d.n - o.n) <= 1e-12) return null;             // same period: no synodic cycle
        const synodicSec = 360 / Math.abs(meanRateDeg);
        const graceSec = WINDOW_GRACE_DEG / Math.abs(meanRateDeg);
        const polish = (t) => {                                    // Newton on the true gap; eccentric orbits only bend the slope slightly
          for (let i = 0; i < 60; i++) {
            const g = windowGapDeg(o, d, t, tt);
            if (Math.abs(g) < 1e-7) break;
            const h = 1800;
            let slope = (windowGapDeg(o, d, t + h, tt) - windowGapDeg(o, d, t - h, tt)) / (2 * h);
            if (!(Math.sign(slope) === Math.sign(meanRateDeg) && Math.abs(slope) > 0.25 * Math.abs(meanRateDeg) && Math.abs(slope) < 4 * Math.abs(meanRateDeg))) slope = meanRateDeg;
            t -= g / slope;
          }
          return t;
        };
        let t = polish(tRef);                                      // nearest window, either side of tRef
        if (t < tRef - graceSec) t = polish(t + synodicSec);       // already gone -> the next one
        return { windowUT: t, synodicSec, graceSec };
      }

      // (Re)solve the window for a transfer result and refresh the fields that depend on it.
      function applyWindow(res, tRef) {
        const w = solveWindowUT(res.origin, res.dest, tRef, res.tt);
        if (!w) return;
        res.windowUT = w.windowUT;
        res.synodicSec = w.synodicSec;
        res.windowGraceSec = w.graceSec;
        res.waitSec = w.windowUT - tRef;                           // slightly negative = window opened a moment ago, still good
        const so = stateAt(res.origin, w.windowUT), sd = stateAt(res.dest, w.windowUT);
        res.requiredPhase = angNormPM180((sd.theta - so.theta) * 180 / Math.PI);   // the real phase needed for THIS window
        if (res.wantExact) applyExactTransfer(res);
      }

      /* ---- Exact transfer for the solved window --------------------------------------------
         The sidebar used to quote the circular-orbit Hohmann numbers (flight time, v-inf, burn angle). With an
         eccentric destination those are ~5% off in radius and put the arrival ~1 Gm from the planet, while the
         arc drawn on the map was already a Lambert solution. Now the numbers come from that same Lambert
         solution: depart at the solved window and pick the flight time with the cheapest ejection + capture.
         Flight times within ~0.6 deg of a 180 deg transfer are skipped (Lambert is degenerate there). */
      function solveExactTransfer(o, d, tDep, ttRef) {
        const mu = KERBOL.mu, so = stateAt(o, tDep);
        const th1 = Math.atan2(so.y, so.x), TWO_PI = 2 * Math.PI;
        const evalAt = (tof) => {
          const sd = stateAt(d, tDep + tof);
          let dnu = Math.atan2(sd.y, sd.x) - th1; dnu = ((dnu % TWO_PI) + TWO_PI) % TWO_PI;
          if (Math.abs(dnu - Math.PI) < 0.01) return null;
          const sol = lambertSolve([so.x, so.y], [sd.x, sd.y], tof, mu);
          if (!sol) return null;
          const energy = (sol.v1[0] * sol.v1[0] + sol.v1[1] * sol.v1[1]) / 2 - mu / Math.hypot(so.x, so.y);
          if (!(energy < 0)) return null;                                   // must be a bound orbit
          const vi = [sol.v1[0] - so.vx, sol.v1[1] - so.vy], va = [sol.v2[0] - sd.vx, sol.v2[1] - sd.vy];
          const vInfDep = Math.hypot(vi[0], vi[1]), vInfArr = Math.hypot(va[0], va[1]);
          return { tof, vInfDep, vInfArr, vi, va, vd: [sd.vx, sd.vy], a: -mu / (2 * energy),
                   cost: ejectionBurn(vInfDep, o).dvBurn + ejectionBurn(vInfArr, d).dvBurn };
        };
        const N = 130, lo = 0.7, hi = 1.35, step = (hi - lo) / N;
        let best = null, bestK = -1; const grid = [];
        for (let k = 0; k <= N; k++) {
          const e = evalAt(ttRef * (lo + step * k));
          grid.push(e);
          if (e && (!best || e.cost < best.cost)) { best = e; bestK = k; }
        }
        if (!best) return null;
        const l = grid[bestK - 1], r = grid[bestK + 1];                      // parabolic refine between grid points
        if (l && r) {
          const den = l.cost - 2 * best.cost + r.cost;
          if (den > 1e-9) {
            const off = Math.max(-1, Math.min(1, 0.5 * (l.cost - r.cost) / den));
            const refined = evalAt(best.tof + off * step * ttRef);
            if (refined && refined.cost <= best.cost) best = refined;
          }
        }
        const dirCCW = Math.atan2(so.vx * best.vi[1] - so.vy * best.vi[0], so.vx * best.vi[0] + so.vy * best.vi[1]) * 180 / Math.PI;
        const vdMag = Math.hypot(best.vd[0], best.vd[1]);
        best.dirCCW = dirCCW;                                               // where v-inf points, CCW from the origin's prograde
        best.depSign = Math.cos(dirCCW * Math.PI / 180) >= 0 ? 1 : -1;
        best.arrSign = (best.va[0] * best.vd[0] + best.va[1] * best.vd[1]) / (vdMag || 1) > 0 ? -1 : 1;
        return best;
      }

      // Swap the circular-Hohmann estimate for the exact numbers (or restore it if no solution exists).
      function applyExactTransfer(res) {
        const ex = res.windowUT != null ? solveExactTransfer(res.origin, res.dest, res.windowUT, res.tt) : null;
        const src = ex ? {
          tof: ex.tof, at: ex.a, dv1_helio: ex.depSign * ex.vInfDep, dv2_helio: ex.arrSign * ex.vInfArr,
          depEj: ejectionBurn(ex.vInfDep, res.origin), arrEj: ejectionBurn(ex.vInfArr, res.dest), depDirCCW: ex.dirCCW
        } : res.base;
        res.exact = ex;
        Object.assign(res, src);
      }

      /* ---- Where to burn on the parking orbit --------------------------------------------------
         Positions are angles measured in the direction you orbit (counter-clockwise from above), 0 = the
         planet's prograde direction. The escape asymptote sits nu_inf (= 180 - ejAngle) beyond periapsis, so
         the burn point is nu_inf behind the direction the ship must leave in (depDirCCW). For a transfer that
         leaves roughly WITH the planet that is "ahead of retrograde"; for one that leaves against it, "ahead of
         prograde"; any tilt of the real departure direction is added on. (Verified by numerically integrating
         the escape in test/pin.test.mjs.) */
      function ejectionBurnPoint(r) {
        const ej = r.depEj.ejAngleFromPeri;
        const dir = r.depDirCCW;
        const forward = Math.cos(dir * Math.PI / 180) >= 0;
        const refCCW = forward ? 180 : 0;
        const tilt = angNormPM180(dir - (forward ? 0 : 180));
        const fromRef = ej + tilt;
        const refName = forward ? 'retrograde' : 'prograde';
        return { ejAngle: ej, tilt, refName, refCCW, fromRef, burnCCW: refCCW + fromRef,
                 text: Math.abs(fromRef).toFixed(1) + '\u00B0 ' + (fromRef >= 0 ? 'ahead of ' : 'behind ') + refName };
      }

      function computeTransfer(originName, destName, tRef = UT, exact = true) {
        const originSelected = findBody(originName);
        const destSelected = findBody(destName);
        const destMoon = destSelected && destSelected.parent ? destSelected : null;  // Track if destination is a moon
        const o = transferBodyFor(originSelected);
        const d = transferBodyFor(destSelected);
        if (!originSelected || !destSelected || !o || !d || originSelected === destSelected) return null;
        // Reject transfers where both bodies are in the same orbit
        if (o === d) return null;
        const r1 = o.a, r2 = d.a, mu = KERBOL.mu;
        const at = (r1 + r2) / 2;
        const tt = Math.PI * Math.sqrt(Math.pow(at, 3) / mu);
        const v1c = Math.sqrt(mu / r1), v2c = Math.sqrt(mu / r2);
        const vt1 = Math.sqrt(mu * (2 / r1 - 1 / at)), vt2 = Math.sqrt(mu * (2 / r2 - 1 / at));
        const dv1_helio = vt1 - v1c, dv2_helio = v2c - vt2;
        const n1 = o.n, n2 = d.n;
        let requiredPhase = 180 - (n2 * tt) * 180 / Math.PI;
        requiredPhase = angNormPM180(requiredPhase);
        const os = stateAt(o, tRef), ds = stateAt(d, tRef);
        let currentPhase = angNormPM180((ds.theta - os.theta) * 180 / Math.PI);
        const rate = (n2 - n1);
        let waitSec = null;
        const curRad = currentPhase * DEG, reqRad = requiredPhase * DEG;
        if (Math.abs(rate) > 1e-12) {
          if (rate > 0) {
            let diff = reqRad - curRad;
            diff = ((diff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            waitSec = diff / rate;
          } else {
            let diff = curRad - reqRad;
            diff = ((diff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            waitSec = diff / (-rate);
          }
        }
        const ejection = ejectionBurn;
        const depEj = ejection(Math.abs(dv1_helio), o);
        const arrEj = ejection(Math.abs(dv2_helio), d);

        // Additional Δv for moon orbit insertion (informational - depends on arrival geometry)
        // Shows what's needed to insert into moon orbit from parent planet's sphere of influence
        let moonInsertionDv = 0;
        let landingDv = 0;

        if (destMoon) {
          // Use the moon's actual gravitational parameter for accurate orbital mechanics
          const moonMu = getMoonMu(destMoon);

          // Low orbit velocity (surface + 10% altitude margin, minimum 1km)
          const lowOrbitAltitude = Math.max(destMoon.radius * 0.1, 1000);
          const lowOrbitVelocity = Math.sqrt(moonMu / (destMoon.radius + lowOrbitAltitude));

          // Surface (circular) velocity - used only as a reference scale, not subtracted directly
          const surfaceVelocity = Math.sqrt(moonMu / destMoon.radius);

          // Insertion Δv: capturing into low orbit from an incoming hyperbolic approach.
          // Reference estimate only - actual cost depends heavily on arrival v-infinity.
          moonInsertionDv = lowOrbitVelocity * 1.2;

          // Landing Δv: powered descent from low orbit to surface.
          // Uses the low-orbit velocity itself (not a difference, which can go negative
          // for airless bodies where orbital velocity barely changes with altitude).
          landingDv = lowOrbitVelocity * 1.1;
        } else if (destSelected && destSelected.mu && destSelected.radius && destSelected.name !== 'Jool') {
          // Planet landing - much larger so different calculation
          // Jool is a gas giant with no solid surface; landing is not a real maneuver there
          const surfaceVelocity = Math.sqrt(destSelected.mu / destSelected.radius);
          landingDv = surfaceVelocity * 0.35;
        }

        const res = { origin: o, dest: d, originSelected, destSelected, destMoon, moonInsertionDv, landingDv, tRef, r1, r2, at, tt, v1c, v2c, vt1, vt2, dv1_helio, dv2_helio, requiredPhase, currentPhase, waitSec, depEj, arrEj, outbound: r2 > r1 };
        res.tof = tt;                                          // flight time actually flown (= tt until the exact transfer replaces it)
        res.depDirCCW = r2 > r1 ? 0 : 180;                     // Hohmann leaves exactly with / against the planet
        res.base = { tof: tt, at, dv1_helio, dv2_helio, depEj, arrEj, depDirCCW: res.depDirCCW };
        res.wantExact = !!exact;
        if (waitSec !== null) applyWindow(res, tRef);   // replace the mean-motion estimate with the solved window (+ exact transfer)
        return res;
      }

      let currentResult = null;
      let missionTimeOnTargetDays = 0;
      let visualizeReturnTrip = false;
      let lastSidebarUpdate = 0;
      let currentAssists = [];
      let selectedAssistIdx = null;

