      /* =========================================================
         PERSISTENT GEOMETRY — Transfer Arc
         ========================================================= */
      const ARC_N = 120;
      let arcGeo = null, arcLine = null, arcDepDot = null, arcArrDot = null;

      function initTransferArc() {
        if (arcLine) { scene.remove(arcLine); }
        if (arcDepDot) { scene.remove(arcDepDot); }
        if (arcArrDot) { scene.remove(arcArrDot); }

        arcGeo = new THREE.BufferGeometry();
        arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_N + 1) * 3), 3));
        arcLine = new THREE.Line(arcGeo, new THREE.LineDashedMaterial({
          color: 0x7ee787, dashSize: 7, gapSize: 5, transparent: true, opacity: 0.9
        }));
        scene.add(arcLine);
        arcLine.computeLineDistances(); // Initialize dashed line distances

        arcDepDot = new THREE.Mesh(new THREE.SphereGeometry(3.8, 10, 10), new THREE.MeshBasicMaterial({ color: 0x7ee787 }));
        arcArrDot = new THREE.Mesh(new THREE.SphereGeometry(3.8, 10, 10), new THREE.MeshBasicMaterial({ color: 0x7ee787, transparent: true, opacity: 0.55 }));
        scene.add(arcDepDot);
        scene.add(arcArrDot);
      }

      function updateTransferArc() {
        if (!arcLine || !currentResult) return;
        const r = currentResult;
        const waitSec = r.waitSec !== null ? Math.max(0, r.waitSec) : 0;
        const depUT = UT + waitSec;
        const arrUT = depUT + r.tof;

        const osDep = stateAt(r.origin, depUT);
        const dsArr = stateAt(r.dest, arrUT);

        const ptDep = bodyWorldPositionAt(r.originSelected, depUT);
        const ptArr = bodyWorldPositionAt(r.destSelected, arrUT);

        const rA = Math.hypot(osDep.x, osDep.y);
        const rB = Math.hypot(dsArr.x, dsArr.y);

        const scaleStart = heliocentricDisplayScale(rA);
        const scaleEnd = heliocentricDisplayScale(rB);

        // Solve for the real trajectory connecting these two exact points in
        // the known transfer time (handles eccentric destinations correctly —
        // see buildLambertArcPoints for why the old fixed-180-degree ellipse
        // construction could miss the arrival point). Falls back to the
        // idealized ellipse only if Lambert can't find a solution.
        let lambertPts = buildLambertArcPoints(osDep.x, osDep.y, dsArr.x, dsArr.y, r.tof, KERBOL.mu, ARC_N);

        const arr = arcGeo.attributes.position.array;
        if (lambertPts) {
          for (let i = 0; i <= ARC_N; i++) {
            const frac = i / ARC_N;
            const curIncl = r.origin.incl + (r.dest.incl - r.origin.incl) * frac;
            const blendedScale = scaleStart + (scaleEnd - scaleStart) * smoothstep(frac);
            const p = lambertPts[i];
            const pt = toWorldBlendedScale(p.x, p.y, curIncl, blendedScale);
            arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
          }
        } else {
          const a_t = (rA + rB) / 2;
          const e_t = Math.abs(rB - rA) / (rB + rA);
          const inbound = rB < rA;
          const periTheta = inbound ? (osDep.theta - Math.PI) : osDep.theta;
          for (let i = 0; i <= ARC_N; i++) {
            const frac = i / ARC_N;
            const nu = inbound ? Math.PI * (1 - frac) : frac * Math.PI;
            const rr = a_t * (1 - e_t * e_t) / (1 + e_t * Math.cos(nu));
            const theta = nu + periTheta;
            const curIncl = r.origin.incl + (r.dest.incl - r.origin.incl) * frac;
            const blendedScale = scaleStart + (scaleEnd - scaleStart) * smoothstep(frac);
            const pt = toWorldBlendedScale(rr * Math.cos(theta), rr * Math.sin(theta), curIncl, blendedScale);
            arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
          }
        }
        arcGeo.attributes.position.needsUpdate = true;
        arcLine.computeLineDistances();
        arcDepDot.position.set(ptDep.x, ptDep.y, ptDep.z);
        arcArrDot.position.set(ptArr.x, ptArr.y, ptArr.z);
      }

      function hideTransferArc() {
        if (arcLine) { scene.remove(arcLine); arcLine = null; }
        if (arcDepDot) { scene.remove(arcDepDot); arcDepDot = null; }
        if (arcArrDot) { scene.remove(arcArrDot); arcArrDot = null; }
        arcGeo = null;
      }

      let returnArcGeo = null, returnArcLine = null, returnDepDot = null, returnArrDot = null;
      let returnDepGhost = null, returnDepGlow = null, returnDepLineGeo = null, returnDepLineObj = null, returnDepLabelEl = null;
      let returnArrGhost = null, returnArrGlow = null, returnArrLineGeo = null, returnArrLineObj = null, returnArrLabelEl = null;

      function initReturnTripOverlay() {
        hideReturnTripOverlay();

        returnArcGeo = new THREE.BufferGeometry();
        returnArcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_N + 1) * 3), 3));
        returnArcLine = new THREE.Line(returnArcGeo, new THREE.LineDashedMaterial({
          color: 0x4aa3ff, dashSize: 7, gapSize: 5, transparent: true, opacity: 0.9
        }));
        scene.add(returnArcLine);
        returnArcLine.computeLineDistances(); // Initialize dashed line distances

        returnDepDot = new THREE.Mesh(new THREE.SphereGeometry(3.8, 10, 10), new THREE.MeshBasicMaterial({ color: 0x4aa3ff }));
        returnArrDot = new THREE.Mesh(new THREE.SphereGeometry(3.8, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.65 }));
        scene.add(returnDepDot);
        scene.add(returnArrDot);

        returnDepGhost = new THREE.Mesh(
          new THREE.SphereGeometry(6.5, 18, 18),
          new THREE.MeshBasicMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.3, depthWrite: false })
        );
        returnDepGlow = new THREE.Mesh(
          new THREE.SphereGeometry(12, 18, 18),
          new THREE.MeshBasicMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.08, depthWrite: false })
        );
        scene.add(returnDepGhost);
        scene.add(returnDepGlow);

        returnArrGhost = new THREE.Mesh(
          new THREE.SphereGeometry(6.5, 18, 18),
          new THREE.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.32, depthWrite: false })
        );
        returnArrGlow = new THREE.Mesh(
          new THREE.SphereGeometry(12, 18, 18),
          new THREE.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.09, depthWrite: false })
        );
        scene.add(returnArrGhost);
        scene.add(returnArrGlow);

        returnDepLineGeo = new THREE.BufferGeometry();
        returnDepLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        returnDepLineObj = new THREE.Line(returnDepLineGeo, new THREE.LineDashedMaterial({
          color: 0x4aa3ff, dashSize: 5, gapSize: 5, transparent: true, opacity: 0.45
        }));
        scene.add(returnDepLineObj);
        returnDepLineObj.computeLineDistances(); // Initialize dashed line distances

        returnArrLineGeo = new THREE.BufferGeometry();
        returnArrLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        returnArrLineObj = new THREE.Line(returnArrLineGeo, new THREE.LineDashedMaterial({
          color: 0xffb454, dashSize: 5, gapSize: 5, transparent: true, opacity: 0.45
        }));
        scene.add(returnArrLineObj);
        returnArrLineObj.computeLineDistances(); // Initialize dashed line distances

        returnDepLabelEl = document.createElement('div');
        returnDepLabelEl.className = 'ghost-label-3d';
        returnDepLabelEl.style.color = '#4aa3ff';
        returnDepLabelEl.textContent = '⬡ Return departure';
        labelCtr.appendChild(returnDepLabelEl);

        returnArrLabelEl = document.createElement('div');
        returnArrLabelEl.className = 'ghost-label-3d';
        returnArrLabelEl.style.color = 'var(--amber)';
        returnArrLabelEl.textContent = '⬡ Kerbin return';
        labelCtr.appendChild(returnArrLabelEl);
      }

      function updateReturnTripOverlay() {
        if (!visualizeReturnTrip || !returnArcLine || !currentResult) return;
        const plan = getReturnPlan(currentResult);
        if (!plan) {
          visualizeReturnTrip = false;
          hideReturnTripOverlay();
          return;
        }

        const ret = plan.ret;
        const depUT = plan.returnDepartureUT;
        const arrUT = plan.returnArrivalUT;
        const osDep = stateAt(ret.origin, depUT);
        const dsArr = stateAt(ret.dest, arrUT);
        const ptDep = bodyWorldPositionAt(plan.departureBody, depUT);
        const ptArr = bodyWorldPositionAt(ret.destSelected, arrUT);
        const scaleStart = heliocentricDisplayScale(Math.hypot(osDep.x, osDep.y));
        const scaleEnd = heliocentricDisplayScale(Math.hypot(dsArr.x, dsArr.y));
        const lambertPts = buildLambertArcPoints(osDep.x, osDep.y, dsArr.x, dsArr.y, ret.tt, KERBOL.mu, ARC_N);
        const arr = returnArcGeo.attributes.position.array;

        if (lambertPts) {
          for (let i = 0; i <= ARC_N; i++) {
            const frac = i / ARC_N;
            const curIncl = ret.origin.incl + (ret.dest.incl - ret.origin.incl) * frac;
            const blendedScale = scaleStart + (scaleEnd - scaleStart) * smoothstep(frac);
            const p = lambertPts[i];
            const pt = toWorldBlendedScale(p.x, p.y, curIncl, blendedScale);
            arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
          }
        } else {
          const rA = Math.hypot(osDep.x, osDep.y);
          const rB = Math.hypot(dsArr.x, dsArr.y);
          const a_t = (rA + rB) / 2;
          const e_t = Math.abs(rB - rA) / (rB + rA);
          const inbound = rB < rA;
          const periTheta = inbound ? (osDep.theta - Math.PI) : osDep.theta;
          for (let i = 0; i <= ARC_N; i++) {
            const frac = i / ARC_N;
            const nu = inbound ? Math.PI * (1 - frac) : frac * Math.PI;
            const rr = a_t * (1 - e_t * e_t) / (1 + e_t * Math.cos(nu));
            const theta = nu + periTheta;
            const curIncl = ret.origin.incl + (ret.dest.incl - ret.origin.incl) * frac;
            const blendedScale = scaleStart + (scaleEnd - scaleStart) * smoothstep(frac);
            const pt = toWorldBlendedScale(rr * Math.cos(theta), rr * Math.sin(theta), curIncl, blendedScale);
            arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
          }
        }

        returnArcGeo.attributes.position.needsUpdate = true;
        returnArcLine.computeLineDistances();
        returnDepDot.position.copy(ptDep);
        returnArrDot.position.copy(ptArr);
        returnDepGhost.position.copy(ptDep);
        returnDepGlow.position.copy(ptDep);
        returnArrGhost.position.copy(ptArr);
        returnArrGlow.position.copy(ptArr);

        const currentDepBodyPos = bodyWorldPositionAt(plan.departureBody, UT);
        const depLine = returnDepLineGeo.attributes.position.array;
        depLine[0] = currentDepBodyPos.x; depLine[1] = currentDepBodyPos.y; depLine[2] = currentDepBodyPos.z;
        depLine[3] = ptDep.x; depLine[4] = ptDep.y; depLine[5] = ptDep.z;
        returnDepLineGeo.attributes.position.needsUpdate = true;
        returnDepLineObj.computeLineDistances();

        const currentKerbinPos = bodyWorldPositionAt(ret.destSelected, UT);
        const arrLine = returnArrLineGeo.attributes.position.array;
        arrLine[0] = currentKerbinPos.x; arrLine[1] = currentKerbinPos.y; arrLine[2] = currentKerbinPos.z;
        arrLine[3] = ptArr.x; arrLine[4] = ptArr.y; arrLine[5] = ptArr.z;
        returnArrLineGeo.attributes.position.needsUpdate = true;
        returnArrLineObj.computeLineDistances();

        if (returnDepLabelEl) returnDepLabelEl._worldPos = ptDep;
        if (returnArrLabelEl) returnArrLabelEl._worldPos = ptArr;
      }

      function hideReturnTripOverlay() {
        if (returnArcLine) { scene.remove(returnArcLine); returnArcLine = null; }
        if (returnDepDot) { scene.remove(returnDepDot); returnDepDot = null; }
        if (returnArrDot) { scene.remove(returnArrDot); returnArrDot = null; }
        if (returnDepGhost) { scene.remove(returnDepGhost); returnDepGhost = null; }
        if (returnDepGlow) { scene.remove(returnDepGlow); returnDepGlow = null; }
        if (returnArrGhost) { scene.remove(returnArrGhost); returnArrGhost = null; }
        if (returnArrGlow) { scene.remove(returnArrGlow); returnArrGlow = null; }
        if (returnDepLineObj) { scene.remove(returnDepLineObj); returnDepLineObj = null; }
        if (returnArrLineObj) { scene.remove(returnArrLineObj); returnArrLineObj = null; }
        if (returnDepLabelEl) { returnDepLabelEl.remove(); returnDepLabelEl = null; }
        if (returnArrLabelEl) { returnArrLabelEl.remove(); returnArrLabelEl = null; }
        returnArcGeo = null;
        returnDepLineGeo = null;
        returnArrLineGeo = null;
      }

