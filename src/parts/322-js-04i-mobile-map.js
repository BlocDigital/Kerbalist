      /* =========================================================
         5b. MOBILE TOGGLE
         ========================================================= */
      const mobileToggle = document.getElementById('mobileToggle');
      const mobileMapBtn = document.getElementById('mobileMapBtn');
      const mobileControlsBtn = document.getElementById('mobileControlsBtn');
      const sidebarEl = document.querySelector('.sidebar');
      const mainEl = document.querySelector('.main');
      let mobileView = 'map'; // 'map' or 'controls'

      let isMobileView = false;

      function isMobile() {
        return window.innerWidth <= 600;
      }

      function resizeMobileMap() {
        // Force Three.js to re-measure the canvas when it was previously hidden
        if (typeof resizeRenderer === 'function') {
          resizeRenderer();
        }
        const mapWrap = document.getElementById('mapWrap');
        const canvas = document.getElementById('mapCanvas');
        if (mapWrap && canvas) {
          const w = mapWrap.clientWidth || canvas.width;
          const h = mapWrap.clientHeight || canvas.height;
          if (w > 0 && h > 0) {
            canvas.width = w;
            canvas.height = h;
          }
        }
      }

      function updateMobileView(forceView) {
        if (!isMobile()) {
          // On desktop, always show both
          isMobileView = false;
          if (sidebarEl) sidebarEl.classList.remove('mobile-visible');
          if (mainEl) mainEl.classList.remove('mobile-show-sidebar');
          mobileMapBtn && mobileMapBtn.classList.remove('active');
          mobileControlsBtn && mobileControlsBtn.classList.remove('active');
          return;
        }

        isMobileView = true;
        const view = forceView || mobileView;

        if (view === 'map') {
          sidebarEl && sidebarEl.classList.remove('mobile-visible');
          mainEl && mainEl.classList.remove('mobile-show-sidebar');
          const legend = document.querySelector('.legend');
          legend && legend.classList.remove('mobile-hidden');
          if (mobileMapBtn) mobileMapBtn.classList.add('active');
          if (mobileControlsBtn) mobileControlsBtn.classList.remove('active');
          // Give the display:none removal time to apply, then resize
          requestAnimationFrame(() => {
            requestAnimationFrame(resizeMobileMap);
          });
        } else {
          sidebarEl && sidebarEl.classList.add('mobile-visible');
          mainEl && mainEl.classList.add('mobile-show-sidebar');
          const legend = document.querySelector('.legend');
          legend && legend.classList.add('mobile-hidden');
          if (mobileMapBtn) mobileMapBtn.classList.remove('active');
          if (mobileControlsBtn) mobileControlsBtn.classList.add('active');
        }
      }

      if (mobileMapBtn) {
        mobileMapBtn.addEventListener('click', () => { mobileView = 'map'; updateMobileView('map'); });
      }
      if (mobileControlsBtn) {
        mobileControlsBtn.addEventListener('click', () => { mobileView = 'controls'; updateMobileView('controls'); });
      }

      // Update on resize
      window.addEventListener('resize', () => {
        if (!isMobile()) {
          if (mobileToggle) mobileToggle.style.display = 'none';
          updateMobileView();
        } else {
          if (mobileToggle) mobileToggle.style.display = 'flex';
          updateMobileView();
        }
      });

      // Initial state
      updateMobileView();

      // MutationObserver: detect when mobile view switches back to map
      // (i.e., when .mobile-show-sidebar is REMOVED from .main)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && mainEl) {
            if (!mainEl.classList.contains('mobile-show-sidebar')) {
              // Map is becoming visible — give CSS transition time, then resize
              setTimeout(() => {
                resizeMobileMap();
              }, 100);
            }
          }
        });
      });
      observer.observe(mainEl, { attributes: true, attributeFilter: ['class'] });

      // Resize handler: re-render when the window itself is resized
      window.addEventListener('resize', () => {
        if (isMobile()) {
          resizeMobileMap();
        }
      });

