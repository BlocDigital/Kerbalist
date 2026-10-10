    function showChangelog() {
      const overlay = document.getElementById("changelogOverlay");
      if (overlay) overlay.classList.add("open");
    }
    function hideChangelog() {
      const overlay = document.getElementById("changelogOverlay");
      if (overlay) overlay.classList.remove("open");
    }

    /* ---------- Map legend: collapsible like the Controls bubble ---------- */
    function toggleLegend(force) {
      const lg = document.getElementById('legend');
      const btn = document.getElementById('lgToggleBtn');
      if (!lg) return;
      const collapsed = (typeof force === 'boolean') ? lg.classList.toggle('collapsed', force) : lg.classList.toggle('collapsed');
      if (btn) {
        btn.textContent = collapsed ? '+' : '_';
        btn.title = collapsed ? 'Expand Legend (L)' : 'Minimize Legend (L)';
      }
    }

    (function initLegend() {
      const lg = document.getElementById('legend');
      if (!lg) return;
      // Small screens start collapsed so the legend never covers the map
      if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) toggleLegend(true);
      // The zoom buttons sit above the legend: publish its live height to CSS
      const host = lg.parentElement;
      const publish = () => host.style.setProperty('--legend-h', lg.offsetHeight + 'px');
      publish();
      if ('ResizeObserver' in window) new ResizeObserver(publish).observe(lg);
      lg.addEventListener('transitionend', publish);   // final height once the collapse animation settles
      window.addEventListener('keydown', e => {
        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === 'l' || e.key === 'L') toggleLegend();
      });
    })();

