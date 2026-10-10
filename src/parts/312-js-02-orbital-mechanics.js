      /* =========================================================
         2. ORBITAL MECHANICS
         ========================================================= */
      function solveKepler(M, e) {
        M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        let E = e < 0.8 ? M : Math.PI;
        for (let i = 0; i < 60; i++) {
          const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
          E -= dE;
          if (Math.abs(dE) < 1e-12) break;
        }
        return E;
      }

      function stateAt(planet, t) {
        const M = planet.m0 + planet.n * t;
        const E = solveKepler(M, planet.e);
        const e = planet.e;
        const nu = Math.atan2(Math.sqrt(1 - e * e) * Math.sin(E), Math.cos(E) - e);
        const r = planet.a * (1 - e * Math.cos(E));
        const theta = nu + planet.orient;
        const x = r * Math.cos(theta), y = r * Math.sin(theta);
        const centralBody = planet.parent ? PLANETS.find(p => p.name === planet.parent) : KERBOL;
        const centralMu = centralBody?.mu || KERBOL.mu;
        const h = Math.sqrt(centralMu * planet.a * (1 - e * e));
        const vr = centralMu / h * e * Math.sin(nu);
        const vt = centralMu / h * (1 + e * Math.cos(nu));
        const vx = vr * Math.cos(theta) - vt * Math.sin(theta);
        const vy = vr * Math.sin(theta) + vt * Math.cos(theta);
        return { x, y, r, theta, vx, vy, nu };
      }

      // Diagnostic functions for orbital epoch synchronization
      window.debugOrbitalState = function () {
        console.log('=== ORBITAL STATE AT UT=0 ===');
        PLANETS.forEach(p => {
          const s = stateAt(p, 0);
          const theta_deg = (s.theta / Math.PI * 180) % 360;
          console.log(`${p.name}: theta=${theta_deg.toFixed(1)}° (m0=${(p.m0 * 180 / Math.PI).toFixed(1)}°, orient=${(p.orient * 180 / Math.PI).toFixed(1)}°)`);
        });
        MOONS.forEach(m => {
          const s = stateAt(m, 0);
          const theta_deg = (s.theta / Math.PI * 180) % 360;
          console.log(`${m.name}: theta=${theta_deg.toFixed(1)}° (parent: ${m.parent})`);
        });
        return 'Check browser console for results';
      };

      window.calculateM0Correction = function (bodyName, actualTheta_deg, knownUT_sec) {
        const body = findBody(bodyName);
        if (!body) return `Body ${bodyName} not found`;
        const predicted = stateAt(body, knownUT_sec);
        const predicted_theta_deg = (predicted.theta * 180 / Math.PI) % 360;
        let offset = actualTheta_deg - predicted_theta_deg;
        while (offset > 180) offset -= 360;
        while (offset < -180) offset += 360;
        const current_m0_deg = body.m0 * 180 / Math.PI;
        const corrected_m0_deg = current_m0_deg + offset;
        return {
          bodyName,
          current_m0Deg: current_m0_deg.toFixed(2),
          predicted_theta_deg: predicted_theta_deg.toFixed(2),
          actual_theta_deg: actualTheta_deg.toFixed(2),
          offset_deg: offset.toFixed(2),
          corrected_m0Deg: corrected_m0_deg.toFixed(2),
          explanation: `Change m0Deg from ${current_m0_deg.toFixed(1)} to ${corrected_m0_deg.toFixed(1)}`
        };
      };

      window.calculateAllM0Corrections = function (correctionsArray) {
        const knownUT_sec = UT;
        console.log(`=== M0DEG CORRECTIONS AT UT=${utToDateString(knownUT_sec)} ===`);
        const corrections = {};
        correctionsArray.forEach(item => {
          const result = window.calculateM0Correction(item.bodyName, item.actualTheta, knownUT_sec);
          corrections[item.bodyName] = result;
          console.log(`${item.bodyName}:`);
          console.log(`  Current m0Deg: ${result.current_m0Deg}°`);
          console.log(`  Predicted theta: ${result.predicted_theta_deg}°`);
          console.log(`  Actual theta: ${result.actual_theta_deg}°`);
          console.log(`  Correction needed: ${result.offset_deg}° offset`);
          console.log(`  NEW m0Deg should be: ${result.corrected_m0Deg}°`);
        });
        return corrections;
      };

      window.generateCorrectedOrbitalData = function (correctionsObject) {
        console.log('=== CORRECTED ORBITAL DATA ===');
        console.log('Copy this into the index.html RAW_PLANETS and RAW_MOONS sections:\n');
        let output = 'const RAW_PLANETS = [\n';
        RAW_PLANETS.forEach(p => {
          const correction = correctionsObject[p.name];
          const newM0Deg = correction ? parseFloat(correction.corrected_m0Deg) : p.m0Deg;
          output += `  { name: '${p.name}', color: '${p.color}', a: ${p.a}, e: ${p.e.toFixed(3)}, orientDeg: ${p.orientDeg}, m0Deg: ${newM0Deg.toFixed(1)}, period: ${p.period}, mu: ${p.mu}, radius: ${p.radius}, incl: ${p.incl}, desc: '${p.desc}' },\n`;
        });
        output += '];\n\n';
        output += 'const RAW_MOONS = [\n';
        RAW_MOONS.forEach(m => {
          const correction = correctionsObject[m.name];
          const newM0Deg = correction ? parseFloat(correction.corrected_m0Deg) : m.m0Deg;
          output += `  { name: '${m.name}', parent: '${m.parent}', color: '${m.color}', a: ${m.a}, e: ${m.e.toFixed(2)}, orientDeg: ${m.orientDeg}, m0Deg: ${newM0Deg.toFixed(1)}, period: ${m.period}, incl: ${m.incl}, radius: ${m.radius}, desc: '${m.desc}' },\n`;
        });
        output += '];\n';
        console.log(output);
        return output;
      }

      function stumpC(z) { if (z > 1e-6) return (1 - Math.cos(Math.sqrt(z))) / z; if (z < -1e-6) { const s = Math.sqrt(-z); return (Math.cosh(s) - 1) / (-z); } return 0.5; }
      function stumpS(z) { if (z > 1e-6) { const s = Math.sqrt(z); return (s - Math.sin(s)) / (s * s * s); } if (z < -1e-6) { const s = Math.sqrt(-z); return (Math.sinh(s) - s) / (s * s * s); } return 1 / 6; }

      function lambertSolve(r1v, r2v, tof, mu) {
        const r1 = Math.hypot(r1v[0], r1v[1]), r2 = Math.hypot(r2v[0], r2v[1]);
        const th1 = Math.atan2(r1v[1], r1v[0]), th2 = Math.atan2(r2v[1], r2v[0]);
        let dnu = th2 - th1; if (dnu <= 1e-9) dnu += 2 * Math.PI;
        const A = Math.sin(dnu) * Math.sqrt(r1 * r2 / (1 - Math.cos(dnu)));
        if (!isFinite(A) || Math.abs(A) < 1e-6) return null;
        function yOf(z) { return r1 + r2 + A * (z * stumpS(z) - 1) / Math.sqrt(stumpC(z)); }
        function Fz(z) {
          const y = yOf(z); if (y < 0) return null;
          const x = Math.sqrt(y / stumpC(z));
          return (Math.pow(x, 3) * stumpS(z) + A * Math.sqrt(y)) / Math.sqrt(mu) - tof;
        }
        let zLow = -40, zHigh = 4 * Math.PI * Math.PI, guard = 0;
        while (yOf(zLow) < 0 && guard < 2000) { zLow += 0.05; guard++; }
        let fLow = Fz(zLow), fHigh = Fz(zHigh), tries = 0;
        while ((fLow === null || fHigh === null || fLow * fHigh > 0) && tries < 300) { zHigh *= 1.08; fHigh = Fz(zHigh); tries++; }
        if (fLow === null || fHigh === null || fLow * fHigh > 0) return null;
        let z = 0, f = 0;
        for (let i = 0; i < 200; i++) {
          z = (zLow + zHigh) / 2; f = Fz(z);
          if (f === null) { zLow = z; continue; }
          if (Math.abs(f) < 1e-4) break;
          if ((f > 0) === (fLow > 0)) { zLow = z; fLow = f; } else { zHigh = z; fHigh = f; }
        }
        const y = yOf(z);
        const f_ = 1 - y / r1, g = A * Math.sqrt(y / mu), gdot = 1 - y / r2;
        if (Math.abs(g) < 1e-6) return null;
        const v1 = [(r2v[0] - f_ * r1v[0]) / g, (r2v[1] - f_ * r1v[1]) / g];
        const v2 = [(gdot * r2v[0] - r1v[0]) / g, (gdot * r2v[1] - r1v[1]) / g];
        return { v1, v2 };
      }

      /**
       * Sample the *actual* transfer trajectory between two known position
       * vectors and a known time-of-flight, by solving Lambert's problem for
       * the departure velocity and then propagating that state forward with
       * real two-body Kepler motion.
       *
       * Earlier arc-drawing code built an idealized Hohmann ellipse assuming
       * an exact 180-degree transfer with periapsis pinned to one endpoint.
       * That's only exact when both bodies are on circular orbits. For an
       * eccentric destination (e.g. Eeloo, e=0.26) the real angular gap
       * between departure and arrival isn't exactly 180 degrees, so that
       * construction visibly missed the arrival point. Solving Lambert
       * directly for the known endpoints/time-of-flight and propagating the
       * resulting state guarantees the sampled curve starts and ends exactly
       * on the real departure/arrival positions, regardless of eccentricity.
       * Returns null if Lambert can't find a solution (near-degenerate
       * geometry) so callers can fall back to the simple ellipse construction.
       */
      function buildLambertArcPoints(r1x, r1y, r2x, r2y, tof, mu, N) {
        const sol = lambertSolve([r1x, r1y], [r2x, r2y], tof, mu);
        if (!sol) return null;
        const vx = sol.v1[0], vy = sol.v1[1];
        const r = Math.hypot(r1x, r1y);
        const v2 = vx * vx + vy * vy;
        const energy = v2 / 2 - mu / r;
        if (energy >= 0) return null; // hyperbolic/parabolic transfer orbit — shouldn't happen for bound Hohmann-style routes
        const a = -mu / (2 * energy);
        const rdotv = r1x * vx + r1y * vy;
        const ex = ((v2 - mu / r) * r1x - rdotv * vx) / mu;
        const ey = ((v2 - mu / r) * r1y - rdotv * vy) / mu;
        const e = Math.hypot(ex, ey);
        const periAngle = Math.atan2(ey, ex);
        const theta1 = Math.atan2(r1y, r1x);
        let nu1 = theta1 - periAngle;
        nu1 = ((nu1 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        const E1 = 2 * Math.atan2(Math.sqrt(Math.max(0, 1 - e)) * Math.sin(nu1 / 2), Math.sqrt(Math.max(0, 1 + e)) * Math.cos(nu1 / 2));
        const M1 = E1 - e * Math.sin(E1);
        const n = Math.sqrt(mu / Math.pow(a, 3));
        const pts = [];
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * tof;
          const M = M1 + n * t;
          const E = solveKepler(M, e);
          const nu = Math.atan2(Math.sqrt(1 - e * e) * Math.sin(E), Math.cos(E) - e);
          const rr = a * (1 - e * Math.cos(E));
          const theta = nu + periAngle;
          pts.push({ x: rr * Math.cos(theta), y: rr * Math.sin(theta), r: rr, theta });
        }
        return pts;
      }

