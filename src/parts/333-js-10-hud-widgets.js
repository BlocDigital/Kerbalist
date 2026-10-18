/* HUD Widget System - Core Functionality */
window.hudWidgets = window.hudWidgets || {};
window.hudWidgets.active = window.hudWidgets.active || {};

(function() {
  const hudContainer = document.getElementById('hudContainer');
  if (!hudContainer) return;
  function getDefaultPositions() {
    const W = window.innerWidth || 1920;
    const H = window.innerHeight || 1080;
    return {
      'ghost':    { x: 313, y: 972,  w: 289, h: 111 },
      'ejection': { x: 5,   y: 192,  w: 368, h: 311 },
      'phase':    { x: 3,   y: 945,  w: 295, h: 267 },
      'window':   { x: 313, y: 1092, w: 331, h: 128 },
      'time':     { x: 658, y: 1125, w: 327, h: 130 },
      'vessel':   { x: 375, y: 108,  w: 290, h: 215 }
    };
  }

  window.hudWidgets.positions = getDefaultPositions();

  // Load from localStorage
  function loadPositions() {
    try {
      const saved = localStorage.getItem('kerbalist_widget_positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (let k in parsed) {
          if (parsed[k] && parsed[k].w && parsed[k].w < 280) parsed[k].w = 290;
        }
        window.hudWidgets.positions = { ...window.hudWidgets.positions, ...parsed };
      }
    } catch (e) {}
  }

  // Save to localStorage
  function savePositions() {
    try {
      localStorage.setItem('kerbalist_widget_positions', JSON.stringify(window.hudWidgets.positions));
      const pinned = [];
      for (let [type, wid] of Object.entries(window.hudWidgets.active)) {
        const el = document.getElementById(wid);
        if (el && el.classList.contains('pinned')) pinned.push(type);
      }
      localStorage.setItem('kerbalist_widget_pinned', JSON.stringify(pinned));
    } catch (e) {}
  }

  loadPositions();

  // Puts every HUD element back at its default position and size, and clears the saved layout.
  window.resetHudLayout = function() {
    window.hudWidgets.positions = getDefaultPositions();
    try { localStorage.removeItem('kerbalist_widget_positions'); } catch (e) {}
    Object.entries(window.hudWidgets.active).forEach(([type, id]) => {
      const el = document.getElementById(id);
      const d = window.hudWidgets.positions[type];
      if (!el || !d) return;
      el.style.left = d.x + 'px';
      el.style.top = d.y + 'px';
      el.style.width = d.w + 'px';
      el.style.height = d.h + 'px';
    });
  };
  const resetHudBtn = document.getElementById('resetHudLayoutBtn');
  if (resetHudBtn) resetHudBtn.addEventListener('click', window.resetHudLayout);

  // Create widget
  // Padding and border add to the outer size when box-sizing is content-box, so resize must subtract them.
  function boxExtra(el) {
    const cs = getComputedStyle(el);
    if (cs.boxSizing === 'border-box') return { w: 0, h: 0 };
    return {
      w: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth),
      h: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    };
  }

  window.createHudWidget = function(id, type, title) {
    const existing = document.getElementById(id);
    if (existing) return existing;

    const defs = getDefaultPositions();
    const pos = window.hudWidgets.positions[type] || defs[type] || { x: 100, y: 100, w: 290, h: 180 };
    
    const widget = document.createElement('div');
    widget.id = id;
    widget.className = 'hud-widget';
    widget.style.left = pos.x + 'px';
    widget.style.top = pos.y + 'px';
    widget.style.width = pos.w + 'px';
    widget.style.height = pos.h + 'px';
    widget.innerHTML = `
      <div class="hud-title">${title}</div>
      <div class="hud-content"></div>
      <div class="hud-buttons">
        <button class="hud-btn hud-pin-btn" title="Pin widget">📌</button>
        <button class="hud-btn hud-close-btn" title="Close widget">✕</button>
      </div>
      <div class="hud-resize-handle"></div>
    `;

    // Content scales with the box: the factor is the box size relative to the widget's default size.
    const refSize = defs[type] || pos;
    const applyHudScale = () => {
      // Text grows with both dimensions (geometric mean), then shrinks until the content fits the box height.
      const clamp = (v) => Math.min(3, Math.max(0.3, v));
      let f = clamp(Math.sqrt((widget.offsetWidth / refSize.w) * (widget.offsetHeight / refSize.h)));
      const content = widget.querySelector('.hud-content');
      const title = widget.querySelector('.hud-title');
      const cs = getComputedStyle(widget);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      for (let i = 0; i < 10 && content; i++) {
        widget.style.setProperty('--hud-s', f.toFixed(3));
        const needed = (title ? title.getBoundingClientRect().height : 0) + content.getBoundingClientRect().height;
        const room = widget.getBoundingClientRect().height - padY;
        if (needed <= room || f <= 0.3) break;
        f = clamp(f * 0.94);
      }
      widget.style.setProperty('--hud-s', f.toFixed(3));
    };
    if (window.ResizeObserver) new ResizeObserver(applyHudScale).observe(widget);
    applyHudScale();

    // Restore pinned state if previously saved
    try {
      const pinned = JSON.parse(localStorage.getItem('kerbalist_widget_pinned') || '[]');
      if (pinned.includes(type)) {
        widget.classList.add('pinned');
        const pinBtn = widget.querySelector('.hud-pin-btn');
        if (pinBtn) pinBtn.classList.add('active');
      }
    } catch (e) {}

    hudContainer.appendChild(widget);
    attachWidgetHandlers(widget, type);
    window.hudWidgets.active[type] = id;
    return widget;
  };

  // Close widget
  window.closeHudWidget = function(id) {
    const widget = document.getElementById(id);
    if (widget) {
      widget.remove();
      // Find type and clear from active
      for (let [type, wid] of Object.entries(window.hudWidgets.active)) {
        if (wid === id) {
          delete window.hudWidgets.active[type];
          if (window.updateButtonStateForType) {
            window.updateButtonStateForType(type);
          }
          break;
        }
      }
      savePositions();
      if (window.saveActiveWidgets) {
        window.saveActiveWidgets();
      }
    }
  };

  // Attach drag/resize/pin handlers
  function attachWidgetHandlers(widget, type) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startWidth, startHeight;
    const pinBtn = widget.querySelector('.hud-pin-btn');
    const closeBtn = widget.querySelector('.hud-close-btn');
    const resizeHandle = widget.querySelector('.hud-resize-handle');

    // Drag handler
    widget.addEventListener('mousedown', (e) => {
      if (e.target.closest('.hud-buttons') || e.target.closest('.hud-resize-handle')) return;
      if (widget.classList.contains('pinned')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = widget.offsetLeft;
      startTop = widget.offsetTop;
      widget.classList.add('dragging');
      e.preventDefault();
    });

    // Resize handler
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => {
        if (widget.classList.contains('pinned')) return;
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = widget.offsetWidth;
        startHeight = widget.offsetHeight;
        e.preventDefault();
        e.stopPropagation();
      });
    }

    // Mouse move
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        widget.style.left = (startLeft + dx) + 'px';
        widget.style.top = (startTop + dy) + 'px';
      } else if (isResizing) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const extra = boxExtra(widget);
        widget.style.width = Math.max(140, startWidth + dx - extra.w) + 'px';
        widget.style.height = Math.max(90, startHeight + dy - extra.h) + 'px';
      }
    });

    // Mouse up
    document.addEventListener('mouseup', () => {
      if (isDragging || isResizing) {
        widget.classList.remove('dragging');
        isDragging = false;
        isResizing = false;
        // Save position
        window.hudWidgets.positions[type] = {
          x: parseInt(widget.style.left),
          y: parseInt(widget.style.top),
          w: parseInt(widget.style.width),
          h: parseInt(widget.style.height)
        };
        savePositions();
      }
    });

    // Pin button
    if (pinBtn) {
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        widget.classList.toggle('pinned');
        pinBtn.classList.toggle('active');
        savePositions();
      });
    }

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.closeHudWidget(widget.id);
      });
    }
  }

  // Update widget content
  window.updateHudContent = function(id, content) {
    const widget = document.getElementById(id);
    if (widget) {
      const contentDiv = widget.querySelector('.hud-content');
      if (contentDiv) {
        contentDiv.innerHTML = content;
      }
    }
  };
})();
