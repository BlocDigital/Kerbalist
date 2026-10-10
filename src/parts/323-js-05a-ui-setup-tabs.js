      /* =========================================================
         5. UI SETUP
         ========================================================= */
      const originSelect = document.getElementById('originSelect');
      const destSelect = document.getElementById('destSelect');
      const hudOriginSelect = document.getElementById('hudOriginSelect');
      const hudDestSelect = document.getElementById('hudDestSelect');

      BODY_OPTIONS.forEach(({ body, isMoon, label }) => {
        const o1 = document.createElement('option'); o1.value = body.name; o1.textContent = label;
        const o2 = document.createElement('option'); o2.value = body.name; o2.textContent = label;
        const o3 = document.createElement('option'); o3.value = body.name; o3.textContent = label;
        const o4 = document.createElement('option'); o4.value = body.name; o4.textContent = label;
        if (isMoon) {
          o1.dataset.parent = body.parent;
          o2.dataset.parent = body.parent;
          o3.dataset.parent = body.parent;
          o4.dataset.parent = body.parent;
        }
        originSelect.appendChild(o1);
        destSelect.appendChild(o2);
        hudOriginSelect.appendChild(o3);
        hudDestSelect.appendChild(o4);
      });
      originSelect.value = 'Kerbin';
      destSelect.value = 'Duna';
      hudOriginSelect.value = 'Kerbin';
      hudDestSelect.value = 'Duna';

      function syncSelectsFromSidebar() {
        hudOriginSelect.value = originSelect.value;
        hudDestSelect.value = destSelect.value;
      }

      function syncSelectsFromHud() {
        originSelect.value = hudOriginSelect.value;
        destSelect.value = hudDestSelect.value;
      }

      function refreshHud() {
        document.getElementById('hudOrigin').textContent = 'ORIGIN — ' + originSelect.value;
        document.getElementById('hudDest').textContent = 'DEST — ' + destSelect.value;
        syncSelectsFromSidebar();
      }
      refreshHud();
      originSelect.onchange = refreshHud;
      destSelect.onchange = refreshHud;
      hudOriginSelect.onchange = syncSelectsFromHud;
      hudDestSelect.onchange = syncSelectsFromHud;

      document.getElementById('swapBtn').onclick = () => {
        const a = originSelect.value; originSelect.value = destSelect.value; destSelect.value = a; refreshHud();
      };

      document.getElementById('hudSwapBtn').onclick = () => {
        const a = hudOriginSelect.value; hudOriginSelect.value = hudDestSelect.value; hudDestSelect.value = a;
        syncSelectsFromHud();
      };

      document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => switchTab(t.dataset.tab));
      });
      function switchTab(name) {
        document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
      }

      // Warp controls
      const warpWrap = document.getElementById('warpControls');
      const warpLabels = ['II', '1x', '5x', '50x', '500x', '5,000x', '50,000x', '500,000x'];
      WARP_LEVELS.forEach((lvl, i) => {
        const b = document.createElement('button');
        b.textContent = i === 0 ? '⏸' : warpLabels[i];
        b.className = i === warpIndex ? 'active' : '';
        b.onclick = () => { warpIndex = i; document.querySelectorAll('#warpControls button').forEach((x, j) => x.classList.toggle('active', j === i && x.dataset.reset !== '1')); };
        warpWrap.appendChild(b);
      });
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Epoch ⟲'; resetBtn.className = 'reset-btn'; resetBtn.dataset.reset = '1';
      resetBtn.title = 'Reset to UT=0 (T+0y,0d,00:00:00)';
      resetBtn.onclick = () => { UT = 0; };
      warpWrap.appendChild(resetBtn);

