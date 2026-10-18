      /* =========================================================
         15. VESSEL LAYER + ACTIVE-VESSEL HUD (telemetry bridge)
         Every vessel the bridge reports, filterable by type, body,
         name and status. The active vessel gets an animated HUD.
         ========================================================= */
      const VESSEL_FILTER_KEY = 'kerbalist_vessel_filter';
      const vesselFilter = { types: {}, body: 'all', search: '', activeOnly: false, labels: true };
      try { Object.assign(vesselFilter, JSON.parse(localStorage.getItem(VESSEL_FILTER_KEY) || '{}')); } catch (_) {}

      const VESSEL_COLORS = { Ship: 0x4fe0e8, Probe: 0xffb454, Station: 0x7ee787, Base: 0x7ee787, Debris: 0x7688a6, Rover: 0xffd166, Plane: 0xb78cff };
      const vesselGroup = new THREE.Group();
      scene.add(vesselGroup);
      const vesselMarkers = [];   // { mesh, label }

      const vesselToggle = document.createElement('button');
      vesselToggle.className = 'vessel-toggle';
      vesselToggle.textContent = 'Vessels';
      vesselToggle.title = 'Filter vessels shown on the map';

      const vesselPanel = document.createElement('div');
      vesselPanel.className = 'vessel-panel';
      vesselPanel.innerHTML = `
        <input type="search" class="vp-search" placeholder="Search name…">
        <label class="vp-row">Body <select class="vp-body"><option value="all">All bodies</option></select></label>
        <div class="vp-types"></div>
        <label class="vp-check"><input type="checkbox" class="vp-active"> Active vessel only</label>
        <label class="vp-check"><input type="checkbox" class="vp-labels"> Labels</label>
        <div class="vp-count"></div>`;

      // Keep clicks on these controls from also dragging the 3D camera.
      [vesselToggle, vesselPanel].forEach(el =>
        ['pointerdown', 'mousedown', 'touchstart', 'wheel'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation())));

      function saveVesselFilter() {
        try { localStorage.setItem(VESSEL_FILTER_KEY, JSON.stringify(vesselFilter)); } catch (_) {}
      }

      vesselToggle.onclick = () => vesselPanel.classList.toggle('open');
      vesselPanel.querySelector('.vp-search').addEventListener('input', e => {
        vesselFilter.search = e.target.value.trim().toLowerCase();
        saveVesselFilter();
      });
      vesselPanel.querySelector('.vp-body').addEventListener('change', e => {
        vesselFilter.body = e.target.value;
        saveVesselFilter();
      });
      vesselPanel.querySelector('.vp-active').addEventListener('change', e => {
        vesselFilter.activeOnly = e.target.checked;
        saveVesselFilter();
      });
      vesselPanel.querySelector('.vp-labels').addEventListener('change', e => {
        vesselFilter.labels = e.target.checked;
        saveVesselFilter();
      });

      function ensureVesselMarker(i) {
        while (vesselMarkers.length <= i) {
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false })
          );
          vesselGroup.add(mesh);
          const label = document.createElement('div');
          label.className = 'vessel-label-3d';
          labelCtr.appendChild(label);
          vesselMarkers.push({ mesh, label });
        }
        return vesselMarkers[i];
      }

      // Vessel positions are reported relative to their body, so add the body's scene position.
      function vesselScenePos(v) {
        const base = bridgeBodyScene(v.body);
        if (!base || !v.relativePosition || !bridgeLive.map) return null;
        return base.clone().add(bridgeToScene(v.relativePosition));
      }

      function vesselPassesFilter(v, active) {
        if (vesselFilter.activeOnly && !(active && v.id === active.id)) return false;
        if (vesselFilter.body !== 'all' && v.body !== vesselFilter.body) return false;
        if (vesselFilter.types[v.type] === false) return false;
        if (vesselFilter.search && !(v.name || '').toLowerCase().includes(vesselFilter.search)) return false;
        return true;
      }

      // Keep the type and body controls in step with what the bridge is reporting.
      let vesselPanelSig = '';
      function refreshVesselPanel(list) {
        const types = [...new Set(list.map(v => v.type || 'Unknown'))].sort();
        const bodies = [...new Set(list.map(v => v.body).filter(Boolean))].sort();
        const sig = types.join('|') + '#' + bodies.join('|');
        if (sig !== vesselPanelSig) {
          vesselPanelSig = sig;
          const typeBox = vesselPanel.querySelector('.vp-types');
          typeBox.innerHTML = '';
          types.forEach(t => {
            const label = document.createElement('label');
            label.className = 'vp-check';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = vesselFilter.types[t] !== false;
            cb.addEventListener('change', () => { vesselFilter.types[t] = cb.checked; saveVesselFilter(); });
            label.appendChild(cb);
            label.appendChild(document.createTextNode(' ' + t));
            typeBox.appendChild(label);
          });
          const bodySel = vesselPanel.querySelector('.vp-body');
          bodySel.innerHTML = '<option value="all">All bodies</option>' +
            bodies.map(b => `<option value="${b}">${b}</option>`).join('');
          bodySel.value = bodies.includes(vesselFilter.body) ? vesselFilter.body : 'all';
          vesselFilter.body = bodySel.value;
          vesselPanel.querySelector('.vp-search').value = vesselFilter.search;
          vesselPanel.querySelector('.vp-active').checked = vesselFilter.activeOnly;
          vesselPanel.querySelector('.vp-labels').checked = vesselFilter.labels;
        }
      }

      function updateVesselLayer() {
        const active = bridgeLive.activeVessel;
        const list = bridgeLive.vessels.slice();
        if (active && active.id && !list.some(v => v.id === active.id)) list.push(active);
        refreshVesselPanel(list);

        const size = camR * 0.0012;   // screen-stable marker size
        let shown = 0;
        list.forEach(v => {
          if (!vesselPassesFilter(v, active)) return;
          const pos = vesselScenePos(v);
          if (!pos) return;
          const m = ensureVesselMarker(shown++);
          const isActive = !!(active && v.id === active.id);
          m.mesh.visible = true;
          m.mesh.position.copy(pos);
          m.mesh.scale.setScalar(isActive ? size * 1.6 : size);
          m.mesh.material.color.setHex(isActive ? 0xffffff : (VESSEL_COLORS[v.type] || 0xdbe7f5));
          const s = worldToScreen(pos);
          m.label.textContent = v.name || v.id;
          m.label.classList.toggle('active', isActive);
          m.label.style.left = s.x + 'px';
          m.label.style.top = s.y + 'px';
          m.label.style.display = (vesselFilter.labels && !s.behind) ? '' : 'none';
        });
        for (let j = shown; j < vesselMarkers.length; j++) {
          vesselMarkers[j].mesh.visible = false;
          vesselMarkers[j].label.style.display = 'none';
        }
        vesselToggle.textContent = `Vessels (${shown})`;
        // Only offer the vessel filter when the bridge reports a vessel list (not just the active vessel).
        vesselToggle.classList.toggle('show', bridgeLive.vessels.length > 0);
        vesselPanel.querySelector('.vp-count').textContent = `${shown} of ${list.length} shown`;
      }

      function hideVesselLayer() {
        vesselMarkers.forEach(m => { m.mesh.visible = false; m.label.style.display = 'none'; });
        vesselToggle.classList.remove('show');
        vesselPanel.classList.remove('open');
        if (vesselHudEl) vesselHudEl.style.display = 'none';
        hideVesselOverlay();
      }

      function fmtKm(m) {
        if (typeof m !== 'number' || !isFinite(m)) return '—';
        return Math.round(m / 1000).toLocaleString('en-GB') + ' km';
      }

      function situationOf(a) {
        if (a.landed) return 'Landed';
        if (a.splashed) return 'Splashed';
        if (a.inAtmosphere) return 'In atmosphere';
        return 'In space';
      }

      function escHtml(t) {
        return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      // Apoapsis/periapsis: the game's own orbit when the bridge sends one, otherwise worked out from telemetry.
      function vesselApsidesFor(a) {
        if (a.orbit && typeof a.orbit.apoapsis === 'number' && typeof a.orbit.periapsis === 'number') {
          return { ap: a.orbit.apoapsis, pe: a.orbit.periapsis };
        }
        // horizontalSpeed is relative to the rotating surface, so it is not the orbital tangential speed.
        // Take the tangential speed from the speed relative to the body's centre instead.
        const v = a.orbitalSpeed, vr = a.verticalSpeed || 0;
        const vt = Math.sqrt(Math.max(0, v * v - vr * vr));
        return vesselApsides(a.altitude, vt, v, bridgeLive.radiusByName[a.body], bridgeLive.muByName[a.body]);
      }

      let hudSnapshot = null;
      let vesselHudEl = null;
      let vesselHudDismissedFor = null;

      // Active-vessel panel is a HUD widget: pin, drag, resize and close work like the other widgets.
      function updateVesselHud() {
        const a = bridgeLive.activeVessel;
        if (!a) {
          if (vesselHudEl) vesselHudEl.style.display = 'none';
          hudSnapshot = null;
          return;
        }
        // Closing the widget dismisses it for this vessel only; a different vessel brings it back.
        if (vesselHudEl && !vesselHudEl.isConnected) { vesselHudDismissedFor = a.id; vesselHudEl = null; }
        if (vesselHudDismissedFor === a.id) return;
        if (!vesselHudEl) {
          vesselHudEl = window.createHudWidget ? window.createHudWidget('vesselHudWidget', 'vessel', 'Active Vessel') : null;
          if (!vesselHudEl) return;
          hudSnapshot = null;
        }
        vesselHudEl.style.display = '';
        if (a === hudSnapshot) return;   // only touch the DOM when a new snapshot arrives
        hudSnapshot = a;
        const ap = vesselApsidesFor(a);
        const fmtAp = (v) => (v && isFinite(v)) ? fmtKm(v) : '—';
        const html = `
          <div class="vh-panel">
          <div class="vh-name"><span class="vh-pulse"></span>${escHtml(a.name || a.id || 'Unnamed')}</div>
          <div class="vh-grid">
            <div><span>Body</span><b>${escHtml(a.body || '—')}</b></div>
            <div><span>Situation</span><b>${escHtml(situationOf(a))}</b></div>
            <div><span>Altitude</span><b>${fmtKm(a.altitude)}</b></div>
            <div><span>Speed</span><b>${typeof a.orbitalSpeed === 'number' ? Math.round(a.orbitalSpeed).toLocaleString('en-GB') + ' m/s' : '—'}</b></div>
            <div><span>Apoapsis</span><b>${ap ? fmtAp(ap.ap) : '—'}</b></div>
            <div><span>Periapsis</span><b>${ap ? fmtAp(ap.pe) : '—'}</b></div>
          </div>
          </div>`;
        window.updateHudContent('vesselHudWidget', html);
      }

      // Map overlay: an acronym tag for the active vessel with a leader line to it.
      // The leader points at the exact vessel once the bridge sends its position (relativePosition);
      // until then the tag is anchored to the parent body and marked approximate.
      const vesselOverlay = { svg: null, line: null, ring: null, tag: null };
      function ensureVesselOverlay() {
        if (vesselOverlay.svg) return;
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'vessel-leader-svg');
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('class', 'vo-line');
        const ring = document.createElementNS(NS, 'circle');
        ring.setAttribute('class', 'vo-ring');
        ring.setAttribute('r', '14');
        svg.appendChild(line);
        svg.appendChild(ring);
        labelCtr.appendChild(svg);
        const tag = document.createElement('div');
        tag.className = 'vessel-tag';
        labelCtr.appendChild(tag);
        Object.assign(vesselOverlay, { svg, line, ring, tag });
      }

      function hideVesselOverlay() {
        if (!vesselOverlay.svg) return;
        vesselOverlay.svg.style.display = 'none';
        vesselOverlay.tag.style.display = 'none';
      }

      function updateVesselOverlay(active) {
        if (!active || !bridgeActive()) { hideVesselOverlay(); return; }
        const exact = vesselScenePos(active);
        const anchor = exact || bridgeBodyScene(active.body);
        if (!anchor) { hideVesselOverlay(); return; }
        const s = worldToScreen(anchor);
        if (s.behind) { hideVesselOverlay(); return; }
        ensureVesselOverlay();
        const o = vesselOverlay;
        const tx = s.x + 46, ty = s.y - 40;
        o.svg.style.display = '';
        o.tag.style.display = '';
        o.line.setAttribute('x1', s.x); o.line.setAttribute('y1', s.y);
        o.line.setAttribute('x2', tx);  o.line.setAttribute('y2', ty);
        o.ring.setAttribute('cx', s.x); o.ring.setAttribute('cy', s.y);
        o.ring.style.display = exact ? '' : 'none';
        o.line.classList.toggle('approx', !exact);
        o.tag.classList.toggle('approx', !exact);
        o.tag.textContent = active.name || active.id;
        o.tag.title = exact ? (active.name || '') : (`${active.name || ''} — position approximate: the bridge does not send the vessel's position yet`);
        o.tag.style.left = tx + 'px';
        o.tag.style.top = ty + 'px';
      }
