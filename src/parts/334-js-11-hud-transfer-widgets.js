/* HUD Transfer Widgets - Integration with Transfer Results */
(function() {
  const transferResults = document.getElementById('transferResults');
  if (!transferResults) return;

  const widgetConfig = {
    'window': { title: 'Next Transfer Window', selector: '[data-card="window"]' },
    'phase': { title: 'Phase Angle', selector: '[data-card="phase"]' },
    'ejection': { title: 'Ejection Angle', selector: '[data-card="ejection"]' },
    'time': { title: 'Transfer Time', selector: '[data-card="time"]' },
    'ghost': { title: 'Ghost Body', selector: '[data-card="ghost"]' }
  };

  window.saveActiveWidgets = function() {
    try {
      const active = Object.keys(window.hudWidgets.active);
      localStorage.setItem('kerbalist_active_widgets', JSON.stringify(active));
    } catch (e) {}
  };

  // Restore active widgets on load
  let restored = false;
  function restoreActiveWidgets() {
    if (restored) return;
    const cards = document.querySelectorAll('[data-card]');
    if (!cards || cards.length === 0) return;
    restored = true;

    let toActivate = ['ghost']; // Default: ghost body active next to status
    try {
      const saved = localStorage.getItem('kerbalist_active_widgets');
      if (saved !== null) {
        toActivate = JSON.parse(saved);
      }
    } catch (e) {}

    if (Array.isArray(toActivate)) {
      toActivate.forEach(type => {
        if (widgetConfig[type] && !window.hudWidgets.active[type]) {
          window.toggleTransferWidget(type);
        }
      });
    }
  }

  // Debounce widget updates to prevent rapid firing
  let updateTimer = null;
  function debounceUpdateWidgets() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      restoreActiveWidgets();
      updateAllWidgets();
    }, 150);
  }

  // Watch for transfer results changes (content only, not button state)
  const observer = new MutationObserver(() => {
    debounceUpdateWidgets();
  });

  observer.observe(transferResults, {
    childList: true,
    subtree: true,
    characterData: true
  });

  function updateAllWidgets() {
    for (let [type, widgetId] of Object.entries(window.hudWidgets.active)) {
      if (widgetId) {
        updateTransferWidgetContent(type);
      }
    }
  }

  function updateTransferWidgetContent(type) {
    const config = widgetConfig[type];
    const card = document.querySelector(config.selector);
    if (!card) return;

    const content = extractCardContent(card);
    const widgetId = `transfer-${type}`;
    window.updateHudContent(widgetId, content);
  }

  function extractCardContent(card) {
    const clone = card.cloneNode(true);
    // Remove title and wrapper elements
    const title = clone.querySelector('h3');
    if (title) title.remove();
    const wrapper = clone.querySelector('.wrapper');
    if (wrapper) wrapper.remove();
    // Remove button if present
    const btn = clone.querySelector('.hud-pin-card-btn, .hud-card-toggle');
    if (btn) btn.remove();
    // Remove note
    const note = clone.querySelector('.note');
    if (note) note.remove();

    return clone.innerHTML;
  }

  // Create widget on toggle
  window.toggleTransferWidget = function(type) {
    if (window.hudWidgets.active[type]) {
      // Close it
      window.closeHudWidget(`transfer-${type}`);
    } else {
      // Open it
      const config = widgetConfig[type];
      const widget = window.createHudWidget(`transfer-${type}`, type, config.title);
      if (widget) {
        updateTransferWidgetContent(type);
      }
    }
    // Update button state only after widget action completes
    window.updateButtonStateForType(type);
    window.saveActiveWidgets();
  };

  // Update card header toggle state
  window.updateButtonStateForType = function(type) {
    const btn = document.querySelector(`.hud-card-toggle[data-widget-type="${type}"]`);
    if (btn) {
      if (window.hudWidgets.active[type]) {
        btn.classList.add('on');
      } else {
        btn.classList.remove('on');
      }
    }
  };

  // Export config for sidebar
  window.hudTransferWidgetConfig = widgetConfig;
})();
