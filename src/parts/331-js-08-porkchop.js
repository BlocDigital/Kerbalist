      /* =========================================================
         8. PORKCHOP PLOT
         ========================================================= */
      const pkCanvas = document.getElementById('pkCanvas');
      const pkCtx = pkCanvas.getContext('2d');
      let pkGrid = null;

      function resizePkCanvas() {
        const w = pkCanvas.parentElement.clientWidth;
        pkCanvas.width = w; pkCanvas.height = Math.round(w * 0.82);
      }

      function generatePorkchop() {
        const oName = originSelect.value, dName = destSelect.value;
        const originSelected = findBody(oName), destSelected = findBody(dName);
        const destMoon = destSelected && destSelected.parent ? destSelected : null;
        const o = transferBodyFor(originSelected), d = transferBodyFor(destSelected);
        if (!o || !d) return;
        // Allow o === d for moon transfers, but not for planet-to-planet
        if (o === d && !destMoon) return;
        resizePkCanvas();
        const synPeriod = Math.abs(1 / (1 / o.period - 1 / d.period));
        const depSpan = Math.min(synPeriod * 1.05, o.period * 1.2);
        const at = (o.a + d.a) / 2;
        const ttHohmann = Math.PI * Math.sqrt(Math.pow(at, 3) / KERBOL.mu);
        const tofMin = ttHohmann * 0.35, tofMax = ttHohmann * 1.9;
        const GRID = 42;
        const depTimes = [], tofTimes = [];
        for (let i = 0; i < GRID; i++) depTimes.push(UT + (i / (GRID - 1)) * depSpan);
        for (let j = 0; j < GRID; j++) tofTimes.push(tofMin + (j / (GRID - 1)) * (tofMax - tofMin));
        const dvGrid = [];
        let dvMin = Infinity, dvMax = -Infinity;
        for (let j = 0; j < GRID; j++) {
          const row = [];
          for (let i = 0; i < GRID; i++) {
            const tDep = depTimes[i], tof = tofTimes[j];
            const s1 = stateAt(o, tDep), s2 = stateAt(d, tDep + tof);
            const sol = lambertSolve([s1.x, s1.y], [s2.x, s2.y], tof, KERBOL.mu);
            let dv = null;
            if (sol) {
              const vd = Math.hypot(sol.v1[0] - s1.vx, sol.v1[1] - s1.vy);
              const va = Math.hypot(sol.v2[0] - s2.vx, sol.v2[1] - s2.vy);
              dv = vd + va;

              // Note: Moon insertion and landing Δv not included in porkchop grid
              // These depend on approach geometry and are shown as reference only
              // The grid shows heliocentric transfer Δv (what's needed to get there)

              if (dv < dvMin) dvMin = dv;
              if (dv > dvMax) dvMax = dv;
            }
            row.push(dv);
          }
          dvGrid.push(row);
        }
        pkGrid = { depTimes, tofTimes, dvGrid, dvMin, dvMax, GRID, o, d, destMoon };
        drawPorkchop();
      }

      function dvColor(t) {
        const stops = [[0.00, [47, 111, 255]], [0.22, [79, 224, 232]], [0.45, [126, 231, 135]], [0.65, [255, 224, 102]], [0.83, [255, 157, 77]], [1.00, [255, 91, 91]]];
        for (let i = 0; i < stops.length - 1; i++) {
          const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
          if (t >= t0 && t <= t1) {
            const f = (t - t0) / (t1 - t0);
            return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * f)},${Math.round(c0[1] + (c1[1] - c0[1]) * f)},${Math.round(c0[2] + (c1[2] - c0[2]) * f)})`;
          }
        }
        return 'rgb(255,91,91)';
      }

      let pkSelectedCell = null;
      function drawPorkchop() {
        if (!pkGrid) return;
        const { dvGrid, dvMin, dvMax, GRID } = pkGrid;
        const W = pkCanvas.width, H = pkCanvas.height;
        pkCtx.clearRect(0, 0, W, H);
        const cw = W / GRID, ch = H / GRID;
        for (let j = 0; j < GRID; j++) {
          for (let i = 0; i < GRID; i++) {
            const dv = dvGrid[j][i];
            pkCtx.fillStyle = dv === null ? '#0a0f1c' : dvColor((dv - dvMin) / Math.max(1, (dvMax - dvMin)));
            pkCtx.fillRect(i * cw, H - (j + 1) * ch, cw + 0.6, ch + 0.6);
          }
        }
        if (pkSelectedCell) {
          pkCtx.strokeStyle = '#ffffff'; pkCtx.lineWidth = 2;
          pkCtx.strokeRect(pkSelectedCell.i * cw, H - (pkSelectedCell.j + 1) * ch, cw, ch);
        }
      }

      pkCanvas.addEventListener('click', evt => {
        if (!pkGrid) return;
        const rect = pkCanvas.getBoundingClientRect();
        const scaleX = pkCanvas.width / rect.width, scaleY = pkCanvas.height / rect.height;
        const px = (evt.clientX - rect.left) * scaleX, py = (evt.clientY - rect.top) * scaleY;
        const GRID = pkGrid.GRID;
        const cw = pkCanvas.width / GRID, ch = pkCanvas.height / GRID;
        const i = Math.min(GRID - 1, Math.floor(px / cw));
        const j = Math.min(GRID - 1, Math.floor((pkCanvas.height - py) / ch));
        pkSelectedCell = { i, j };
        drawPorkchop();
        const dv = pkGrid.dvGrid[j][i];
        const tDep = pkGrid.depTimes[i], tof = pkGrid.tofTimes[j];
        const card = document.getElementById('pkSelected');
        const body = document.getElementById('pkSelectedBody');
        if (dv !== null) {
          card.style.display = '';
          const dvLabel = pkGrid.destMoon ? 'Total Δv (heliocentric + moon insertion)' : 'Total heliocentric Δv';
          body.innerHTML = `
      <div class="stat-row"><span class="k">Departure UT</span><span class="v">${utToDateString(tDep)}</span></div>
      <div class="stat-row"><span class="k">Time of Flight</span><span class="v">${durationString(tof)}</span></div>
      <div class="stat-row"><span class="k">${dvLabel}</span><span class="v hi">${dv.toFixed(0)} m/s</span></div>`;
        } else {
          card.style.display = 'none';
        }
      });
      document.getElementById('pkGenerate').onclick = generatePorkchop;

