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
      'ghost':    { x: 185, y: 16, w: 290, h: 110 },
      'ejection': { x: Math.max(500, W - 880), y: 65, w: 320, h: 320 },
      'phase':    { x: Math.max(720, W - 520), y: 300, w: 290, h: 235 },
      'window':   { x: Math.max(680, W - 700), y: Math.max(480, H - 350), w: 300, h: 145 },
      'time':     { x: Math.max(680, W - 700), y: Math.max(620, H - 195), w: 300, h: 135 }
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

  // Create widget
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
        widget.style.width = Math.max(200, startWidth + dx) + 'px';
        widget.style.height = Math.max(100, startHeight + dy) + 'px';
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
