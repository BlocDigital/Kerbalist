      /* ---- Planet & Moon position update (every frame) ---- */
      // The faint halo around each planet and moon is 1.25 times its real radius, which is far below a
      // pixel for small bodies, so it disappears. Give each halo a minimum on-screen size. The body
      // itself keeps its real size.
      const MIN_HALO_PIXELS = 4;
      function enforceMinBodySize() {
        const h = renderer.domElement.clientHeight || 1;
        const pixelWorld = (dist) => 2 * Math.tan(camera.fov * Math.PI / 360) * dist / h;
        const apply = (mesh) => {
          if (!mesh) return;
          mesh.scale.setScalar(1);
          const dist = camera.position.distanceTo(mesh.getWorldPosition(new THREE.Vector3()));
          const minRadius = pixelWorld(dist) * MIN_HALO_PIXELS;
          mesh.children.forEach(child => {
            const r = child.geometry && child.geometry.parameters && child.geometry.parameters.radius;
            if (r) child.scale.setScalar(Math.max(1, minRadius / r));
          });
        };
        PLANETS.forEach(p => apply(planetMeshes[p.name]));
        MOONS.forEach(m => apply(moonMeshes[m.name]));
      }

      function updateMap() {
        PLANETS.forEach(p => {
          const st = stateAt(p, UT);
          p._state = st;
          planetMeshes[p.name].position.copy(toWorld(st.x, st.y, p.incl));
        });

        MOONS.forEach(m => {
          m._state = stateAt(m, UT);
          // Position moon mesh at world position
          moonMeshes[m.name].position.copy(moonLocalPosition(m, UT));
          // Position moon orbit line at parent planet's world position
          const parent = PLANETS.find(p => p.name === m.parent);
          if (parent) {
            const parentWorld = toWorld(parent._state.x, parent._state.y, parent.incl);
            moonOrbitLines[m.name].position.copy(parentWorld);
          }
        });

        updateBridgeVisuals(); // telemetry bridge overrides positions when connected
        enforceMinBodySize();

        // Camera follows focused planet or moon
        if (focusedPlanet) {
          const focusedMesh = planetMeshes[focusedPlanet] || moonMeshes[focusedPlanet];
          if (focusedMesh) {
            camTarget.copy(focusedMesh.position);
          }
        }

        // Update orbital ghost positions + visibility
        orbitalGhosts.forEach(og => {
          const p = og.planet;
          // Ghost sits exactly on the planet's current position
          const actualPos = planetMeshes[p.name].position;
          og.sphere.position.copy(actualPos);

          // Determine target opacity
          // 1) Fully hidden when zoomed in past the moon-label threshold
          if (camR < MOON_THRESH) {
            og.targetOpacity = 0;
            return;
          }
          // 2) Fade in between MOON_THRESH and MOON_THRESH * 1.4
          const fadeRange = MOON_THRESH * 0.4;
          const zoomFade = Math.min(1, (camR - MOON_THRESH) / fadeRange);

          // 3) Hide if the camTarget is centred near this planet
          const dx = camTarget.x - actualPos.x;
          const dy = camTarget.y - actualPos.y;
          const dz = camTarget.z - actualPos.z;
          const proxFade = Math.min(1, Math.max(0,
            (dx * dx + dy * dy + dz * dz - ORB_GHOST_PROX_SQ * 0.3) / (ORB_GHOST_PROX_SQ * 0.7)
          ));

          og.targetOpacity = 0.45 * zoomFade * proxFade;
        });
      }

      /* ---- Project world position to screen ---- */
      function worldToScreen(worldPos) {
        const v = worldPos.clone().project(camera);
        const rect = canvas3d.getBoundingClientRect();
        return {
          x: (v.x + 1) / 2 * rect.width,
          y: (-v.y + 1) / 2 * rect.height,
          behind: v.z >= 1
        };
      }

      /* ---- Label update (throttled for Firefox performance) ---- */
      let lastLabelUpdate = 0;
      const LABEL_UPDATE_INTERVAL = 16; // ~60fps target, can skip frames
      function updateLabels() {
        const now = performance.now();
        // Skip if too soon (throttle to ~60fps even if RAF fires faster)
        if (now - lastLabelUpdate < LABEL_UPDATE_INTERVAL) return;
        lastLabelUpdate = now;
        PLANETS.forEach(p => {
          const s = worldToScreen(planetMeshes[p.name].position);
          const el = planetLabelEls[p.name];
          el.style.left = s.x + 'px';
          el.style.top = s.y + 'px';
          el.style.display = s.behind ? 'none' : '';
        });

        MOONS.forEach(m => {
          const moonMesh = moonMeshes[m.name];
          const el = moonLabelEls[m.name];
          if (moonMesh) {
            // Hide moon labels when zoomed out far (only show when close to camera)
            if (camR > 75) {
              el.style.display = 'none';
              return;
            }
            const worldPos = new THREE.Vector3();
            moonMesh.getWorldPosition(worldPos);
            const s = worldToScreen(worldPos);
            el.style.left = s.x + 'px';
            el.style.top = s.y + 'px';
            el.style.display = s.behind ? 'none' : '';
          }
        });

        if (ghostLabelEl && ghostLabelEl._worldPos) {
          const s = worldToScreen(ghostLabelEl._worldPos);
          ghostLabelEl.style.left = s.x + 'px';
          ghostLabelEl.style.top = s.y + 'px';
          ghostLabelEl.style.display = s.behind ? 'none' : '';
        }

        if (assistLabelEl && assistLabelEl._worldPos) {
          const s = worldToScreen(assistLabelEl._worldPos);
          assistLabelEl.style.left = s.x + 'px';
          assistLabelEl.style.top = (s.y - 8) + 'px'; // small gap above the flyby marker; CSS handles centering/anchor
          assistLabelEl.style.display = s.behind ? 'none' : '';
        }
        assistLegLabelEls.forEach(el => {
          if (!el || !el._worldPos) return;
          const s = worldToScreen(el._worldPos);
          el.style.left = s.x + 'px';
          el.style.top = s.y + 'px';
          el.style.display = s.behind ? 'none' : '';
        });

        if (assistGhostLabelEl && assistGhostLabelEl._worldPos) {
          const s = worldToScreen(assistGhostLabelEl._worldPos);
          assistGhostLabelEl.style.left = s.x + 'px';
          assistGhostLabelEl.style.top = s.y + 'px';
          assistGhostLabelEl.style.display = s.behind ? 'none' : '';
        }

        if (returnDepLabelEl && returnDepLabelEl._worldPos) {
          const s = worldToScreen(returnDepLabelEl._worldPos);
          returnDepLabelEl.style.left = s.x + 'px';
          returnDepLabelEl.style.top = s.y + 'px';
          returnDepLabelEl.style.display = s.behind ? 'none' : '';
        }

        if (returnArrLabelEl && returnArrLabelEl._worldPos) {
          const s = worldToScreen(returnArrLabelEl._worldPos);
          returnArrLabelEl.style.left = s.x + 'px';
          returnArrLabelEl.style.top = s.y + 'px';
          returnArrLabelEl.style.display = s.behind ? 'none' : '';
        }
      }

