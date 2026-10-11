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
        if (isMoon) {
          o1.dataset.parent = body.parent;
          o2.dataset.parent = body.parent;
        }
        originSelect.appendChild(o1);
        destSelect.appendChild(o2);
        if (hudOriginSelect && hudDestSelect) {
          const o3 = document.createElement('option'); o3.value = body.name; o3.textContent = label;
          const o4 = document.createElement('option'); o4.value = body.name; o4.textContent = label;
          if (isMoon) {
            o3.dataset.parent = body.parent;
            o4.dataset.parent = body.parent;
          }
          hudOriginSelect.appendChild(o3);
          hudDestSelect.appendChild(o4);
        }
      });
      originSelect.value = 'Kerbin';
      destSelect.value = 'Duna';
      if (hudOriginSelect && hudDestSelect) {
        hudOriginSelect.value = 'Kerbin';
        hudDestSelect.value = 'Duna';
      }

      function syncSelectsFromSidebar() {
        if (hudOriginSelect && hudDestSelect) {
          hudOriginSelect.value = originSelect.value;
          hudDestSelect.value = destSelect.value;
        }
      }

      function syncSelectsFromHud() {
        if (hudOriginSelect && hudDestSelect) {
          originSelect.value = hudOriginSelect.value;
          destSelect.value = hudDestSelect.value;
        }
      }

      function refreshHud() {
        const ho = document.getElementById('hudOrigin');
        const hd = document.getElementById('hudDest');
        if (ho) ho.textContent = 'ORIGIN — ' + originSelect.value;
        if (hd) hd.textContent = 'DEST — ' + destSelect.value;
        syncSelectsFromSidebar();
      }
      refreshHud();
      originSelect.onchange = refreshHud;
      destSelect.onchange = refreshHud;
      if (hudOriginSelect) hudOriginSelect.onchange = syncSelectsFromHud;
      if (hudDestSelect) hudDestSelect.onchange = syncSelectsFromHud;

      document.getElementById('swapBtn').onclick = () => {
        const a = originSelect.value; originSelect.value = destSelect.value; destSelect.value = a; refreshHud();
      };

      const hudSwapBtn = document.getElementById('hudSwapBtn');
      if (hudSwapBtn) {
        hudSwapBtn.onclick = () => {
          if (hudOriginSelect && hudDestSelect) {
            const a = hudOriginSelect.value; hudOriginSelect.value = hudDestSelect.value; hudDestSelect.value = a;
            syncSelectsFromHud();
          }
        };
      }

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

      // --- Sidebar collapse/expand ---
      // sidebarEl already declared in mobile toggle section (line ~6950)
      const sidebarCollapsedRail = document.getElementById('sidebarCollapsedRail');

      // Load persisted state
      const savedCollapsed = localStorage.getItem('sidebarCollapsed');
      if (savedCollapsed === 'true') {
        sidebarEl.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
      }

      function toggleSidebarCollapse() {
        const isCollapsed = sidebarEl.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed', isCollapsed);
        localStorage.setItem('sidebarCollapsed', isCollapsed);

        // Shift floating HUD widgets on right side
        const shift = isCollapsed ? 28 : -28;
        const widgets = document.querySelectorAll('.hud-widget');
        widgets.forEach(w => {
          const currentLeft = parseFloat(w.style.left) || 0;
          const newLeft = Math.max(16, currentLeft + shift);
          w.style.left = newLeft + 'px';
        });
      }
      // Expose to inline onclick handlers
      window.toggleSidebarCollapse = toggleSidebarCollapse;

      // Allow click activation of collapsed rail
      if (sidebarCollapsedRail) {
        sidebarCollapsedRail.addEventListener('click', () => {
          toggleSidebarCollapse();
        });
        sidebarCollapsedRail.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleSidebarCollapse();
            e.preventDefault();
          }
        });
      }

      // Keyboard shortcuts: [ and ] to collapse/expand
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === '[' || e.key === ']') {
          toggleSidebarCollapse();
          e.preventDefault();
        }
      });

