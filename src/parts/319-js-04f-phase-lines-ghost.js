      /* =========================================================
         PERSISTENT GEOMETRY — Phase Wedge Lines
         Three lines: reference | current phase | required phase
         ========================================================= */
      let phaseGeos = [], phaseLines = [];

      function initPhaseLines() {
        phaseLines.forEach(l => scene.remove(l));
        phaseGeos = []; phaseLines = [];
        const defs = [
          { color: 0x4d5d78, opacity: 0.65 },  // reference spoke
          { color: 0x4fe0e8, opacity: 0.95 },  // current phase
          { color: 0xffb454, opacity: 0.80 },  // required phase (dashed)
        ];
        defs.forEach((d, idx) => {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
          const mat = idx === 2
            ? new THREE.LineDashedMaterial({ color: d.color, dashSize: 5, gapSize: 4, transparent: true, opacity: d.opacity })
            : new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: d.opacity });
          const line = new THREE.Line(geo, mat);
          scene.add(line);
          // Initialize computeLineDistances for dashed lines
          if (idx === 2) line.computeLineDistances();
          phaseGeos.push(geo);
          phaseLines.push(line);
        });
      }

      function updatePhaseLines() {
        if (!phaseLines.length || !currentResult) return;
        const r = currentResult;
        const os = stateAt(r.origin, UT);
        const rad = Math.min(r.r1, r.r2) * 0.52;
        function pt(theta) { return toWorld(rad * Math.cos(theta), rad * Math.sin(theta), 0); }
        const p0 = pt(os.theta);
        const pCur = pt(os.theta + r.currentPhase * DEG);
        const pReq = pt(os.theta + r.requiredPhase * DEG);
        const endpoints = [p0, pCur, pReq];
        endpoints.forEach((ep, idx) => {
          const arr = phaseGeos[idx].attributes.position.array;
          arr[0] = 0; arr[1] = 0; arr[2] = 0;
          arr[3] = ep.x; arr[4] = ep.y; arr[5] = ep.z;
          phaseGeos[idx].attributes.position.needsUpdate = true;
          if (idx === 2) phaseLines[idx].computeLineDistances();
        });
      }

      function hidePhaseLines() {
        phaseLines.forEach(l => scene.remove(l));
        phaseGeos = []; phaseLines = [];
      }

      /* =========================================================
         PERSISTENT GEOMETRY — Ghost Planet
         ========================================================= */
      let ghostSphere = null, ghostGlow = null;
      let ghostLineGeo = null, ghostLineObj = null;
      let ghostLabelEl = null;
      let ghostDest = null;

      function initGhost(destPlanet) {
        clearGhost();
        ghostDest = destPlanet;
        const col = new THREE.Color(destPlanet.color);

        ghostSphere = new THREE.Mesh(
          new THREE.SphereGeometry(6.5, 18, 18),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, depthWrite: false })
        );
        scene.add(ghostSphere);

        ghostGlow = new THREE.Mesh(
          new THREE.SphereGeometry(12, 18, 18),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.07, depthWrite: false })
        );
        scene.add(ghostGlow);

        // Dashed line: current pos → ghost pos
        ghostLineGeo = new THREE.BufferGeometry();
        ghostLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        ghostLineObj = new THREE.Line(ghostLineGeo, new THREE.LineDashedMaterial({
          color: col, dashSize: 5, gapSize: 5, transparent: true, opacity: 0.45
        }));
        scene.add(ghostLineObj);
        // Must call computeLineDistances even with empty geometry to initialize dashed material
        ghostLineObj.computeLineDistances();

        // Label
        ghostLabelEl = document.createElement('div');
        ghostLabelEl.className = 'ghost-label-3d';
        ghostLabelEl.textContent = '⬡ Arrival';
        labelCtr.appendChild(ghostLabelEl);
      }

      function updateGhostPosition() {
        if (!ghostSphere || !currentResult || !ghostDest) return;
        const r = currentResult;
        const waitSec = r.waitSec !== null ? Math.max(0, r.waitSec) : 0;
        const selectedAssist = (selectedAssistIdx !== null && currentAssists[selectedAssistIdx]) ? currentAssists[selectedAssistIdx] : null;
        const totalFlightTime = selectedAssist ? selectedAssist.solved.totalTime : r.tof;
        const ghostUT = UT + waitSec + totalFlightTime;

        const gPos = bodyWorldPositionAt(ghostDest, ghostUT);
        ghostSphere.position.copy(gPos);
        ghostGlow.position.copy(gPos);

        // Update line from current planet pos to ghost pos
        const curPos = bodyWorldPositionAt(ghostDest, UT);
        const la = ghostLineGeo.attributes.position.array;
        la[0] = curPos.x; la[1] = curPos.y; la[2] = curPos.z;
        la[3] = gPos.x; la[4] = gPos.y; la[5] = gPos.z;
        ghostLineGeo.attributes.position.needsUpdate = true;
        if (ghostLineObj) ghostLineObj.computeLineDistances();

        // Store world pos for label projection
        if (ghostLabelEl) ghostLabelEl._worldPos = gPos;
      }

      function clearGhost() {
        if (ghostSphere) { scene.remove(ghostSphere); ghostSphere = null; }
        if (ghostGlow) { scene.remove(ghostGlow); ghostGlow = null; }
        if (ghostLineObj) { scene.remove(ghostLineObj); ghostLineObj = null; }
        ghostLineGeo = null;
        if (ghostLabelEl) { ghostLabelEl.remove(); ghostLabelEl = null; }
        ghostDest = null;
      }

