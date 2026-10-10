      function ejectionDiagramSvg(r) {
        const W = 195, H = 195, cx = W / 2, cy = H / 2;
        const OR = 62; // parking orbit radius in px
        const PR = 20; // planet display radius in px
        const oCol = r.originSelected.color || '#4b9eff';
        const bp = ejectionBurnPoint(r);
        const ejAngle = bp.fromRef;                  // signed: + = ahead of the reference point, - = behind it

        // Convert SVG degrees-from-top (clockwise) to [x, y] on a circle of given radius
        function pt(svgDeg, radius) {
          const rad = (svgDeg - 90) * Math.PI / 180;
          return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
        }

        // The planet's prograde direction is drawn at 3 o'clock; the ship orbits counter-clockwise on screen.
        // A position angle phi (CCW from prograde) sits at svgDeg = 90 - phi.
        const svgOf = (phiCCW) => 90 - phiCCW;
        const refSvgDeg = svgOf(bp.refCCW);          // retrograde (outbound) or prograde (inbound)
        const burnSvgDeg = svgOf(bp.burnCCW);        // ejAngle further along the orbit
        const [pgX, pgY] = pt(90, OR);
        const [rfX, rfY] = pt(refSvgDeg, OR);
        const [bX, bY] = pt(burnSvgDeg, OR);

        // Dashed angle-arc just outside the orbit ring, from the reference point to the burn point (counter-clockwise on screen => sweep 0)
        const arcR = OR + 12;
        const [a0x, a0y] = pt(refSvgDeg, arcR);
        const [a1x, a1y] = pt(burnSvgDeg, arcR);
        // Small angles: put the number inside the ring, on the burn dot's side of the reference line, so it clears the labels
        const smallAngle = Math.abs(ejAngle) < 25;
        const [lblX0, lblY0] = pt(refSvgDeg - ejAngle / 2, smallAngle ? OR - 22 : arcR + 14);
        const lblSide = (bY - rfY) >= 0 ? 1 : -1;
        const lblX = lblX0, lblY = lblY0 + (smallAngle ? lblSide * 10 : 0);
        const refLabel = bp.refName === 'retrograde' ? 'RG' : 'PG';
        const [rlX, rlY] = [rfX, rfY - 10];                       // label sits just above the reference dot (never clipped at the edge)

        return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;margin:6px auto 10px;">
    <circle cx="${cx}" cy="${cy}" r="${OR}" fill="none" stroke="#2a3f5f" stroke-width="2.2"/>
    <path d="M${a0x.toFixed(1)},${a0y.toFixed(1)} A${arcR},${arcR} 0 0 ${ejAngle >= 0 ? 0 : 1} ${a1x.toFixed(1)},${a1y.toFixed(1)}" fill="none" stroke="var(--amber)" stroke-width="1.6" stroke-dasharray="4,3" opacity="0.8"/>
    <line x1="${cx}" y1="${cy}" x2="${(cx + OR + 24).toFixed(1)}" y2="${cy}" stroke="var(--cyan)" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.5"/>
    <circle cx="${pgX.toFixed(1)}" cy="${pgY.toFixed(1)}" r="3.5" fill="var(--cyan)" opacity="0.55"/>
    ${bp.refName === 'retrograde' ? `<line x1="${cx}" y1="${cy}" x2="${(cx - OR - 24).toFixed(1)}" y2="${cy}" stroke="var(--cyan)" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.35"/>` : ''}
    <circle cx="${rfX.toFixed(1)}" cy="${rfY.toFixed(1)}" r="4.5" fill="var(--cyan)" opacity="0.9"/>
    ${bp.refName === 'retrograde' ? `<text x="${rlX.toFixed(1)}" y="${(rlY + 3).toFixed(1)}" text-anchor="middle" fill="var(--cyan)" font-size="9" font-family="monospace" opacity="0.85" font-weight="bold">${refLabel}</text>` : ''}
    <text x="${(cx + OR + 27).toFixed(1)}" y="${(cy + 4).toFixed(1)}" fill="var(--cyan)" font-size="9" font-family="monospace" opacity="0.75" font-weight="bold">PG</text>
    <circle cx="${cx}" cy="${cy}" r="${PR}" fill="${oCol}" opacity="0.9"/>
    <text x="${cx}" y="${(cy + 4).toFixed(1)}" text-anchor="middle" fill="#fff" font-size="8.5" font-family="monospace" opacity="0.85" font-weight="bold">${r.originSelected.name.slice(0, 4).toUpperCase()}</text>
    <circle cx="${bX.toFixed(1)}" cy="${bY.toFixed(1)}" r="6.5" fill="var(--amber)" opacity="0.95"/>
    <circle cx="${bX.toFixed(1)}" cy="${bY.toFixed(1)}" r="7.5" fill="none" stroke="var(--amber)" stroke-width="1" opacity="0.5"/>
    <text x="${lblX.toFixed(1)}" y="${(lblY + 4).toFixed(1)}" text-anchor="middle" fill="var(--amber)" font-size="9.5" font-family="monospace" opacity="0.95" font-weight="bold">${Math.abs(ejAngle).toFixed(1)}°</text>
  </svg>`;
      }

      function phaseGaugeSvg(current, required) {
        const R = 57, cx = 70, cy = 70;
        function pt(deg, r) { const a = (deg - 90) * DEG; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
        const p1 = pt(0, R), p2c = pt(current, R), p2r = pt(required, R);
        function arcPath(deg, color) {
          const large = Math.abs(deg) > 180 ? 1 : 0, sweep = deg >= 0 ? 1 : 0, end = pt(deg, R);
          return `<path d="M${cx},${cy} L${p1[0].toFixed(1)},${p1[1].toFixed(1)} A${R},${R} 0 ${large} ${sweep} ${end[0].toFixed(1)},${end[1].toFixed(1)} Z" fill="${color}" opacity="0.28"/>`;
        }
        return `<svg width="140" height="140" viewBox="0 0 140 140">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#1d2c47" stroke-width="1.5"/>
    ${arcPath(required, 'var(--amber)')}
    <line x1="${cx}" y1="${cy}" x2="${p2r[0].toFixed(1)}" y2="${p2r[1].toFixed(1)}" stroke="var(--amber)" stroke-width="2" stroke-dasharray="4,3" opacity="0.85"/>
    ${arcPath(current, 'var(--cyan)')}
    <line x1="${cx}" y1="${cy}" x2="${p2c[0].toFixed(1)}" y2="${p2c[1].toFixed(1)}" stroke="var(--cyan)" stroke-width="2.5"/>
    <line x1="${cx}" y1="${cy}" x2="${p1[0].toFixed(1)}" y2="${p1[1].toFixed(1)}" stroke="#4d5d78" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--text)"/>
  </svg>`;
      }

