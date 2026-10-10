    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.167/build/three.module.min.js';

    // Version constant - automatically updated from CHANGELOG.md
    const VERSION = 'v4.1';

    // ============================================================
    // SPLASH SCREEN: fade in logo → hold → fade out → reveal app
    // ============================================================
    const splashEl = document.getElementById('splash');
    if (splashEl) {
      const logoFadeDuration = 1500;  // matches CSS animation
      const holdDuration = 1200;      // logo visible
      const fadeOutDuration = 1500;   // matches CSS transition
      const totalSplashTime = logoFadeDuration + holdDuration + fadeOutDuration;

      // Start fade-out after logo is fully in + hold time
      setTimeout(() => {
        splashEl.classList.add('fade-out');
        // Remove splash from DOM once transition completes
        setTimeout(() => {
          if (splashEl.parentNode) {
            splashEl.parentNode.removeChild(splashEl);
          }
        }, fadeOutDuration + 200);
      }, logoFadeDuration + holdDuration);
    }

    (function (THREE) {
      "use strict";

