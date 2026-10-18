      /* =========================================================
         3. SIMULATION CLOCK
         ========================================================= */
      let UT = 0;
      let warpIndex = 2;
      const WARP_LEVELS = [0, 1, 5, 50, 500, 5000, 50000, 500000];
      let lastFrameTime = performance.now();
      const DAY_SEC = 21600, YEAR_DAYS = 425;
      // The game's calendar starts 426 days (one year and one day) before Kerbalist's. Only the display
      // and the calendar picker use this offset; the stored UT is the game's own universal time.
      const CALENDAR_OFFSET_SEC = 426 * DAY_SEC;

      function utToDateString(ut) {
        const calUT = ut + CALENDAR_OFFSET_SEC;
        const totalDays = Math.floor(calUT / DAY_SEC);
        const year = Math.floor(totalDays / YEAR_DAYS);
        const day = totalDays % YEAR_DAYS;
        const secOfDay = ((calUT % DAY_SEC) + DAY_SEC) % DAY_SEC;
        const h = Math.floor(secOfDay / 3600), m = Math.floor((secOfDay % 3600) / 60), s = Math.floor(secOfDay % 60);
        const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
        return `T+${year}y,${day}d,${pad(h)}:${pad(m)}:${pad(s)}`;
      }
      function durationString(sec) {
        if (sec < 0) sec = 0;
        const y = Math.floor(sec / (DAY_SEC * YEAR_DAYS)); sec -= y * DAY_SEC * YEAR_DAYS;
        const d = Math.floor(sec / DAY_SEC); sec -= d * DAY_SEC;
        const h = Math.floor(sec / 3600); sec -= h * 3600;
        const m = Math.floor(sec / 60);
        const pad = (n) => String(Math.floor(n)).padStart(2, '0');
        let out = '';
        if (y > 0) out += y + 'y ';
        out += d + 'd ' + pad(h) + 'h ' + pad(m) + 'm';
        return out;
      }

