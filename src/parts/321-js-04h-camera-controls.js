      /* =========================================================
         CAMERA CONTROLS — rotate / pan (shift) / zoom
         ========================================================= */
      let dragging = false, dragMoved = false, isPanning = false;
      let dStart = { x: 0, y: 0 };
      let camAtDragStart = { theta: 0, phi: 0 };
      const targetAtDragStart = new THREE.Vector3();

      canvas3d.addEventListener('mousedown', e => {
        dragging = true; dragMoved = false;
        isPanning = e.shiftKey || e.button === 1;  // Shift+drag OR middle-click (button 1) pans
        dStart = { x: e.clientX, y: e.clientY };
        camAtDragStart = { theta: camTheta, phi: camPhi };
        targetAtDragStart.copy(camTarget);
        canvas3d.classList.add(isPanning ? 'panning' : 'grabbing');
        if (e.button === 1) e.preventDefault();  // Prevent middle-click default behavior
      });
      window.addEventListener('mousemove', e => {
        if (!dragging) return;
        const dx = e.clientX - dStart.x, dy = e.clientY - dStart.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) {
          dragMoved = true;
          // Clear camera focus lock if user starts panning (Shift+drag or middle-click)
          // But not immediately after a double-click (within 200ms)
          if (isPanning && Date.now() - lastDoubleClickTime > 200) {
            focusedPlanet = null;
          }
        }
        const rect = canvas3d.getBoundingClientRect();
        if (isPanning) {
          // Move pivot in camera-local XY plane
          const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
          const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
          const scale = camR / rect.height * 1.8;
          camTarget.copy(targetAtDragStart)
            .addScaledVector(right, -dx * scale)
            .addScaledVector(up, dy * scale);
        } else {
          camTheta = camAtDragStart.theta - (dx / rect.width) * Math.PI * 2.4;
          camPhi = Math.max(0.01, Math.min(Math.PI - 0.01, camAtDragStart.phi - (dy / rect.height) * Math.PI));
        }
        updateCamera();
      });
      window.addEventListener('mouseup', () => {
        dragging = false;
        canvas3d.classList.remove('grabbing', 'panning');
      });

      // Prevent middle-click context menu on canvas
      canvas3d.addEventListener('auxclick', e => {
        if (e.button === 1) {
          e.preventDefault();
        }
      });

      // Planet & Moon click via raycasting
      canvas3d.addEventListener('click', e => {
        if (dragMoved) return;
        const rect = canvas3d.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const targets = [...Object.values(planetMeshes), ...Object.values(moonMeshes)];
        const hits = raycaster.intersectObjects(targets, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj && !obj.userData.planetName) obj = obj.parent;
          if (obj && obj.userData.planetName) { showInfoFor(obj.userData.planetName); switchTab('info'); }
        }
      });

      // Planet & Moon double-click to center camera view
      canvas3d.addEventListener('dblclick', e => {
        const rect = canvas3d.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const targets = [
          ...Object.values(planetMeshes),
          ...Object.values(planetClickHelpers),
          ...Object.values(moonMeshes),
          ...Object.values(moonClickHelpers)
        ];
        const hits = raycaster.intersectObjects(targets, true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj && !obj.userData.planetName) obj = obj.parent;
          if (obj && obj.userData.planetName) {
            focusedPlanet = obj.userData.planetName;  // Lock camera to this body
            lastDoubleClickTime = Date.now();  // Record when focus was set
            const worldPos = new THREE.Vector3();
            obj.getWorldPosition(worldPos);
            camTarget.copy(worldPos);
            updateCamera();
          }
        }
      });

      // Right-click context menu
      let contextMenuTarget = null;
      const contextMenu = document.getElementById('contextMenu');

      canvas3d.addEventListener('contextmenu', e => {
        e.preventDefault();
        let deferred = true;
        const showMenu = () => {
          if (!deferred) return;
          deferred = false;
          if (dragMoved) return;
          const rect = canvas3d.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );
          raycaster.setFromCamera(mouse, camera);
          const targets = [...Object.values(planetMeshes), ...Object.values(moonMeshes)];
          const hits = raycaster.intersectObjects(targets, true);

          contextMenuTarget = null;
          if (hits.length > 0) {
            let obj = hits[0].object;
            while (obj && !obj.userData.planetName) obj = obj.parent;
            if (obj && obj.userData.planetName) {
              contextMenuTarget = obj.userData.planetName;
            }
          }

          contextMenu.style.left = e.clientX + 'px';
          contextMenu.style.top = e.clientY + 'px';
          contextMenu.classList.add('visible');
        };
        setTimeout(showMenu, 60);
      });

      // Close context menu when clicking elsewhere
      document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
          contextMenu.classList.remove('visible');
        }
      });

      // Context menu item click handler
      document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          if (!contextMenuTarget) {
            contextMenu.classList.remove('visible');
            return;
          }

          const body = contextMenuTarget;

          switch (action) {
            case 'zoom-in':
              focusedPlanet = body;  // Lock camera to this body
              lastDoubleClickTime = Date.now();  // Record when focus was set
              const bodyMesh = planetMeshes[body] || moonMeshes[body];
              if (bodyMesh) {
                camTarget.copy(bodyMesh.position);
                camR = Math.max(CAM_MIN, Math.min(CAM_MAX, camR / 3));
                updateCamera();
              }
              break;
            case 'set-origin':
              const originSel = document.getElementById('originSelect');
              if (originSel) {
                originSel.value = body;
                originSel.dispatchEvent(new Event('change'));
              }
              break;
            case 'set-dest':
              const destSel = document.getElementById('destSelect');
              if (destSel) {
                destSel.value = body;
                destSel.dispatchEvent(new Event('change'));
              }
              break;
            case 'clear-origin':
              const originSel2 = document.getElementById('originSelect');
              if (originSel2) {
                originSel2.value = '';
                originSel2.dispatchEvent(new Event('change'));
              }
              break;
            case 'clear-dest':
              const destSel2 = document.getElementById('destSelect');
              if (destSel2) {
                destSel2.value = '';
                destSel2.dispatchEvent(new Event('change'));
              }
              break;
            case 'reset-zoom':
              focusedPlanet = null;  // Unlock camera
              camR = 620;
              camTheta = 0.15;
              camPhi = 0.30;
              camTarget.set(0, 0, 0);
              updateCamera();
              break;
            case 'show-info':
              showInfoFor(body);
              switchTab('info');
              break;
          }

          contextMenu.classList.remove('visible');
        });
      });

      // Scroll zoom (zoom toward cursor by shifting camTarget slightly)
      mapWrap.addEventListener('wheel', e => {
        e.preventDefault();
        const f = e.deltaY > 0 ? 1.12 : 1 / 1.12;
        camR = Math.max(CAM_MIN, Math.min(CAM_MAX, camR * f));
        updateCamera();
      }, { passive: false });

      // Zoom buttons
      document.getElementById('zoomIn').onclick = () => { camR = Math.max(CAM_MIN, camR / 1.35); updateCamera(); };
      document.getElementById('zoomOut').onclick = () => { camR = Math.min(CAM_MAX, camR * 1.35); updateCamera(); };
      document.getElementById('zoomReset').onclick = resetView;

      // Minimize / Expand Controls Bubble
      window.toggleControlsBubble = () => {
        const bubble = document.getElementById('shortcutsBubble');
        const btn = document.getElementById('sbToggleBtn');
        if (!bubble) return;
        const collapsed = bubble.classList.toggle('collapsed');
        if (btn) {
          btn.textContent = collapsed ? '+' : '_';
          btn.title = collapsed ? 'Expand Controls (K)' : 'Minimize Controls (K)';
        }
      };

      // Keyboard: R = reset view, K = toggle controls bubble
      window.addEventListener('keydown', e => {
        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          if (e.key === 'r' || e.key === 'R') {
            resetView();
          } else if (e.key === 'k' || e.key === 'K') {
            toggleControlsBubble();
          }
        }
      });

      // Touch: 1-finger = rotate, 2-finger pinch = zoom, 2-finger pan = pan
      let tState = null;
      canvas3d.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
          tState = { mode: 'rot', x: e.touches[0].clientX, y: e.touches[0].clientY, theta: camTheta, phi: camPhi };
        } else if (e.touches.length === 2) {
          const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          tState = { mode: 'pinch', d, r: camR, mx, my, target: camTarget.clone() };
        }
      }, { passive: true });
      canvas3d.addEventListener('touchmove', e => {
        if (!tState) return;
        const rect = canvas3d.getBoundingClientRect();
        if (tState.mode === 'rot' && e.touches.length === 1) {
          const dx = e.touches[0].clientX - tState.x, dy = e.touches[0].clientY - tState.y;
          camTheta = tState.theta - (dx / rect.width) * Math.PI * 2.4;
          camPhi = Math.max(0.01, Math.min(Math.PI - 0.01, tState.phi - (dy / rect.height) * Math.PI));
          updateCamera();
        } else if (tState.mode === 'pinch' && e.touches.length === 2) {
          const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          camR = Math.max(CAM_MIN, Math.min(CAM_MAX, tState.r * (tState.d / d)));
          // Two-finger pan
          const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
          const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
          const scale = camR / rect.height * 1.8;
          camTarget.copy(tState.target)
            .addScaledVector(right, -(mx - tState.mx) * scale)
            .addScaledVector(up, (my - tState.my) * scale);
          updateCamera();
        }
      }, { passive: true });
      canvas3d.addEventListener('touchend', () => { tState = null; }, { passive: true });

