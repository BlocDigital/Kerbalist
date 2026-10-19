      /* =========================================================
         14. TELEMETRY BRIDGE CLIENT — KSP2 mod over WebSocket
         With LIVE SYNC set to the bridge, body positions and orbit
         rings come straight from the game's state vectors. The
         stock orbit table is not used while the bridge is live.
         ========================================================= */
      const BRIDGE_WS_URL = 'ws://127.0.0.1:8765/ws';
      const BRIDGE_STALE_MS = 2000;
      const BRIDGE_RING_POINTS = 1440;

      const bridgeLive = {
        wanted: false, ws: null, retryTimer: null, retryMs: 1000, url: BRIDGE_WS_URL,
        lastMessageAt: 0, lastStatusAt: 0,
        staticRevision: -1, stateRevision: -1, ringsFor: null,
        nameById: {}, parentByName: {}, starByName: {}, muByName: {}, radiusByName: {},
        map: null,
        sceneVec: {},        // body name -> THREE.Vector3 in scene units
        stockRingGeo: {},    // line name -> original stock geometry, restored on disconnect
        vessels: [],
        activeVessel: null
      };
      let bridgeVisualsOn = false;

      function bridgeFresh() {
        return liveMode === 'bridge' && bridgeLive.lastMessageAt > 0 &&
          (Date.now() - bridgeLive.lastMessageAt) < BRIDGE_STALE_MS;
      }

      function bridgeActive() {
        return bridgeFresh() && !!bridgeLive.map && Object.keys(bridgeLive.sceneVec).length > 0;
      }

      function bridgeBodyScene(name) {
        return bridgeActive() ? (bridgeLive.sceneVec[name] || null) : null;
      }

      // Bridge metres -> scene units, through the fixed bridge-to-scene map.
      function bridgeToScene(raw) {
        const m = applyBridgeAxisMap(bridgeLive.map || BRIDGE_TO_SCENE_MAP, { x: raw.x * SCALE, y: raw.y * SCALE, z: raw.z * SCALE });
        return new THREE.Vector3(m.x, m.y, m.z);
      }

      function rebuildBridgeStatic(ss) {
        bridgeLive.nameById = {};
        bridgeLive.parentByName = {};
        bridgeLive.starByName = {};
        bridgeLive.muByName = {};
        bridgeLive.radiusByName = {};
        (ss.bodies || []).forEach(b => {
          bridgeLive.nameById[b.id] = b.name;
          bridgeLive.parentByName[b.name] = b.parent || null;
          bridgeLive.starByName[b.name] = !!b.isStar;
          bridgeLive.muByName[b.name] = b.gravitationalParameter;
          bridgeLive.radiusByName[b.name] = b.radius;
        });
        bridgeLive.staticRevision = ss.staticRevision;
      }

      // Raw bridge state by body name: { position, velocity }.
      function bridgeRawStates(ss) {
        const raw = {};
        (ss.states || []).forEach(st => {
          const name = bridgeLive.nameById[st.id];
          if (name && st.position) raw[name] = { position: st.position, velocity: st.velocity };
        });
        return raw;
      }

      // Place every body from its game position. Moons are stored relative to their parent,
      // so they sit on top of the parent's scene position.
      function computeBridgeScenePositions(ss) {
        const raw = {};
        Object.entries(bridgeRawStates(ss)).forEach(([n, s]) => { raw[n] = s.position; });
        if (Object.keys(raw).length === 0) { bridgeLive.sceneVec = {}; return; }
        bridgeLive.map = BRIDGE_TO_SCENE_MAP;
        const vecs = {};
        const place = (name, depth) => {
          if (vecs[name]) return vecs[name];
          if (!raw[name] || depth > 4) return null;
          const base = new THREE.Vector3();
          const parent = bridgeLive.parentByName[name];
          if (parent && !bridgeLive.starByName[parent]) {
            const pv = place(parent, depth + 1);
            if (!pv) return null;
            base.copy(pv);
          }
          vecs[name] = base.add(bridgeToScene(raw[name]));
          return vecs[name];
        };
        Object.keys(raw).forEach(n => place(n, 0));
        bridgeLive.sceneVec = vecs;
      }

      // Orbit rings from the game's own state vectors. Rebuilt once per body-set revision,
      // since two-body orbits from a single state don't change between revisions.
      function setRingGeometry(line, key, points) {
        if (!line) return;
        if (!bridgeLive.stockRingGeo[key]) bridgeLive.stockRingGeo[key] = line.geometry;
        line.geometry = new THREE.BufferGeometry().setFromPoints(points);
      }

      function updateBridgeRings(ss) {
        if (bridgeLive.ringsFor === ss.staticRevision) return;
        const raw = bridgeRawStates(ss);
        if (Object.keys(raw).length === 0) return;
        PLANETS.forEach(p => {
          const st = raw[p.name], mu = bridgeLive.muByName[p.parent || 'Kerbol'];
          if (!st || !mu) return;
          const loop = bridgeOrbitLoop(st.position, st.velocity, mu, BRIDGE_RING_POINTS);
          setRingGeometry(planetRingLines[p.name], p.name, loop.map(q => bridgeToScene(q)));
        });
        MOONS.forEach(m => {
          const st = raw[m.name], mu = bridgeLive.muByName[m.parent];
          if (!st || !mu) return;
          const loop = bridgeOrbitLoop(st.position, st.velocity, mu, BRIDGE_RING_POINTS);
          setRingGeometry(moonOrbitLines[m.name], m.name, loop.map(q => bridgeToScene(q)));
        });
        bridgeLive.ringsFor = ss.staticRevision;
      }

      function restoreStockRings() {
        Object.entries(bridgeLive.stockRingGeo).forEach(([key, geo]) => {
          const line = planetRingLines[key] || moonOrbitLines[key];
          if (line) line.geometry = geo;
        });
        bridgeLive.stockRingGeo = {};
        bridgeLive.ringsFor = null;
      }

      function onBridgeSnapshot(snap) {
        bridgeLive.lastMessageAt = Date.now();
        bridgeLive.activeVessel = snap.vessel || null;
        const ss = snap.solarSystem || {};
        if (ss.staticRevision !== undefined && ss.staticRevision !== bridgeLive.staticRevision) rebuildBridgeStatic(ss);
        const ut = snap.game && snap.game.universalTime;
        if (typeof ut === 'number' && isFinite(ut)) UT = ut;
        if (ss.stateRevision !== undefined && ss.stateRevision !== bridgeLive.stateRevision) {
          bridgeLive.stateRevision = ss.stateRevision;
          computeBridgeScenePositions(ss);
        }
        if (ss.states && ss.states.length) updateBridgeRings(ss);
        bridgeLive.vessels = ss.vessels || [];
        const now = Date.now();
        if (now - bridgeLive.lastStatusAt > 1000) {
          bridgeLive.lastStatusAt = now;
          updateBridgeStatus();
        }
      }

      function updateBridgeStatus() {
        if (!bridgeLive.wanted || liveMode !== 'bridge') return;
        if (Object.keys(bridgeLive.sceneVec).length === 0) {
          setLiveStatus('LIVE (KSP2 bridge) — connected, waiting for body data…', null);
        } else {
          const n = bridgeLive.vessels.length;
          setLiveStatus(`LIVE (KSP2 bridge) — synced ${utToDateString(UT)} · game orbits · ${n} vessel${n === 1 ? '' : 's'}`, 'ok');
        }
      }

      function openBridgeSocket() {
        if (!bridgeLive.wanted) return;
        let ws;
        try { ws = new WebSocket(bridgeLive.url); }
        catch (err) { scheduleBridgeRetry(err.message); return; }
        bridgeLive.ws = ws;
        ws.onopen = () => {
          bridgeLive.retryMs = 1000;
          setLiveStatus('LIVE (KSP2 bridge) — connected, waiting for data…', null);
        };
        ws.onmessage = (ev) => {
          try { onBridgeSnapshot(JSON.parse(ev.data)); }
          catch (err) { console.warn('[bridge] bad snapshot', err); }
        };
        ws.onerror = () => {};
        ws.onclose = () => {
          bridgeLive.ws = null;
          if (bridgeLive.wanted) scheduleBridgeRetry('connection closed');
        };
      }

      function scheduleBridgeRetry(reason) {
        if (!bridgeLive.wanted) return;
        setLiveStatus(`LIVE (KSP2 bridge) — ${reason}. Retrying… Is KSP2 running with the Telemetry Bridge mod?`, 'err');
        clearTimeout(bridgeLive.retryTimer);
        const wait = bridgeLive.retryMs;
        bridgeLive.retryMs = Math.min(bridgeLive.retryMs * 2, 5000);
        bridgeLive.retryTimer = setTimeout(openBridgeSocket, wait);
      }

      function startBridge(url) {
        stopBridge();
        bridgeLive.wanted = true;
        bridgeLive.url = url || BRIDGE_WS_URL;
        bridgeLive.retryMs = 1000;
        openBridgeSocket();
      }

      function stopBridge() {
        bridgeLive.wanted = false;
        clearTimeout(bridgeLive.retryTimer);
        bridgeLive.retryTimer = null;
        const ws = bridgeLive.ws;
        bridgeLive.ws = null;
        if (ws) { ws.onclose = null; ws.onmessage = null; try { ws.close(); } catch (_) {} }
        bridgeLive.lastMessageAt = 0;
        bridgeLive.staticRevision = -1;
        bridgeLive.stateRevision = -1;
        bridgeLive.map = null;
        bridgeLive.sceneVec = {};
        bridgeLive.vessels = [];
        bridgeLive.activeVessel = null;
        restoreStockRings();
        if (bridgeVisualsOn) { bridgeVisualsOn = false; hideVesselLayer(); }
      }

      // Moves body meshes and moon orbit lines to the game positions (called every frame from updateMap).
      function applyBridgeBodies() {
        PLANETS.forEach(p => {
          const v = bridgeBodyScene(p.name);
          if (v && planetMeshes[p.name]) planetMeshes[p.name].position.copy(v);
        });
        MOONS.forEach(m => {
          const v = bridgeBodyScene(m.name);
          if (v && moonMeshes[m.name]) moonMeshes[m.name].position.copy(v);
          const pv = bridgeBodyScene(m.parent);
          if (pv && moonOrbitLines[m.name]) moonOrbitLines[m.name].position.copy(pv);
        });
      }

      // Called once per frame from updateMap, after the analytic positions are set.
      function updateBridgeVisuals() {
        if (!bridgeActive()) {
          if (bridgeVisualsOn) { bridgeVisualsOn = false; hideVesselLayer(); hideVesselOrbit(); }
          return;
        }
        bridgeVisualsOn = true;
        applyBridgeBodies();
        updateVesselLayer();
        updateVesselHud();
        updateVesselOverlay(bridgeLive.activeVessel);
        updateVesselOrbit(bridgeLive.activeVessel);
      }
