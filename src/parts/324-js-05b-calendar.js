      /* =========================================================

      /* =========================================================

      /* =========================================================
         UT SYNC — Kerbol Calendar Modal
         UT does NOT auto-update — user must click Apply
         ========================================================= */
      const calModal = document.getElementById('calModal');
      const calOpenBtn = document.getElementById('calOpenBtn');
      const calCloseBtn = document.getElementById('calCloseBtn');
      const calCancelBtn = document.getElementById('calCancelBtn');
      const calApplyBtn = document.getElementById('calApplyBtn');
      const calYearInput = document.getElementById('calYearInput');
      const calSeasonDisplay = document.getElementById('calSeasonDisplay');
      const calSeasonBar = document.getElementById('calSeasonBar');
      const calMonthGrid = document.getElementById('calMonthGrid');
      const calHour = document.getElementById('calHour');
      const calMin = document.getElementById('calMin');
      const calSec = document.getElementById('calSec');
      const calSeasonPrev = document.getElementById('calSeasonPrev');
      const calSeasonNext = document.getElementById('calSeasonNext');

      const KERBOL_SEASONS = [
        { name: 'Vernal Equinox', start: 0, color: '#7ee787' },
        { name: 'Summer Solstice', start: 106, color: '#ffb454' },
        { name: 'Autumnal Equinox', start: 213, color: '#ff6b6b' },
        { name: 'Winter Solstice', start: 319, color: '#b78cff' }
      ];

      let calendarState = {
        year: 0,
        dayOfYear: 0,
        hour: 0,
        min: 0,
        sec: 0
      };

      function getSeasonForDay(doy) {
        let season = KERBOL_SEASONS[KERBOL_SEASONS.length - 1];
        for (const s of KERBOL_SEASONS) {
          if (doy >= s.start) season = s;
        }
        return season;
      }

      function getSeasonProgress(doy) {
        const season = getSeasonForDay(doy);
        const nextSeasonStart = KERBOL_SEASONS[KERBOL_SEASONS.indexOf(season) + 1]
          ? KERBOL_SEASONS[KERBOL_SEASONS.indexOf(season) + 1].start
          : YEAR_DAYS;
        return (doy - season.start) / (nextSeasonStart - season.start);
      }

      function renderCalendarMonth() {
        const { year, dayOfYear } = calendarState;

        // Update season display
        const season = getSeasonForDay(dayOfYear);
        const seasonIdx = KERBOL_SEASONS.indexOf(season);
        calSeasonDisplay.textContent = season.name;
        calSeasonDisplay.style.color = season.color;

        // Update season progress bar
        const progress = getSeasonProgress(dayOfYear);
        const bars = calSeasonBar.querySelectorAll('.cal-season-bar');
        bars.forEach((bar, idx) => {
          bar.classList.toggle('active', idx === seasonIdx);
          if (idx === seasonIdx) {
            bar.style.width = (progress * 100) + '%';
          } else {
            bar.style.width = '0%';
          }
        });

        // Clear and rebuild grid
        calMonthGrid.innerHTML = '';

        // ONLY show current season's days (not all 425)
        const seasonStart = season.start;
        const seasonEnd = (seasonIdx < KERBOL_SEASONS.length - 1)
          ? KERBOL_SEASONS[seasonIdx + 1].start
          : YEAR_DAYS;
        const seasonDays = seasonEnd - seasonStart; // ~106 days per season

        // Headers (1-7)
        for (let d = 1; d <= 7; d++) {
          const hdr = document.createElement('div');
          hdr.className = 'cal-day-header';
          hdr.textContent = d;
          calMonthGrid.appendChild(hdr);
        }

        // Show current season's days in grid (7 columns)
        const totalCells = Math.ceil(seasonDays / 7) * 7;
        for (let i = 0; i < totalCells; i++) {
          const dayNum = i + 1;
          const cell = document.createElement('div');
          cell.className = 'cal-day';

          if (dayNum <= seasonDays) {
            const seasonDayIndex = dayNum - 1; // 0-based within season
            const actualDayOfYear = seasonStart + seasonDayIndex;
            const isSelected = actualDayOfYear === dayOfYear && year === calendarState.year;

            if (isSelected) cell.classList.add('selected');
            cell.textContent = actualDayOfYear + 1;
            cell.onclick = () => {
              calendarState.dayOfYear = actualDayOfYear;
              renderCalendarMonth();
            };
          } else {
            cell.classList.add('empty');
          }

          calMonthGrid.appendChild(cell);
        }
      }


      function openCalendar() {
        // Capture year + day-of-year from current UT; reset time to midnight
        const totalSecondsInYear = YEAR_DAYS * DAY_SEC;
        const calUT = UT + CALENDAR_OFFSET_SEC;
        calendarState.year = Math.floor(calUT / totalSecondsInYear);
        const remainingSeconds = calUT % totalSecondsInYear;
        calendarState.dayOfYear = Math.floor(remainingSeconds / DAY_SEC);
        calendarState.hour = 0;
        calendarState.min = 0;
        calendarState.sec = 0;

        // Populate fields
        calYearInput.value = calendarState.year.toString();
        calHour.value = '00';
        calMin.value = '00';
        calSec.value = '00';

        // Render
        renderCalendarMonth();

        // Show modal
        calModal.classList.add('open');
      }

      function closeCalendar() {
        calModal.classList.remove('open');
      }

      function applyCalendar() {
        // Validate and apply
        let year = parseInt(calYearInput.value) || 0;
        year = Math.max(0, Math.min(999, year));

        let hour = parseInt(calHour.value) || 0;
        hour = Math.max(0, Math.min(6, hour));

        let min = parseInt(calMin.value) || 0;
        min = Math.max(0, Math.min(59, min));

        let sec = parseInt(calSec.value) || 0;
        sec = Math.max(0, Math.min(59, sec));

        // Calculate UT
        const totalSecondsInYear = YEAR_DAYS * DAY_SEC;
        UT = year * totalSecondsInYear + calendarState.dayOfYear * DAY_SEC + hour * 3600 + min * 60 + sec - CALENDAR_OFFSET_SEC;

        // Update UT display
        document.getElementById('utValue').textContent = utToDateString(UT);

        // Recalculate transfer if active
        if (currentResult) {
          currentResult = computeTransfer(currentResult.originSelected.name, currentResult.destSelected.name);
          renderTransferResults();
        }

        closeCalendar();
      }

      // Event listeners
      calOpenBtn.onclick = openCalendar;
      calCloseBtn.onclick = closeCalendar;
      calCancelBtn.onclick = closeCalendar;
      calApplyBtn.onclick = applyCalendar;

      // Season navigation
      calSeasonPrev.onclick = () => {
        calendarState.dayOfYear -= 106; // Move back by one season
        if (calendarState.dayOfYear < 0) {
          calendarState.dayOfYear = 0;
        }
        renderCalendarMonth();
      };

      calSeasonNext.onclick = () => {
        calendarState.dayOfYear += 106; // Move forward by one season
        if (calendarState.dayOfYear >= YEAR_DAYS) {
          calendarState.dayOfYear = YEAR_DAYS - 1;
        }
        renderCalendarMonth();
      };

      // Year field - only allow numbers, no spinners
      calYearInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        if (e.target.value.length > 3) {
          e.target.value = e.target.value.slice(0, 3);
        }
      });

      // Time fields - digits only + per-field clamp
      function clampField(field, maxVal) {
        const v = field.value.replace(/[^0-9]/g, '');
        if (v === '') { field.value = ''; return; }
        const n = parseInt(v, 10);
        if (n > maxVal) field.value = maxVal.toString();
        else field.value = v;
      }
      calHour.addEventListener('input', () => {
        const before = calHour.value;
        clampField(calHour, 6);
        // When hour reaches 6, reset min and sec to 0
        if (before !== '6' && calHour.value === '6') {
          calMin.value = '00';
          calSec.value = '00';
        }
      });
      calMin.addEventListener('input', () => clampField(calMin, 59));
      calSec.addEventListener('input', () => clampField(calSec, 59));

      // Close modal on overlay click
      calModal.addEventListener('click', (e) => {
        if (e.target === calModal) closeCalendar();
      });

      // Close modal on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && calModal.classList.contains('open')) {
          closeCalendar();
        }
      });

