      /* =========================================================
         13. BRIDGE FRAME FIT — pure maths, no DOM / THREE
         The telemetry bridge reports KSP2 world vectors whose axis
         convention is not documented. Rather than guess it, we fit
         the best signed axis permutation against the analytic model
         at runtime. A wrong guess shows a large error, so the fit
         also tells us when the bridge data can't be trusted.
         ========================================================= */
      const BRIDGE_AXIS_PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

      // All 48 signed permutations (6 orderings x 8 sign patterns, including mirrors).
      function bridgeAxisCandidates() {
        const out = [];
        for (const perm of BRIDGE_AXIS_PERMS) {
          for (let s = 0; s < 8; s++) {
            out.push({ perm, sign: [s & 1 ? -1 : 1, s & 2 ? -1 : 1, s & 4 ? -1 : 1] });
          }
        }
        return out;
      }

      function applyBridgeAxisMap(map, v) {
        const c = [v.x, v.y, v.z];
        return {
          x: map.sign[0] * c[map.perm[0]],
          y: map.sign[1] * c[map.perm[1]],
          z: map.sign[2] * c[map.perm[2]]
        };
      }

      /**
       * pairs: [{ bridge: {x, y, z}, expected: {x, y, z} }], both already in scene units.
       * Returns { map, relError } for the best candidate, where
       * relError = sqrt(sum |bridge - expected|^2 / sum |expected|^2). 0 is a perfect fit.
       */
      function chooseBridgeAxisMap(pairs) {
        let best = null;
        for (const cand of bridgeAxisCandidates()) {
          let err = 0, mag = 0;
          for (const p of pairs) {
            const m = applyBridgeAxisMap(cand, p.bridge);
            const dx = m.x - p.expected.x, dy = m.y - p.expected.y, dz = m.z - p.expected.z;
            err += dx * dx + dy * dy + dz * dz;
            mag += p.expected.x * p.expected.x + p.expected.y * p.expected.y + p.expected.z * p.expected.z;
          }
          const relError = mag > 0 ? Math.sqrt(err / mag) : Infinity;
          if (!best || relError < best.relError) best = { map: cand, relError };
        }
        return best;
      }

      // Bridge frame (y up, x/z ecliptic) -> scene frame (y up, z flipped to right-handed).
      // A prograde orbit stays prograde after the flip, which matches the app's convention.
      const BRIDGE_TO_SCENE_MAP = { perm: [0, 1, 2], sign: [1, 1, -1] };

      // Two-body orbit from a single state vector. r and v are {x,y,z} relative to the
      // central body (metres, m/s); mu is the central body's gravitational parameter.
      // Returns N points (metres) tracing the full ellipse in the same frame.
      function bridgeOrbitLoop(r, v, mu, N) {
        const rm = Math.hypot(r.x, r.y, r.z);
        const v2 = v.x * v.x + v.y * v.y + v.z * v.z;
        const h = { x: r.y * v.z - r.z * v.y, y: r.z * v.x - r.x * v.z, z: r.x * v.y - r.y * v.x };
        const hm = Math.hypot(h.x, h.y, h.z);
        const vxh = { x: v.y * h.z - v.z * h.y, y: v.z * h.x - v.x * h.z, z: v.x * h.y - v.y * h.x };
        const ev = { x: vxh.x / mu - r.x / rm, y: vxh.y / mu - r.y / rm, z: vxh.z / mu - r.z / rm };
        const e = Math.hypot(ev.x, ev.y, ev.z);
        const a = 1 / (2 / rm - v2 / mu);
        // Periapsis direction; for a circular orbit any in-plane direction works, so use the state itself.
        const P = e > 1e-9 ? { x: ev.x / e, y: ev.y / e, z: ev.z / e } : { x: r.x / rm, y: r.y / rm, z: r.z / rm };
        const hn = { x: h.x / hm, y: h.y / hm, z: h.z / hm };
        // Q = hn x P: the in-plane direction 90 degrees ahead of periapsis.
        const Q = { x: hn.y * P.z - hn.z * P.y, y: hn.z * P.x - hn.x * P.z, z: hn.x * P.y - hn.y * P.x };
        const pts = [];
        for (let i = 0; i <= N; i++) {
          const nu = (i / N) * 2 * Math.PI;
          const rr = a * (1 - e * e) / (1 + e * Math.cos(nu));
          const c = Math.cos(nu), sn = Math.sin(nu);
          pts.push({
            x: rr * (c * P.x + sn * Q.x),
            y: rr * (c * P.y + sn * Q.y),
            z: rr * (c * P.z + sn * Q.z)
          });
        }
        return pts;
      }

      // Apoapsis and periapsis altitudes (m above the surface) from the telemetry the bridge sends
      // for the active vessel, since the bridge's own orbit field is null. altitude is above the
      // surface, horizontal is the tangential speed, orbitalSpeed the total speed; R and mu are the
      // parent body's radius and gravitational parameter.
      function vesselApsides(altitude, horizontal, orbitalSpeed, R, mu) {
        const r = R + altitude, v = orbitalSpeed;
        if (!(r > 0) || !(mu > 0) || !(v > 0)) return null;
        const inv_a = 2 / r - v * v / mu;
        if (inv_a <= 0) return null;                  // unbound: no apoapsis
        const a = 1 / inv_a;
        const h = r * horizontal;
        const e = Math.sqrt(Math.max(0, 1 + (h * h / mu) * (v * v / mu - 2 / r)));
        return { ap: a * (1 + e) - R, pe: a * (1 - e) - R };
      }

      // Short tag for the map, e.g. "Superlight-Survey-Scan+Land" -> "SSSL", "Bloc_Duna_13" -> "BD13".
      function vesselAcronym(name) {
        const parts = String(name || '').split(/[^A-Za-z0-9]+/).filter(Boolean);
        let out = '';
        for (const p of parts) out += /^\d+$/.test(p) ? p : p[0].toUpperCase();
        return out.slice(0, 6) || '?';
      }
