      /* =========================================================
         GRAVITY ASSIST DETECTION & CALCULATION
         Coplanar, patched-conic approximation. Finds planets that sit
         angularly "between" origin and destination near the midpoint
         of the direct transfer, then solves two Lambert arcs
         (origin -> assist, assist -> destination) to estimate the
         combined Δv and compare it against the direct Hohmann budget.
         ========================================================= */
      function detectPotentialAssists(o, d, tDep, tofDirect) {
        if (!o || !d) return [];
        const s1 = stateAt(o, tDep);
        const s2 = stateAt(d, tDep + tofDirect);
        let angDiff = s2.theta - s1.theta;
        while (angDiff < 0) angDiff += 2 * Math.PI;
        while (angDiff > 2 * Math.PI) angDiff -= 2 * Math.PI;

        const rMin = Math.min(o.a, d.a), rMax = Math.max(o.a, d.a);
        const candidates = [];

        PLANETS.forEach(candidate => {
          if (candidate === o || candidate === d) return;
          // Only useful as an assist if its own orbit sits between origin's and destination's
          if (candidate.a < rMin * 0.6 || candidate.a > rMax * 1.4) return;

          const sC = stateAt(candidate, tDep + tofDirect * 0.5);
          let angToCandidate = sC.theta - s1.theta;
          while (angToCandidate < 0) angToCandidate += 2 * Math.PI;
          while (angToCandidate > 2 * Math.PI) angToCandidate -= 2 * Math.PI;

          // Angularly roughly "on the way" between origin and destination
          if (angToCandidate > 0.15 && angToCandidate < Math.max(0.15, angDiff - 0.15)) {
            candidates.push({ planet: candidate });
          }
        });

        return candidates;
      }

      function computeAssistTransfer(o, assistPlanet, d, tDep) {
        const at12 = (o.a + assistPlanet.a) / 2;
        const tof1_naive = Math.PI * Math.sqrt(Math.pow(at12, 3) / KERBOL.mu);

        const s1 = stateAt(o, tDep);
        const tof1 = refineFlightTimeForOpposition(s1.theta, assistPlanet, tDep, tof1_naive, KERBOL.mu);
        const sA_arr = stateAt(assistPlanet, tDep + tof1);
        const sA_dep = sA_arr; // flyby treated as instantaneous at the patched-conic level

        const at23 = (assistPlanet.a + d.a) / 2;
        const tof2_naive = Math.PI * Math.sqrt(Math.pow(at23, 3) / KERBOL.mu);
        const tof2 = refineFlightTimeForOpposition(sA_dep.theta, d, tDep + tof1, tof2_naive, KERBOL.mu);
        const s3 = stateAt(d, tDep + tof1 + tof2);

        const sol1 = lambertSolve([s1.x, s1.y], [sA_arr.x, sA_arr.y], tof1, KERBOL.mu);
        if (!sol1) return null;
        const sol2 = lambertSolve([sA_dep.x, sA_dep.y], [s3.x, s3.y], tof2, KERBOL.mu);
        if (!sol2) return null;

        const vInfDep = Math.hypot(sol1.v1[0] - s1.vx, sol1.v1[1] - s1.vy);
        const vInfAtAssistIn = Math.hypot(sol1.v2[0] - sA_arr.vx, sol1.v2[1] - sA_arr.vy);
        const vInfAtAssistOut = Math.hypot(sol2.v1[0] - sA_dep.vx, sol2.v1[1] - sA_dep.vy);
        const vInfArr = Math.hypot(sol2.v2[0] - s3.vx, sol2.v2[1] - s3.vy);

        return {
          assistPlanet, tof1, tof2, totalTime: tof1 + tof2,
          vInfDep, vInfArr,
          totalDv: vInfDep + vInfArr,
          arrivalPos: sA_arr, departurePosSame: sA_dep,
          s1, s3
        };
      }

      function refreshAssistsForCurrentResult() {
        const previouslySelectedPlanet = selectedAssistIdx !== null && currentAssists[selectedAssistIdx]
          ? currentAssists[selectedAssistIdx].planet : null;
        currentAssists = [];
        if (!currentResult) { selectedAssistIdx = null; return; }
        const r = currentResult;
        const waitSec = r.waitSec !== null ? Math.max(0, r.waitSec) : 0;
        const tDep = UT + waitSec;
        const rawCandidates = detectPotentialAssists(r.origin, r.dest, tDep, r.tof);
        const directDv = Math.abs(r.dv1_helio) + Math.abs(r.dv2_helio);
        currentAssists = rawCandidates.map(c => {
          const solved = computeAssistTransfer(r.origin, c.planet, r.dest, tDep);
          if (!solved) return null;
          return { planet: c.planet, solved, savings: directDv - solved.totalDv, depUT: tDep };
        }).filter(Boolean).sort((a, b) => b.savings - a.savings);
        // Re-find the previously selected planet in the refreshed list, if it's still a candidate
        selectedAssistIdx = previouslySelectedPlanet
          ? currentAssists.findIndex(a => a.planet === previouslySelectedPlanet)
          : null;
        if (selectedAssistIdx === -1) selectedAssistIdx = null;
      }

      function clearTransfer() {
        currentResult = null;
        currentAssists = [];
        selectedAssistIdx = null;
        hideTransferArc();
        hideReturnTripOverlay();
        hidePhaseLines();
        clearGhost();
        hideAssistArcs();
        document.getElementById('transferResults').innerHTML = '<div class="placeholder">Select an origin and destination, then click <b>Plan Transfer</b> to compute a Hohmann-style transfer window.</div>';
        document.getElementById('assistList').innerHTML = '<div class="placeholder">Plan a transfer first — if an intermediate planet is well-positioned for a flyby, it\'ll show up here as an optional route.</div>';
      }

      document.getElementById('planBtn').onclick = () => {
        const o = originSelect.value, d = destSelect.value;
        if (o === d) {
          clearTransfer();
          document.getElementById('transferResults').innerHTML = '<div class="placeholder">Origin and destination must be different bodies.</div>';
          return;
        }

        // Check if both bodies resolve to the same heliocentric transfer body
        const originBody = findBody(o);
        const destBody = findBody(d);
        const originTransfer = transferBodyFor(originBody);
        const destTransfer = transferBodyFor(destBody);

        if (originTransfer === destTransfer) {
          clearTransfer();
          const msg = originBody.parent && destBody.parent ?
            'Transfers between moons of the same planet require local maneuvers, not heliocentric transfers.' :
            'These bodies orbit the same body, so a Hohmann transfer cannot be calculated.';
          document.getElementById('transferResults').innerHTML = `<div class="placeholder">${msg}</div>`;
          return;
        }

        currentResult = computeTransfer(o, d);
        if (!currentResult) {
          clearTransfer();
          document.getElementById('transferResults').innerHTML = '<div class="placeholder">Unable to compute transfer for these bodies.</div>';
          return;
        }
        switchTab('transfer');
        renderTransferResults();
        lastSidebarUpdate = performance.now();
        // Init 3D overlays
        initTransferArc();
        updateTransferArc();
        initPhaseLines();
        updatePhaseLines();
        initGhost(currentResult.destSelected);
        updateGhostPosition();
        if (visualizeReturnTrip) {
          initReturnTripOverlay();
          updateReturnTripOverlay();
        }
        // Gravity assist options
        refreshAssistsForCurrentResult();
        renderAssistOptions();
        hideAssistArcs();
      };

      document.getElementById('clearTransferBtn').onclick = clearTransfer;

