      function moonLocalPosition(m, t) {
        const st = stateAt(m, t);
        const orbitRad = moonOrbitDisplayRadius(m);
        const r = orbitRad * (1 - m.e * m.e) / (1 + m.e * Math.cos(st.nu));
        const theta = st.nu + m.orient;
        const inclRad = m.incl * DEG;
        // Local position relative to parent
        const localX = r * Math.cos(theta);
        const localY = r * Math.sin(theta) * Math.sin(inclRad);
        const localZ = -r * Math.sin(theta) * Math.cos(inclRad);
        // Add parent planet's world position
        const parent = PLANETS.find(p => p.name === m.parent);
        const parentSt = stateAt(parent, t);
        const parentWorld = toWorld(parentSt.x, parentSt.y, parent.incl);
        return new THREE.Vector3(
          parentWorld.x + localX,
          parentWorld.y + localY,
          parentWorld.z + localZ
        );
      }

      function bodyWorldPositionAt(body, t) {
        if (!body) return new THREE.Vector3();
        // Live bridge data is only for the current moment; forecasts stay on the analytic model.
        const live = bridgeBodyScene(body.name);
        if (live && t === UT) return live.clone();
        if (body.parent) {
          // moonLocalPosition already returns full world position (includes parent offset)
          return moonLocalPosition(body, t);
        }
        const st = stateAt(body, t);
        return toWorld(st.x, st.y, body.incl);
      }

      // Planet and Moon meshes
      const planetMeshes = {};
      const planetLabelEls = {};
      const moonMeshes = {};
      const moonLabelEls = {};
      const moonOrbitLines = {};

      PLANETS.forEach(p => {
        const col = new THREE.Color(p.color);

        // Raw physical size using the single global scale
        const radius = p.radius * SCALE;

        // Mesh with realistic lighting - created at actual size
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 32, 32),
          new THREE.MeshStandardMaterial({
            color: col,
            roughness: 0.65,
            metalness: 0.1,
            emissive: col,
            emissiveIntensity: 0.15
          })
        );
        mesh.userData.planetName = p.name;
        scene.add(mesh);
        planetMeshes[p.name] = mesh;

        // Thin atmospheric glow outline (1.25x body size)
        mesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(radius * 1.25, 24, 24),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, depthWrite: false })
        ));

        // Dres Asteroid Ring System
        if (p.name === 'Dres') {
          const drast = RAW_MOONS.find(m => m.name === 'Drast');
          const drastOrbit = drast ? moonOrbitDisplayRadius(drast) : radius * 1.5;
          const ringInner = Math.max(radius * 1.15, drastOrbit);
          const ringOuter = ringInner * 1.25;

          const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 128);
          const ringMat = new THREE.MeshBasicMaterial({
            map: createDresRingTexture(),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;
          mesh.add(ringMesh);
        }

        // HTML label
        const div = document.createElement('div');
        div.className = 'planet-label-3d';
        div.textContent = p.name;
        div.style.cursor = 'pointer';
        labelCtr.appendChild(div);
        planetLabelEls[p.name] = div;

        // Click on label to select origin
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          const originSelect = document.getElementById('originSelect');
          if (originSelect) {
            originSelect.value = p.name;
            originSelect.dispatchEvent(new Event('change'));
          }
        });

        // Double-click on label to lock camera and show body info
        div.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          focusedPlanet = p.name;
          lastDoubleClickTime = Date.now();  // Record when focus was set
          camTarget.copy(planetMeshes[p.name].position);
          camR = Math.max(CAM_MIN, Math.min(CAM_MAX, camR / 3));
          updateCamera();
          showInfoFor(p.name);
          switchTab('info');
        });

        // Right-click on label for context menu
        div.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          let deferred = true;
          setTimeout(() => {
            if (!deferred) return;
            deferred = false;
            contextMenuTarget = p.name;
            contextMenu.style.left = e.clientX + 'px';
            contextMenu.style.top = e.clientY + 'px';
            contextMenu.classList.add('visible');
          }, 60);
        });

        // Invisible click-helper sphere (10x visual radius) for easy selection
        const clickHelper = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 10, 16, 16),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
        );
        clickHelper.userData.planetName = p.name;
        scene.add(clickHelper);
        planetMeshes[p.name + '_helper'] = clickHelper;
      });

