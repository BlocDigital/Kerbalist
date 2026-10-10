      /* =========================================================
         7. PLANET INFO PANEL
         ========================================================= */
      function showInfoFor(name) {
        let p = PLANETS.find(x => x.name === name);
        let isMoon = false;
        if (!p) {
          p = MOONS.find(x => x.name === name);
          if (p) isMoon = true;
        }
        if (!p) return;
        const s = p._state || stateAt(p, UT);
        const semiMajorStr = isMoon ? `${(p.a / 1000).toFixed(0)} km` : `${(p.a / 1e9).toFixed(3)} Gm`;
        document.getElementById('infoCard').innerHTML = `
    <div class="info-title"><span class="planet-swatch" style="background:${p.color};color:${p.color};"></span>${p.name}${isMoon ? ` <small style="font-size:11px;color:var(--text-dim);margin-left:6px;">(Moon of ${p.parent})</small>` : ''}</div>
    <div class="info-desc">${p.desc}</div>
    <div class="stat-row"><span class="k">Semi-major axis</span><span class="v">${semiMajorStr}</span></div>
    <div class="stat-row"><span class="k">Eccentricity</span><span class="v">${p.e.toFixed(3)}</span></div>
    <div class="stat-row"><span class="k">Inclination</span><span class="v">${p.incl.toFixed(2)}°</span></div>
    <div class="stat-row"><span class="k">Orbital period</span><span class="v">${durationString(p.period)}</span></div>
    <div class="stat-row"><span class="k">Mean radius</span><span class="v">${(p.radius / 1000).toFixed(0)} km</span></div>
    <div class="stat-row"><span class="k">Current orbital speed</span><span class="v hi">${Math.hypot(s.vx, s.vy).toFixed(0)} m/s</span></div>`;
      }
      showInfoFor('Kerbin');

