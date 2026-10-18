      /* =========================================================
         9. MAIN ANIMATION LOOP
         ========================================================= */
      let lastHudUpdate = 0;
      const HUD_UPDATE_INTERVAL = 100; // Update HUD every 100ms (~10fps) instead of every frame
      
      function loop(now) {
        requestAnimationFrame(loop);
        const dt = Math.min((now - lastFrameTime) / 1000, 0.2);
        lastFrameTime = now;
        // Bridge snapshots set UT directly. Otherwise live sync ticks in real time between corrections.
        if (!bridgeFresh()) UT += dt * (liveMode ? 1 : WARP_LEVELS[warpIndex]);
        
        // Throttle UT display to avoid constant DOM writes
        if (now - lastHudUpdate > 250) {
          document.getElementById('utValue').textContent = utToDateString(UT);
        }

        updateMap(); // move planet meshes each frame

        // Lerp orbital ghost opacities toward their target (smooth fade)
        orbitalGhosts.forEach(og => {
          const lerpSpeed = 6 * Math.min(dt, 0.1); // ~6 per second, clamped
          const cur = og.sphere.material.opacity;
          const next = cur + (og.targetOpacity - cur) * lerpSpeed;
          og.sphere.material.opacity = next;
        });


        if (currentResult) {
          // Recompute phase angles each frame (cheap)
          const os = stateAt(currentResult.origin, UT);
          const ds = stateAt(currentResult.dest, UT);
          currentResult.currentPhase = angNormPM180((ds.theta - os.theta) * 180 / Math.PI);
          // Window countdown: the window is a fixed point in time solved from the real orbits (see applyWindow),
          // so it no longer drifts as it approaches. Re-solve only once it is well past, or if time was wound back.
          if (currentResult.windowUT != null) {
            const toWindow = currentResult.windowUT - UT;
            if (toWindow < -currentResult.windowGraceSec || toWindow > 2 * currentResult.synodicSec) applyWindow(currentResult, UT);
            else currentResult.waitSec = toWindow;
          }

          updateTransferArc();   // update transfer ellipse
          updatePhaseLines();    // update phase angle spokes
          updateGhostPosition(); // move ghost sphere
          if (visualizeReturnTrip) {
            if (!returnArcLine) initReturnTripOverlay();
            updateReturnTripOverlay();
          }
          if (selectedAssistIdx !== null) updateAssistArcs(); // move assist arcs/marker if a flyby route is selected

          // Rate-limited sidebar update (every ~1.2 s)
          if (now - lastSidebarUpdate > 1200) {
            renderTransferResults();
            refreshAssistsForCurrentResult();
            if (visualizeReturnTrip) {
              if (!returnArcLine) initReturnTripOverlay();
              updateReturnTripOverlay();
            }
            if (selectedAssistIdx !== null) { initAssistArcs(); updateAssistArcs(); }
            renderAssistOptions();
            lastSidebarUpdate = now;
          }
        }

        updateLabels(); // project labels to screen (throttled inside function)
        updateCamera(); // update camera position every frame (keeps focused bodies centered)

        // Throttle camera HUD updates to every 100ms (Firefox optimization)
        if (now - lastHudUpdate > HUD_UPDATE_INTERVAL) {
          const rawPct = (1 - (camR - CAM_MIN) / (CAM_MAX - CAM_MIN)) * 100;
          const zoomStr = rawPct > 98 ? rawPct.toFixed(4) : Math.round(rawPct).toString();
          document.getElementById('hudZoomVal').textContent = zoomStr + '%';
          const tiltDeg = Math.round((camPhi / Math.PI) * 180);
          const rotDeg = ((Math.round((camTheta / (2 * Math.PI)) * 360) % 360) + 360) % 360;
          document.getElementById('hudTiltVal').textContent = tiltDeg + '°';
          document.getElementById('hudRotVal').textContent = rotDeg + '°';
          const warpLabel = liveMode ? 'LIVE' : (WARP_LEVELS[warpIndex] >= 1000
            ? (WARP_LEVELS[warpIndex] / 1000).toFixed(WARP_LEVELS[warpIndex] % 1000 ? 1 : 0) + 'k×'
            : WARP_LEVELS[warpIndex] + '×');
          document.getElementById('hudWarpVal').textContent = warpLabel;
          const focusRow = document.getElementById('hudFocus');
          if (focusedPlanet) {
            focusRow.style.display = '';
            document.getElementById('hudFocusVal').textContent = focusedPlanet;
          } else {
            focusRow.style.display = 'none';
          }
          lastHudUpdate = now;
        }

        renderer.render(scene, camera);
      }
      // Bug-report screenshot hook: render once and read the WebGL canvas in the same tick
      // (the drawing buffer is cleared after compositing, so it can't be read later).
      window.__kerbalistSnapshotWebGL = function () {
        try {
          renderer.render(scene, camera);
          return { id: canvas3d.id, dataUrl: canvas3d.toDataURL('image/png') };
        } catch (e) {
          return null;
        }
      };

      requestAnimationFrame(loop);

    })(THREE);
