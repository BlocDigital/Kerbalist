      /* =========================================================
         PERSISTENT GEOMETRY — Gravity Assist Arcs (two Lambert legs)
         ========================================================= */
      let assistArcGeos = [null, null], assistArcLines = [null, null];
      let assistDot = null, assistGlow = null;
      let assistLabelEl = null, assistLegLabelEls = [null, null];
      let assistGhostSphere = null, assistGhostGlow = null, assistGhostLabelEl = null;

      function initAssistArcs() {
        hideAssistArcs();
        for (let leg = 0; leg < 2; leg++) {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_N + 1) * 3), 3));
          const line = new THREE.Line(geo, new THREE.LineDashedMaterial({
            color: 0xb78cff, dashSize: 6, gapSize: 4, transparent: true, opacity: 0.85
          }));
          scene.add(line);
          line.computeLineDistances(); // Initialize dashed line distances
          assistArcGeos[leg] = geo;
          assistArcLines[leg] = line;
        }
        assistDot = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 12), new THREE.MeshBasicMaterial({ color: 0xb78cff }));
        assistGlow = new THREE.Mesh(new THREE.SphereGeometry(7, 14, 14), new THREE.MeshBasicMaterial({ color: 0xb78cff, transparent: true, opacity: 0.18, depthWrite: false }));
        scene.add(assistDot);
        scene.add(assistGlow);
        // Dim the direct arc so the assist route reads as the highlighted option
        if (arcLine) arcLine.material.opacity = 0.28;

        // Labels: one on the flyby planet itself, one on each leg of the route
        assistLabelEl = document.createElement('div');
        assistLabelEl.className = 'assist-label-3d';
        labelCtr.appendChild(assistLabelEl);

        assistLegLabelEls[0] = document.createElement('div');
        assistLegLabelEls[0].className = 'assist-label-3d leg';
        labelCtr.appendChild(assistLegLabelEls[0]);

        assistLegLabelEls[1] = document.createElement('div');
        assistLegLabelEls[1].className = 'assist-label-3d leg';
        labelCtr.appendChild(assistLegLabelEls[1]);

        // Assist-route arrival ghost — where the destination REALLY is at the
        // (typically very different) arrival time this route implies, shown
        // in violet so it reads as belonging to the assist route rather than
        // the direct transfer's own amber ghost.
        assistGhostSphere = new THREE.Mesh(
          new THREE.SphereGeometry(6.5, 18, 18),
          new THREE.MeshBasicMaterial({ color: 0xb78cff, transparent: true, opacity: 0.28, depthWrite: false })
        );
        scene.add(assistGhostSphere);
        assistGhostGlow = new THREE.Mesh(
          new THREE.SphereGeometry(12, 18, 18),
          new THREE.MeshBasicMaterial({ color: 0xb78cff, transparent: true, opacity: 0.07, depthWrite: false })
        );
        scene.add(assistGhostGlow);
        assistGhostLabelEl = document.createElement('div');
        assistGhostLabelEl.className = 'ghost-label-3d';
        assistGhostLabelEl.style.color = 'var(--violet)';
        assistGhostLabelEl.textContent = '⬡ Arrival (via assist)';
        labelCtr.appendChild(assistGhostLabelEl);
      }

      function updateAssistArcs() {
        if (selectedAssistIdx === null || !currentAssists[selectedAssistIdx] || !assistArcGeos[0]) return;
        const r = currentResult;
        const a = currentAssists[selectedAssistIdx];
        const sol = a.solved;
        const tDep = a.depUT;

        // Leg 1: origin -> assist planet
        const r1 = r.origin.a, r2a = a.planet.a;
        const os = stateAt(r.origin, tDep);
        const sAarr = stateAt(a.planet, tDep + sol.tof1);
        const incl1a = r.origin.incl, incl1b = a.planet.incl;
        const scale1Start = heliocentricDisplayScale(r1);
        const scale1End = heliocentricDisplayScale(r2a);
        let lambertPts1 = buildLambertArcPoints(os.x, os.y, sAarr.x, sAarr.y, sol.tof1, KERBOL.mu, ARC_N);
        let arr = assistArcGeos[0].attributes.position.array;
        if (lambertPts1) {
          for (let i = 0; i <= ARC_N; i++) {
            const frac = i / ARC_N;
            const curIncl = incl1a + (incl1b - incl1a) * frac;
            const blendedScale = scale1Start + (scale1End - scale1Start) * smoothstep(frac);
            const p = lambertPts1[i];
            const pt = toWorldBlendedScale(p.x, p.y, curIncl, blendedScale);
            arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
          }
        } else {
          const at1 = (r1 + r2a) / 2, e1 = Math.abs(r2a - r1) / (r2a + r1);
          const inbound1 = r2a < r1;
          const periTheta1 = inbound1 ? (os.theta - Math.PI) : os.theta;
          for (let i = 0; i <= ARC_N; i++) {
            const frac = i / ARC_N;
            const nu = inbound1 ? Math.PI * (1 - frac) : frac * Math.PI;
            const rr = at1 * (1 - e1 * e1) / (1 + e1 * Math.cos(nu));
            const theta = nu + periTheta1;
            const curIncl = incl1a + (incl1b - incl1a) * frac;
            const blendedScale = scale1Start + (scale1End - scale1Start) * smoothstep(frac);
            const pt = toWorldBlendedScale(rr * Math.cos(theta), rr * Math.sin(theta), curIncl, blendedScale);
            arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
          }
        }
        assistArcGeos[0].attributes.position.needsUpdate = true;
        assistArcLines[0].computeLineDistances();

        // Leg 2: assist planet -> destination
        const r2b = a.planet.a, r3 = r.dest.a;
        const sA = sAarr; // departure point of leg 2 = arrival point of leg 1
        const s3 = stateAt(r.dest, tDep + sol.tof1 + sol.tof2);
        const incl2a = a.planet.incl, incl2b = r.dest.incl;
        const scale2Start = heliocentricDisplayScale(r2b);
        const scale2End = heliocentricDisplayScale(r3);
        let lambertPts2 = buildLambertArcPoints(sA.x, sA.y, s3.x, s3.y, sol.tof2, KERBOL.mu, ARC_N);
        arr = assistArcGeos[1].attributes.position.array;
        if (lambertPts2) {
          for (let i = 0; i <= ARC_N; i++) {
            const frac = i / ARC_N;
            const curIncl = incl2a + (incl2b - incl2a) * frac;
            const blendedScale = scale2Start + (scale2End - scale2Start) * smoothstep(frac);
            const p = lambertPts2[i];
            const pt = toWorldBlendedScale(p.x, p.y, curIncl, blendedScale);
            arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
          }
        } else {
          const at2 = (r2b + r3) / 2, e2 = Math.abs(r3 - r2b) / (r3 + r2b);
          const inbound2 = r3 < r2b;
          const periTheta2 = inbound2 ? (sA.theta - Math.PI) : sA.theta;
          for (let i = 0; i <= ARC_N; i++) {
            const frac = i / ARC_N;
            const nu = inbound2 ? Math.PI * (1 - frac) : frac * Math.PI;
            const rr = at2 * (1 - e2 * e2) / (1 + e2 * Math.cos(nu));
            const theta = nu + periTheta2;
            const curIncl = incl2a + (incl2b - incl2a) * frac;
            const blendedScale = scale2Start + (scale2End - scale2Start) * smoothstep(frac);
            const pt = toWorldBlendedScale(rr * Math.cos(theta), rr * Math.sin(theta), curIncl, blendedScale);
            arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
          }
        }
        assistArcGeos[1].attributes.position.needsUpdate = true;
        assistArcLines[1].computeLineDistances();

        // Ghost marker at the flyby encounter position
        const encounterPos = toWorld(sA.x, sA.y, a.planet.incl);
        assistDot.position.copy(encounterPos);
        assistGlow.position.copy(encounterPos);

        // Assist-route arrival ghost — the destination's real position at
        // THIS route's (often very different) arrival time
        const assistArrivalPos = toWorld(s3.x, s3.y, r.dest.incl);
        if (assistGhostSphere) {
          assistGhostSphere.position.copy(assistArrivalPos);
          assistGhostGlow.position.copy(assistArrivalPos);
          if (assistGhostLabelEl) assistGhostLabelEl._worldPos = assistArrivalPos;
        }

        // Label on the flyby planet itself
        if (assistLabelEl) {
          assistLabelEl.textContent = `◈ ${a.planet.name} flyby`;
          assistLabelEl._worldPos = encounterPos;
        }

        // Leg labels, placed at the midpoint of each drawn curve so they sit
        // readably along the arc rather than stacked on the endpoints
        const midIdx = Math.floor(ARC_N / 2);
        if (assistLegLabelEls[0]) {
          const midArr = assistArcGeos[0].attributes.position.array;
          const mi = midIdx * 3;
          assistLegLabelEls[0].textContent = `${r.origin.name} → ${a.planet.name} · ${durationString(sol.tof1)}`;
          assistLegLabelEls[0]._worldPos = new THREE.Vector3(midArr[mi], midArr[mi + 1], midArr[mi + 2]);
        }
        if (assistLegLabelEls[1]) {
          const midArr = assistArcGeos[1].attributes.position.array;
          const mi = midIdx * 3;
          assistLegLabelEls[1].textContent = `${a.planet.name} → ${r.dest.name} · ${durationString(sol.tof2)}`;
          assistLegLabelEls[1]._worldPos = new THREE.Vector3(midArr[mi], midArr[mi + 1], midArr[mi + 2]);
        }
      }

      function hideAssistArcs() {
        assistArcLines.forEach(l => { if (l) scene.remove(l); });
        assistArcGeos = [null, null]; assistArcLines = [null, null];
        if (assistDot) { scene.remove(assistDot); assistDot = null; }
        if (assistGlow) { scene.remove(assistGlow); assistGlow = null; }
        if (arcLine) arcLine.material.opacity = 0.9; // restore direct-arc brightness
        if (assistLabelEl) { assistLabelEl.remove(); assistLabelEl = null; }
        assistLegLabelEls.forEach((el, i) => { if (el) { el.remove(); assistLegLabelEls[i] = null; } });
        if (assistGhostSphere) { scene.remove(assistGhostSphere); assistGhostSphere = null; }
        if (assistGhostGlow) { scene.remove(assistGhostGlow); assistGhostGlow = null; }
        if (assistGhostLabelEl) { assistGhostLabelEl.remove(); assistGhostLabelEl = null; }
      }

