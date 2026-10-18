      function getReturnPlan(r) {
        const destBodyName = r.destSelected.name;
        const returnOriginName = r.destSelected.parent ? r.destSelected.parent : destBodyName;
        if (returnOriginName === 'Kerbin') return null;

        const outboundWaitSec = r.waitSec !== null ? Math.max(0, r.waitSec) : 0;
        const outboundArrivalUT = UT + outboundWaitSec + r.tof;
        const missionStaySec = Math.max(0, missionTimeOnTargetDays) * DAY_SEC;
        const returnReadyUT = outboundArrivalUT + missionStaySec;
        const ret = computeTransfer(returnOriginName, 'Kerbin', returnReadyUT, false);   // quick Hohmann estimate, no exact solve
        if (!ret) return null;

        const returnWaitSec = ret.waitSec !== null ? Math.max(0, ret.waitSec) : 0;
        const returnDepartureUT = returnReadyUT + returnWaitSec;
        const returnArrivalUT = returnDepartureUT + ret.tt;
        const returnEjectionBurn = Math.abs(ret.dv1_helio) > 0 ? ret.depEj.dvBurn : 0;
        const kerbinCaptureBurn = ret.arrEj.dvBurn;
        const returnDv = returnEjectionBurn + kerbinCaptureBurn;
        const outboundDv = (Math.abs(r.dv1_helio) > 0 ? r.depEj.dvBurn : 0) + r.arrEj.dvBurn;  // Heliocentric transfer only
        const departureBody = r.destSelected.parent ? r.destSelected : ret.originSelected;

        return {
          ret, destBodyName, returnOriginName, returnReadyUT, returnWaitSec,
          returnDepartureUT, returnArrivalUT, returnEjectionBurn,
          kerbinCaptureBurn, returnDv, roundTripDv: outboundDv + returnDv,
          departureBody
        };
      }

      function returnBudgetHtml(r) {
        const plan = getReturnPlan(r);
        if (!plan) {
          return '<div class="note">Return-to-Kerbin budget is not shown because Kerbin is already the selected destination.</div>';
        }

        const targetLabel = r.destSelected.parent ? `${plan.destBodyName} / ${plan.returnOriginName}` : plan.destBodyName;

        return `
      <div class="stat-row"><span class="k">Return origin</span><span class="v">${targetLabel}</span></div>
      <div class="return-visual-toggle">
        <label for="visualizeReturnTrip">Visualize return trip on map</label>
        <input type="checkbox" id="visualizeReturnTrip" ${visualizeReturnTrip ? 'checked' : ''} onchange="window.setReturnTripVisualization(this.checked)">
      </div>
      <div class="stat-row"><span class="k">Return window wait</span><span class="v warn">${plan.returnWaitSec < 1 ? 'Open now' : durationString(plan.returnWaitSec)}</span></div>
      <div class="stat-row"><span class="k">Return departure UT</span><span class="v">${utToDateString(plan.returnDepartureUT)}</span></div>
      <div class="stat-row"><span class="k">Return arrival UT</span><span class="v">${utToDateString(plan.returnArrivalUT)}</span></div>
      <div class="stat-row"><span class="k">Return ejection burn @ ${plan.returnOriginName}</span><span class="v hi">${plan.returnEjectionBurn.toFixed(0)} m/s</span></div>
      <div class="stat-row"><span class="k">Kerbin capture burn</span><span class="v hi">${plan.kerbinCaptureBurn.toFixed(0)} m/s</span></div>
      <div class="stat-row"><span class="k">Return Δv budget</span><span class="v hi">${plan.returnDv.toFixed(0)} m/s</span></div>
      <div class="stat-row"><span class="k">Round-trip Δv budget</span><span class="v warn">${plan.roundTripDv.toFixed(0)} m/s</span></div>`;
      }

      function renderTransferResults() {
        const r = currentResult;
        if (!r) { document.getElementById('transferResults').innerHTML = '<div class="placeholder">No transfer computed.</div>'; return; }
        
        const moonInsertDv = r.moonInsertionDv || 0;
        const landingDv = r.landingDv || 0;
        const waitSec = r.waitSec !== null ? Math.max(0, r.waitSec) : 0;
        const selectedAssist = (selectedAssistIdx !== null && currentAssists[selectedAssistIdx]) ? currentAssists[selectedAssistIdx] : null;

        // Determine which trajectory to display
        let ejDepBurn, ejArrBurn, totalHelioDv, tofDisplay, assistNote;

        if (selectedAssist) {
          // Gravity assist trajectory
          ejDepBurn = selectedAssist.solved.vInfDep;
          ejArrBurn = selectedAssist.solved.vInfArr;
          totalHelioDv = selectedAssist.solved.totalDv;
          tofDisplay = selectedAssist.solved.totalTime;
          assistNote = ` <span style="color: var(--cyan); font-size: 12px;">(via ${selectedAssist.planet.name} assist)</span>`;
        } else {
          // Direct transfer
          ejDepBurn = Math.abs(r.dv1_helio) > 0 ? r.depEj.dvBurn : 0;
          ejArrBurn = r.arrEj.dvBurn;
          totalHelioDv = Math.abs(r.dv1_helio) + Math.abs(r.dv2_helio);
          tofDisplay = r.tof;
          assistNote = '';
        }

        const totalDv = ejDepBurn + ejArrBurn;
        const totalFlightTime = selectedAssist ? selectedAssist.solved.totalTime : r.tof;
        const ghostUT = UT + waitSec + totalFlightTime;
        const originName = r.originSelected.name;
        const destName = r.destSelected.name;
        const isMoonOrigin = r.originSelected.parent;
        const isMoonDest = r.destMoon;
        const parentPlanetName = isMoonDest ? r.destMoon.parent : null;
        const parentNote = (isMoonOrigin || isMoonDest)
          ? `<div class="note">${isMoonDest ? `Moon transfers use ${parentPlanetName}'s heliocentric transfer window. Moon orbit insertion (~${moonInsertDv.toFixed(0)} m/s) and landing (~${landingDv.toFixed(0)} m/s) are shown for reference but depend on approach geometry.` : `Moon origin uses the parent planet's heliocentric frame.`} Map markers and arrival ghost are placed on the selected moon.</div>`
          : '';

        const isHudActive = (k) => (window.hudWidgets && window.hudWidgets.active && window.hudWidgets.active[k]) ? ' on' : '';

        // For assist: show simplified phase/ejection, highlight the 2-leg nature
        const phaseCard = selectedAssist 
          ? `
    <div class="card" data-card="phase">
      <h3><span class="dot"></span>Phase Angle (direct reference)<button class="hud-card-toggle${isHudActive('phase')}" data-widget-type="phase" onclick="window.toggleTransferWidget('phase')" title="Toggle HUD widget">HUD</button></h3>
      <div class="phase-gauge">${phaseGaugeSvg(r.currentPhase, r.requiredPhase)}</div>
      <div class="stat-row"><span class="k">Current phase angle</span><span class="v hi">${r.currentPhase.toFixed(1)}°</span></div>
      <div class="stat-row"><span class="k">Required phase angle</span><span class="v warn">${r.requiredPhase.toFixed(1)}°</span></div>
      <div class="stat-row"><span class="k">Difference</span><span class="v">${angNormPM180(r.currentPhase - r.requiredPhase).toFixed(1)}°</span></div>
      <div class="note">Showing direct transfer reference. Assist route uses 2-leg Lambert arcs from ${originName} → ${selectedAssist.planet.name} → ${destName}.</div>
    </div>`
          : `
    <div class="card" data-card="phase">
      <h3><span class="dot"></span>Phase Angle<button class="hud-card-toggle${isHudActive('phase')}" data-widget-type="phase" onclick="window.toggleTransferWidget('phase')" title="Toggle HUD widget">HUD</button></h3>
      <div class="phase-gauge">${phaseGaugeSvg(r.currentPhase, r.requiredPhase)}</div>
      <div class="stat-row"><span class="k">Current phase angle</span><span class="v hi">${r.currentPhase.toFixed(1)}°</span></div>
      <div class="stat-row"><span class="k">Required phase angle</span><span class="v warn">${r.requiredPhase.toFixed(1)}°</span></div>
      <div class="stat-row"><span class="k">Difference</span><span class="v ${Math.abs(angNormPM180(r.currentPhase - r.requiredPhase)) < 2 ? 'good' : ''}">${angNormPM180(r.currentPhase - r.requiredPhase).toFixed(1)}°</span></div>
    </div>`;

        const ejectionCard = selectedAssist
          ? `
    <div class="card" data-card="ejection">
      <h3><span class="dot"></span>Ejection Angle (direct reference)<button class="hud-card-toggle${isHudActive('ejection')}" data-widget-type="ejection" onclick="window.toggleTransferWidget('ejection')" title="Toggle HUD widget">HUD</button></h3>
      ${ejectionDiagramSvg(r)}
      <div class="stat-row"><span class="k">${originName} departure burn</span><span class="v hi">${ejectionBurnPoint(r).text}</span></div>
      <div class="stat-row"><span class="k">${destName} capture geometry</span><span class="v hi">${r.arrEj.ejAngleFromPeri.toFixed(1)}° from asymptote</span></div>
      <div class="note">Showing direct transfer reference. The actual 2-leg assist trajectory will have different departure/arrival angles toward the assist planet instead.</div>
    </div>`
          : `
    <div class="card" data-card="ejection">
      <h3><span class="dot"></span>Ejection Angle (burn point)<button class="hud-card-toggle${isHudActive('ejection')}" data-widget-type="ejection" onclick="window.toggleTransferWidget('ejection')" title="Toggle HUD widget">HUD</button></h3>
      ${ejectionDiagramSvg(r)}
      <div class="stat-row"><span class="k">${originName} departure burn</span><span class="v hi">${ejectionBurnPoint(r).text}</span></div>
      <div class="stat-row"><span class="k">${destName} capture geometry</span><span class="v hi">${r.arrEj.ejAngleFromPeri.toFixed(1)}° from asymptote</span></div>
      <div class="note">Burn when your ship is this far from the planet's ${ejectionBurnPoint(r).refName} point, measured in the direction you orbit. Derived from the hyperbolic escape trajectory at ${(PARK_ALT / 1000) | 0} km altitude.</div>
    </div>`;

        document.getElementById('transferResults').innerHTML = `
    ${parentNote}
      <div class="card">
      <h3><span class="dot"></span>Δv Budget (from ${(PARK_ALT / 1000) | 0} km parking orbit)${assistNote}</h3>
      <div class="big-num">
        <div>${totalDv.toFixed(0)}<small>m/s heliocentric transfer</small></div>
        <div style="font-size: 16px; color: var(--text-dim); font-weight: 400; text-shadow: none; margin-top: 4px;">${totalHelioDv.toFixed(0)}<small style="font-size: 11px;">m/s total</small></div>
      </div>
      <div class="stat-row"><span class="k">Heliocentric v∞ (departure)</span><span class="v hi">${ejDepBurn.toFixed(0)} m/s</span></div>
      <div class="stat-row"><span class="k">Heliocentric v∞ (arrival)</span><span class="v hi">${ejArrBurn.toFixed(0)} m/s</span></div>
      ${selectedAssist ? `<div class="stat-row"><span class="k">Δv Savings vs direct</span><span class="v good">-${selectedAssist.savings.toFixed(0)} m/s</span></div>` : ''}
      ${isMoonDest ? `<div class="stat-row"><span class="k">Moon orbit insertion @ ${destName}</span><span class="v hi">${moonInsertDv.toFixed(0)} m/s</span></div>` : ''}
      ${landingDv > 0 ? `<div class="stat-row"><span class="k">Landing @ ${destName}</span><span class="v hi">${landingDv.toFixed(0)} m/s</span></div>` : ''}
      <div class="mission-time-row">
        <div class="mission-time-label">Mission time on target planet</div>
        <div class="mission-stepper" aria-label="Mission time on target planet in days">
          <button type="button" onclick="window.adjustMissionTimeOnTarget(-20)" title="Decrease mission time by 20 days">-20</button>
          <button type="button" onclick="window.adjustMissionTimeOnTarget(-10)" title="Decrease mission time by 10 days">-10</button>
          <button type="button" onclick="window.adjustMissionTimeOnTarget(-1)" title="Decrease mission time by 1 day">-1</button>
          <div class="mission-days-display">${missionTimeOnTargetDays}d</div>
          <button type="button" onclick="window.adjustMissionTimeOnTarget(1)" title="Increase mission time by 1 day">+1</button>
          <button type="button" onclick="window.adjustMissionTimeOnTarget(10)" title="Increase mission time by 10 days">+10</button>
          <button type="button" onclick="window.adjustMissionTimeOnTarget(20)" title="Increase mission time by 20 days">+20</button>
        </div>
      </div>
      ${returnBudgetHtml(r)}
      <div class="note">Patched-conic, circular-coplanar approximation using each planet's semi-major axis. Parking orbit at ${(PARK_ALT / 1000) | 0} km.${selectedAssist ? ` Gravity assist uses Lambert arcs to compute the 2-leg trajectory; the savings shown are from comparing total v∞ values.` : ` Capture burn can be omitted for a flyby / aerocapture mission.`}</div>
    </div>
    <div class="card" data-card="window">
      <h3><span class="dot"></span>Next Transfer Window<button class="hud-card-toggle${isHudActive('window')}" data-widget-type="window" onclick="window.toggleTransferWidget('window')" title="Toggle HUD widget">HUD</button></h3>
      <div class="countdown ${r.waitSec === null ? 'past' : ''}">${r.waitSec === null ? 'Synodic period ≈ 0 (same period)' : (r.waitSec < 1 ? 'WINDOW OPEN NOW' : 'T‑minus ' + durationString(r.waitSec))}</div>
      ${r.waitSec !== null ? `<div class="stat-row"><span class="k">Window opens at UT</span><span class="v">${utToDateString(UT + r.waitSec)}</span></div>` : ''}
      <div class="stat-row"><span class="k">Arrival UT</span><span class="v">${r.waitSec !== null ? utToDateString(ghostUT) : '—'}</span></div>
      ${selectedAssist ? `<div class="note">Assist route departure uses the same window as direct transfer. Total time includes both ${durationString(selectedAssist.solved.tof1)} (leg 1) and ${durationString(selectedAssist.solved.tof2)} (leg 2).</div>` : ''}
    </div>
    ${phaseCard}
    ${ejectionCard}
    <div class="card" data-card="time">
      <h3><span class="dot"></span>Transfer Time${assistNote}<button class="hud-card-toggle${isHudActive('time')}" data-widget-type="time" onclick="window.toggleTransferWidget('time')" title="Toggle HUD widget">HUD</button></h3>
      <div class="big-num" style="color:var(--cyan);text-shadow:0 0 14px rgba(79,224,232,.3);">${durationString(tofDisplay)}</div>
      ${selectedAssist ? `
        <div class="stat-row"><span class="k">Leg 1: ${originName} → ${selectedAssist.planet.name}</span><span class="v cyan">${durationString(selectedAssist.solved.tof1)}</span></div>
        <div class="stat-row"><span class="k">Leg 2: ${selectedAssist.planet.name} → ${destName}</span><span class="v cyan">${durationString(selectedAssist.solved.tof2)}</span></div>
      ` : `
        <div class="stat-row"><span class="k">Transfer orbit SMA</span><span class="v">${(r.at / 1e9).toFixed(3)} Gm</span></div>
        <div class="stat-row"><span class="k">Transfer orbit type</span><span class="v">${r.outbound ? 'Outbound (ascending)' : 'Inbound (descending)'}</span></div>
      `}
    </div>
    <div class="card" data-card="ghost" style="border-color:rgba(255,180,84,.22);">
      <h3><span class="dot" style="background:var(--amber);box-shadow:0 0 6px var(--amber);"></span>Ghost Body — ${destName} at Arrival${selectedAssist ? ' (via assist)' : ''}<button class="hud-card-toggle${isHudActive('ghost')}" data-widget-type="ghost" onclick="window.toggleTransferWidget('ghost')" title="Toggle HUD widget">HUD</button></h3>
      <div class="stat-row"><span class="k">Arrival UT</span><span class="v warn">${utToDateString(ghostUT)}</span></div>
      <div class="stat-row"><span class="k">Time until arrival</span><span class="v">${durationString(waitSec + totalFlightTime)}</span></div>
      <div class="note">The translucent ghost on the 3D map shows where ${destName} will be when your craft arrives${selectedAssist ? ' via the selected gravity assist route' : ''}. A dashed line connects its current position to the arrival position. The ghost updates live as UT advances.</div>
    </div>`;
      }

      window.adjustMissionTimeOnTarget = (deltaDays) => {
        missionTimeOnTargetDays = Math.max(0, missionTimeOnTargetDays + deltaDays);
        renderTransferResults();
        if (visualizeReturnTrip) {
          if (!returnArcLine) initReturnTripOverlay();
          updateReturnTripOverlay();
        }
      };

      window.setReturnTripVisualization = (checked) => {
        visualizeReturnTrip = checked;
        if (visualizeReturnTrip) {
          initReturnTripOverlay();
          updateReturnTripOverlay();
        } else {
          hideReturnTripOverlay();
        }
        renderTransferResults();
      };

      function renderAssistOptions() {
        const list = document.getElementById('assistList');
        if (!currentResult) {
          list.innerHTML = '<div class="placeholder">Plan a transfer first — if an intermediate planet is well-positioned for a flyby, it\'ll show up here as an optional route.</div>';
          return;
        }
        if (!currentAssists.length) {
          list.innerHTML = '<div class="placeholder">No planet is well-positioned for a gravity assist on this route right now. Try again closer to the transfer window, or pick a route that passes a planet on the way (e.g. Kerbin → Jool via Eve, or Kerbin → Eeloo via Jool).</div>';
          return;
        }
        list.innerHTML = currentAssists.map((a, i) => {
          const extra = a.solved.totalTime - currentResult.tof;
          const savingsHtml = a.savings > 1
            ? `Save ${a.savings.toFixed(0)} m/s`
            : `<span style="color:var(--text-dimmer);">No savings</span>`;
          return `
      <div class="assist-item ${selectedAssistIdx === i ? 'selected' : ''}" onclick="window.selectAssist(${i})">
        <input type="radio" name="assistPick" ${selectedAssistIdx === i ? 'checked' : ''} readonly>
        <div class="label">
          <div class="name">${a.planet.name} flyby</div>
          <div class="sub">${durationString(a.solved.totalTime)} total (${extra >= 0 ? '+' : ''}${durationString(Math.abs(extra))} ${extra >= 0 ? 'longer' : 'shorter'})</div>
        </div>
        <div class="savings ${a.savings > 1 ? '' : 'none'}">${savingsHtml}</div>
      </div>`;
        }).join('') + `<div class="stat-row" style="margin-top:6px;"><span class="k">Direct transfer Δv (for comparison)</span><span class="v">${(Math.abs(currentResult.dv1_helio) + Math.abs(currentResult.dv2_helio)).toFixed(0)} m/s</span></div>`;
      }

      window.selectAssist = (i) => {
        if (selectedAssistIdx === i) {
          // toggle off
          selectedAssistIdx = null;
          hideAssistArcs();
        } else {
          selectedAssistIdx = i;
          initAssistArcs();
          updateAssistArcs();
        }
        updateGhostPosition();
        renderTransferResults();
        renderAssistOptions();
      };
