      /* ---- Orbital Ghost Planets ---- */
      // Each planet gets a faint ghost showing its position 1/8th of an orbit ahead.
      // They fade out when zoomed in close (camR < MOON_THRESH = 75) or when
      // the camera is centred near that body.
      const MOON_THRESH = 75;          // same camR threshold as moon label visibility
      const ORB_GHOST_NEAR = 30;       // camR below this = ghost fully hidden (near threshold)
      const ORB_GHOST_PROX_SQ = 50 * 50; // distance² from camTarget to hide the nearest ghost

      const orbitalGhosts = PLANETS.map(p => {
        const col = new THREE.Color(p.color);
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(6.5, 18, 18),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false })
        );
        sphere.renderOrder = 1;
        scene.add(sphere);

        return { planet: p, sphere, targetOpacity: 0 };
      });

      // Render Moons - add to scene root, not parented to planets
      MOONS.forEach(m => {
        const col = new THREE.Color(m.color);

        // Moon orbit ring in world space (centered at parent planet)
        const parent = PLANETS.find(p => p.name === m.parent);
        if (!parent) return;

        const N = 2000, pts = [];
        const orbitRad = moonOrbitDisplayRadius(m);
        for (let i = 0; i <= N; i++) {
          const nu = (i / N) * 2 * Math.PI;
          const r = orbitRad * (1 - m.e * m.e) / (1 + m.e * Math.cos(nu));
          const theta = nu + m.orient;
          const inclRad = m.incl * DEG;
          // Local position relative to parent planet
          const localX = r * Math.cos(theta);
          const localY = r * Math.sin(theta) * Math.sin(inclRad);
          const localZ = -r * Math.sin(theta) * Math.cos(inclRad);
          // Will be offset to parent's world position in updateMap
          pts.push(new THREE.Vector3(localX, localY, localZ));
        }
        const orbitLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.35 })
        );
        // Position will be set to parent's world position each frame
        scene.add(orbitLine);
        moonOrbitLines[m.name] = orbitLine;

        // Moon Mesh at raw scale
        const moonRadius = m.radius * SCALE;
        const moonMesh = new THREE.Mesh(
          new THREE.SphereGeometry(moonRadius, 20, 20),
          new THREE.MeshStandardMaterial({
            color: col,
            roughness: 0.8,
            metalness: 0.05,
            emissive: col,
            emissiveIntensity: 0.1
          })
        );
        moonMesh.userData.planetName = m.name;

        // Moon glow outline
        moonMesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(moonRadius * 1.3, 16, 16),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.2, depthWrite: false })
        ));

        scene.add(moonMesh);
        moonMeshes[m.name] = moonMesh;

        // Invisible click-helper sphere (5x visual size) for better hit detection
        const helperSphere = new THREE.Mesh(
          new THREE.SphereGeometry(moonRadius * 5, 8, 8),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
        );
        helperSphere.userData.planetName = m.name;
        scene.add(helperSphere);
        moonMeshes[m.name + '_helper'] = helperSphere;

        // HTML label
        const div = document.createElement('div');
        div.className = 'planet-label-3d';
        div.style.fontSize = '8.5px';
        div.style.color = '#a6b8d4';
        div.textContent = m.name;
        div.style.cursor = 'pointer';
        labelCtr.appendChild(div);
        moonLabelEls[m.name] = div;

        // Click on moon label to select origin
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          const originSelect = document.getElementById('originSelect');
          if (originSelect) {
            originSelect.value = m.name;
            originSelect.dispatchEvent(new Event('change'));
          }
        });

        // Double-click on moon label to lock camera and show body info
        div.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          focusedPlanet = m.name;
          lastDoubleClickTime = Date.now();  // Record when focus was set
          camTarget.copy(moonMeshes[m.name].position);
          camR = Math.max(CAM_MIN, Math.min(CAM_MAX, camR / 3));
          updateCamera();
          showInfoFor(m.name);
          switchTab('info');
        });

        // Right-click on moon label for context menu
        div.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          let deferred = true;
          setTimeout(() => {
            if (!deferred) return;
            deferred = false;
            contextMenuTarget = m.name;
            contextMenu.style.left = e.clientX + 'px';
            contextMenu.style.top = e.clientY + 'px';
            contextMenu.classList.add('visible');
          }, 60);
        });
      });

      /* ---- Raycaster for planet clicks ---- */
      const raycaster = new THREE.Raycaster();
      raycaster.params.Mesh = {};

