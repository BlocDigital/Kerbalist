/* Community Statistics Overlay */
(function() {
  // Create stats overlay element
  const statsOverlay = document.createElement('div');
  statsOverlay.id = 'statsOverlay';
  statsOverlay.className = 'loading';
  statsOverlay.innerHTML = `
    <div class="stats-row">
      <span class="stats-label">Community Stats</span>
    </div>
  `;

  // Wait for DOM to be ready before inserting
  function insertStatsOverlay() {
    const hudContainer = document.getElementById('hudContainer');
    if (hudContainer) {
      hudContainer.appendChild(statsOverlay);
    } else {
      setTimeout(insertStatsOverlay, 100);
    }
  }
  insertStatsOverlay();

  // Fetch stats from the main Kerbalist site
  async function fetchStats() {
    try {
      // Try to fetch from stats API
      const response = await fetch('https://blockdigital.github.io/Kerbalist/api/stats.json', {
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) throw new Error('API not available');
      
      const data = await response.json();
      displayStats(data);
    } catch (error) {
      // Silently fail if stats unavailable (no console error)
      statsOverlay.classList.remove('loading');
      statsOverlay.style.display = 'none';
    }
  }

  function displayStats(data) {
    statsOverlay.classList.remove('loading');
    statsOverlay.innerHTML = '';

    // Format large numbers
    const fmt = (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    };

    // Build stats display
    let html = '';

    // Kerbalists (total unique users)
    if (data.kerbalists !== undefined) {
      html += `
        <div class="stats-row">
          <span class="stats-label">Kerbalists</span>
          <span class="stats-value">${fmt(data.kerbalists)}</span>
        </div>
      `;
    }

    // Planned transfers
    if (data.transfers !== undefined) {
      html += `
        <div class="stats-row">
          <span class="stats-label">Transfers</span>
          <span class="stats-value">${fmt(data.transfers)}</span>
        </div>
      `;
    }

    // Total years flown (across all transfers)
    if (data.totalYearsFlown !== undefined) {
      const years = (data.totalYearsFlown / 365.25).toFixed(2);
      html += `
        <div class="stats-row">
          <span class="stats-label">Years Flown</span>
          <span class="stats-value">${fmt(years)}</span>
        </div>
      `;
    }

    // Assist maneuvers performed
    if (data.assistManeuvers !== undefined) {
      html += `
        <div class="stats-row">
          <span class="stats-label">Assist Maneuvers</span>
          <span class="stats-value">${fmt(data.assistManeuvers)}</span>
        </div>
      `;
    }

    // Total ΔV executed
    if (data.totalDeltaV !== undefined) {
      html += `
        <div class="stats-row">
          <span class="stats-label">Total ΔV</span>
          <span class="stats-value">${fmt(data.totalDeltaV)} m/s</span>
        </div>
      `;
    }

    // Successful landings
    if (data.successfulLandings !== undefined) {
      html += `
        <div class="stats-row">
          <span class="stats-label">Landings</span>
          <span class="stats-value">${fmt(data.successfulLandings)}</span>
        </div>
      `;
    }

    if (html) {
      statsOverlay.innerHTML = html;
    } else {
      statsOverlay.style.display = 'none';
    }
  }

  // Fetch stats on load, then periodically refresh
  fetchStats();
  setInterval(fetchStats, 5 * 60 * 1000); // Refresh every 5 minutes
})();
