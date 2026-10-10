      /* =========================================================
         LIVE SYNC — keep UT locked to a running KSP2 session
         Two independent methods; only one active at a time.
         ========================================================= */
      let liveMode = null;      // null | 'bridge' | 'file'
      let liveIntervalId = null;
      let saveFileHandle = null;

      const liveBtn = document.getElementById('liveBtn');
      const livePanel = document.getElementById('livePanel');
      const liveStatusEl = document.getElementById('liveStatus');
      const bridgeUrlInput = document.getElementById('bridgeUrl');
      const bridgeConnectBtn = document.getElementById('bridgeConnectBtn');
      const fileWatchBtn = document.getElementById('fileWatchBtn');

      liveBtn.onclick = (e) => { e.stopPropagation(); livePanel.classList.toggle('open'); };
      document.addEventListener('click', (e) => {
        if (!livePanel.contains(e.target) && e.target !== liveBtn) livePanel.classList.remove('open');
      });

      function setLiveStatus(msg, cls) {
        liveStatusEl.textContent = msg;
        liveStatusEl.className = 'live-status' + (cls ? ' ' + cls : '');
        liveBtn.classList.toggle('on', cls === 'ok');
        liveBtn.classList.toggle('err', cls === 'err');
      }

      function stopLive() {
        if (liveIntervalId) clearInterval(liveIntervalId);
        liveIntervalId = null;
        liveMode = null;
        bridgeConnectBtn.textContent = 'Connect';
        bridgeConnectBtn.classList.remove('stop');
        fileWatchBtn.textContent = 'Choose Save File…';
        fileWatchBtn.classList.remove('stop');
        setLiveStatus('Not connected — UT is manual / warp-driven.', null);
      }

      function syncUtNow(newUt, sourceLabel) {
        if (typeof newUt !== 'number' || !isFinite(newUt)) return false;
        UT = newUt;
        updateMap();
        if (currentResult) {
          currentResult = computeTransfer(currentResult.originSelected.name, currentResult.destSelected.name);
          renderTransferResults();
        }
        setLiveStatus(`LIVE (${sourceLabel}) — synced ${utToDateString(UT)} @ ${new Date().toLocaleTimeString()}`, 'ok');
        return true;
      }

      // --- Method 1: poll a local bridge (e.g. a kRPC2-backed script) ---
      async function pollBridge(url) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const data = await res.json();
          const ut = typeof data.ut === 'number' ? data.ut : parseFloat(data.ut);
          if (!syncUtNow(ut, 'bridge')) throw new Error('response had no numeric "ut" field');
        } catch (err) {
          setLiveStatus(`LIVE (bridge) — connection failed: ${err.message}. Is the companion script running?`, 'err');
        }
      }

      bridgeConnectBtn.onclick = () => {
        if (liveMode === 'bridge') { stopLive(); return; }
        stopLive();
        const url = bridgeUrlInput.value.trim();
        if (!url) return;
        liveMode = 'bridge';
        bridgeConnectBtn.textContent = 'Disconnect';
        bridgeConnectBtn.classList.add('stop');
        pollBridge(url);
        liveIntervalId = setInterval(() => pollBridge(url), 2000);
      };

      // --- Method 2: watch the local save file via the File System Access API ---
      function findUtInObject(obj, depth) {
        if (obj == null || depth > 6) return null;
        if (typeof obj === 'object') {
          for (const k in obj) {
            if (/^(ut|universaltime)$/i.test(k) && typeof obj[k] === 'number') return obj[k];
          }
          for (const k in obj) {
            const r = findUtInObject(obj[k], depth + 1);
            if (r !== null) return r;
          }
        }
        return null;
      }

      async function readUtFromFile() {
        try {
          const file = await saveFileHandle.getFile();
          const text = await file.text();
          let ut = null;
          try { ut = findUtInObject(JSON.parse(text), 0); }
          catch (e) {
            const m = text.match(/"?UT"?\s*[:=]\s*([0-9.eE+-]+)/i) || text.match(/UniversalTime\s*[:=]\s*([0-9.eE+-]+)/i);
            if (m) ut = parseFloat(m[1]);
          }
          if (ut !== null) syncUtNow(ut, 'save file');
          else setLiveStatus('LIVE (save file) — could not find a UT field in this file.', 'err');
        } catch (err) {
          setLiveStatus(`LIVE (save file) — read error: ${err.message}`, 'err');
        }
      }

      fileWatchBtn.onclick = async () => {
        if (liveMode === 'file') { stopLive(); return; }
        if (!window.showOpenFilePicker) {
          setLiveStatus('Save-file watching needs Chrome or Edge (File System Access API).', 'err');
          return;
        }
        try {
          const [handle] = await window.showOpenFilePicker({
            excludeAcceptAllOption: false,
            multiple: false
          });
          saveFileHandle = handle;
          stopLive();
          liveMode = 'file';
          fileWatchBtn.textContent = 'Stop Watching';
          fileWatchBtn.classList.add('stop');
          readUtFromFile();
          liveIntervalId = setInterval(readUtFromFile, 4000);
        } catch (err) {
          // user cancelled the picker — no-op
        }
      };

