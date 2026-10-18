      /* =========================================================
         4. THREE.JS 3D MAP
         ========================================================= */
      const mapWrap = document.getElementById('mapWrap');
      const canvas3d = document.getElementById('mapCanvas');
      const labelCtr = document.getElementById('labelContainer');

      /* ---- Scene ---- */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060a11);

      /* ---- Stars ---- */
      (() => {
        const N = 1800, pos = new Float32Array(N * 3);
        for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 7000;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, transparent: true, opacity: 0.5 })));
      })();

      /* ---- Camera ---- */
      const camera = new THREE.PerspectiveCamera(52, 1, 0.0001, 15000);
      const CAM_MIN = 0.0036, CAM_MAX = 2400;
      let camR = 620, camTheta = 0.15, camPhi = 0.30;
      let focusedPlanet = null;  // Camera follows this planet if set
      let lastDoubleClickTime = 0;  // Prevent clearing focus immediately after double-click
      const camTarget = new THREE.Vector3(0, 0, 0);

      /* ---- Camera Target Pivot Indicator ---- */
      const targetPivotDot = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x3a485e, transparent: true, opacity: 0.45, depthTest: false })
      );
      scene.add(targetPivotDot);

      function updateCamera() {
        const sinP = Math.sin(camPhi), cosP = Math.cos(camPhi);
        const sinT = Math.sin(camTheta), cosT = Math.cos(camTheta);
        camera.position.set(
          camTarget.x + camR * sinP * sinT,
          camTarget.y + camR * cosP,
          camTarget.z + camR * sinP * cosT
        );
        camera.lookAt(camTarget);

        // Position pivot indicator at focal center
        targetPivotDot.position.copy(camTarget);
        const isCentered = camTarget.length() < 1;
        targetPivotDot.material.opacity = isCentered ? 0.15 : 0.45;
      }

      function resetView() {
        focusedPlanet = null;  // Clear focus lock so camera doesn't get pulled back
        camR = 620; camTheta = 0.15; camPhi = 0.30;
        camTarget.set(0, 0, 0);
        updateCamera();
      }
      updateCamera();

      /* ---- Renderer ---- */
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas3d, 
        antialias: true, 
        logarithmicDepthBuffer: true,
        powerPreference: 'high-performance',
        precision: 'highp',
        preserveDrawingBuffer: false
      });
      // Firefox: cap at 1.5 pixel ratio for better performance; Chrome: use full ratio
      const isFirefox = /Firefox/.test(navigator.userAgent);
      renderer.setPixelRatio(isFirefox ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));

      function resizeRenderer() {
        const w = mapWrap.clientWidth, h = mapWrap.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resizeRenderer();
      new ResizeObserver(resizeRenderer).observe(mapWrap);

      /* ---- Scale ---- */
      // Single universal scale: world units per meter. Everything uses this, no per-body tuning.
      // Eeloo's orbit is ~90 billion meters; we scale it to fit in a ~500-unit viewport.
      const EELOO_A = PLANETS[PLANETS.length - 1].a;
      const SCALE = 500 / EELOO_A;

      function smoothstep(t) {
        t = Math.max(0, Math.min(1, t));
        return t * t * (3 - 2 * t);
      }

      function heliocentricDisplayScale(r) {
        return 1; // Pure linear scale, no artificial expansion
      }

      // Real physical moon-orbit distance - single raw scale, no blending.
      // Clamped so a moon's raw orbit never renders inside its parent planet's
      // own visual radius (e.g. Drast's real KSP2 Redux semi-major axis is
      // smaller than Dres's physical radius - a data units slip - which would
      // otherwise place Drast's sphere fused inside Dres).
      function moonOrbitDisplayRadius(m) {
        const raw = m.a * SCALE;
        const parent = PLANETS.find(p => p.name === m.parent);
        if (parent) {
          const parentRadius = parent.radius * SCALE;
          return Math.max(raw, parentRadius * 1.3);
        }
        return raw;
      }

      /**
       * Convert ecliptic 2D coords + inclination (deg) → Three.js world Vector3.
       * Ecliptic plane = XZ plane in Three.js (Y is "up/north of ecliptic").
       * Inclination tilts orbits around the X axis.
       */
      function toWorld(xEcl, yEcl, inclDeg) {
        const i = inclDeg * DEG;
        const r = Math.hypot(xEcl, yEcl);
        const displayScale = SCALE * heliocentricDisplayScale(r);
        return new THREE.Vector3(
          xEcl * displayScale,
          yEcl * Math.sin(i) * displayScale,
          -yEcl * Math.cos(i) * displayScale
        );
      }

      /**
       * Like toWorld(), but takes an explicit display-scale multiplier instead of
       * recomputing heliocentricDisplayScale() from this point's own radius.
       * Used for long transfer/assist arcs: resampling the nonlinear inner-system
       * "bump" independently at every point along a wide-radius arc (e.g. Kerbin
       * to Eeloo) inflates/deflates different parts of the same physical ellipse
       * inconsistently and visibly distorts its shape. Instead we blend smoothly
       * between the two endpoints' own (correct) compression values, so the arc
       * still lands exactly on the departure/arrival markers but can't bulge or
       * fold in between.
       */
      function toWorldBlendedScale(xEcl, yEcl, inclDeg, scale) {
        const i = inclDeg * DEG;
        const displayScale = SCALE * scale;
        return new THREE.Vector3(
          xEcl * displayScale,
          yEcl * Math.sin(i) * displayScale,
          -yEcl * Math.cos(i) * displayScale
        );
      }

      /* ---- Kerbol (central star) ---- */
      const kerbolMesh = new THREE.Mesh(
        new THREE.SphereGeometry(10, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffd166 })
      );
      scene.add(kerbolMesh);
      // Glow halo
      const kerbolGlow = new THREE.Mesh(
        new THREE.SphereGeometry(16, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.15, depthWrite: false })
      );
      scene.add(kerbolGlow);

      /* ---- Ecliptic grid ring (subtle) ---- */
      (() => {
        const N = 128, pts = [];
        for (let i = 0; i <= N; i++) {
          const a = (i / N) * 2 * Math.PI;
          pts.push(new THREE.Vector3(SCALE * EELOO_A * 1.08 * Math.cos(a), 0, -SCALE * EELOO_A * 1.08 * Math.sin(a)));
        }
        scene.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x1d2c47, transparent: true, opacity: 0.3 })
        ));
      })();

      /* ---- Orbit paths ---- */
      function buildOrbitLine(planet) {
        const N = 4000, pts = [];
        for (let i = 0; i <= N; i++) {
          const nu = (i / N) * 2 * Math.PI;
          const r = planet.a * (1 - planet.e * planet.e) / (1 + planet.e * Math.cos(nu));
          const theta = nu + planet.orient;
          pts.push(toWorld(r * Math.cos(theta), r * Math.sin(theta), planet.incl));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(planet.color), transparent: true, opacity: 0.38 });
        return new THREE.Line(geo, mat);
      }
      const planetRingLines = {};
      PLANETS.forEach(p => { const l = buildOrbitLine(p); planetRingLines[p.name] = l; scene.add(l); });

      /* ---- Lighting for Photorealistic Shading ---- */
      const sunLight = new THREE.PointLight(0xfffaed, 2.5, 0, 0);
      scene.add(sunLight);
      const ambientLight = new THREE.AmbientLight(0x1a2638, 0.4);
      scene.add(ambientLight);

      /* ---- Dres Ring Texture ---- */
      function createDresRingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 256, 0);

        grad.addColorStop(0.00, 'rgba(180, 175, 165, 0.00)');
        grad.addColorStop(0.12, 'rgba(195, 188, 175, 0.30)');
        grad.addColorStop(0.28, 'rgba(215, 208, 194, 0.60)');
        grad.addColorStop(0.38, 'rgba(150, 144, 134, 0.20)');
        grad.addColorStop(0.48, 'rgba(240, 232, 218, 0.90)');
        grad.addColorStop(0.52, 'rgba(245, 237, 222, 0.90)');
        grad.addColorStop(0.64, 'rgba(160, 154, 142, 0.25)');
        grad.addColorStop(0.78, 'rgba(210, 203, 189, 0.65)');
        grad.addColorStop(0.90, 'rgba(175, 168, 156, 0.30)');
        grad.addColorStop(1.00, 'rgba(160, 155, 145, 0.00)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 1);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
      }

