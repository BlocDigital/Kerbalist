    function showBugReportModal() {
      const overlay = document.getElementById("bugReportOverlay");
      if (overlay) {
        // Set browser info
        document.getElementById("bugBrowserInfo").textContent = getBrowserInfo();
        document.getElementById("bugTimestamp").textContent = new Date().toLocaleString();
        // Clear previous input
        document.getElementById("bugTitle").value = "";
        document.getElementById("bugDescription").value = "";
        clearScreenshot();
        startAutoShot(true);   // capture + copy before the form covers the app
        refreshBugCaptcha();
        overlay.classList.add("open");
      }
    }

    /* ---------- Bug report captcha ("Verify Signal") ---------- */
    let bugCaptchaCode = '';
    let bugCaptchaVerified = false;

    function refreshBugCaptcha() {
      // Ambiguous glyphs (0/O, 1/I/L) excluded
      const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      const rnd = new Uint32Array(5);
      crypto.getRandomValues(rnd);
      bugCaptchaCode = Array.from(rnd, n => alphabet[n % alphabet.length]).join('');
      bugCaptchaVerified = false;

      const box = document.getElementById('bugCaptcha');
      const input = document.getElementById('bugCaptchaInput');
      const status = document.getElementById('bugCaptchaStatus');
      const submit = document.getElementById('bugSubmitBtn');
      const refresh = document.getElementById('bugCaptchaRefresh');
      if (!box) return;

      box.classList.remove('verified', 'failed');
      input.value = '';
      input.disabled = false;
      status.textContent = 'Type the 5 characters shown above.';
      if (submit) submit.disabled = true;
      if (refresh) {
        refresh.classList.remove('spin');
        void refresh.offsetWidth; // restart animation
        refresh.classList.add('spin');
      }
      drawBugCaptcha();
    }

    function drawBugCaptcha() {
      const canvas = document.getElementById('bugCaptchaCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height; // 400x128 backing store, shown at 200x64
      const css = getComputedStyle(document.documentElement);
      const cyan = css.getPropertyValue('--cyan').trim() || '#4fe0e8';
      const amber = css.getPropertyValue('--amber').trim() || '#ffb454';
      const dim = css.getPropertyValue('--cyan-dim').trim() || '#1f5d63';
      const mono = css.getPropertyValue('--font-mono').trim() || 'monospace';
      const rand = (a, b) => a + Math.random() * (b - a);

      ctx.clearRect(0, 0, W, H);

      // Starfield noise
      for (let i = 0; i < 70; i++) {
        ctx.globalAlpha = rand(0.15, 0.6);
        ctx.fillStyle = Math.random() < 0.2 ? amber : cyan;
        const s = rand(1, 2.6);
        ctx.fillRect(rand(0, W), rand(0, H), s, s);
      }

      // Distractor orbit ellipses
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = dim;
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = rand(0.5, 0.9);
        ctx.beginPath();
        ctx.ellipse(rand(60, W - 60), rand(30, H - 30), rand(50, 130), rand(14, 44),
          rand(0, Math.PI), rand(0, Math.PI), rand(Math.PI * 1.2, Math.PI * 2));
        ctx.stroke();
      }

      // Characters — jittered, rotated
      ctx.globalAlpha = 1;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      const step = W / (bugCaptchaCode.length + 1);
      for (let i = 0; i < bugCaptchaCode.length; i++) {
        ctx.save();
        ctx.translate(step * (i + 1) + rand(-6, 6), H / 2 + rand(-12, 12));
        ctx.rotate(rand(-0.42, 0.42));
        ctx.font = `700 ${Math.round(rand(50, 62))}px ${mono}`;
        ctx.fillStyle = i % 2 ? cyan : amber;
        ctx.shadowColor = i % 2 ? cyan : amber;
        ctx.shadowBlur = 8;
        ctx.fillText(bugCaptchaCode[i], 0, 0);
        ctx.restore();
      }

      // Strike-through trajectory arcs over the text
      ctx.shadowBlur = 0;
      for (let i = 0; i < 2; i++) {
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = i ? amber : cyan;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rand(0, 40), rand(20, H - 20));
        ctx.bezierCurveTo(rand(80, 160), rand(0, H), rand(240, 320), rand(0, H), rand(360, W), rand(20, H - 20));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function checkBugCaptcha() {
      if (bugCaptchaVerified) return;
      const box = document.getElementById('bugCaptcha');
      const input = document.getElementById('bugCaptchaInput');
      const status = document.getElementById('bugCaptchaStatus');
      const submit = document.getElementById('bugSubmitBtn');
      box.classList.remove('failed');

      const val = input.value.trim().toUpperCase();
      input.value = val;
      if (val.length < bugCaptchaCode.length) {
        status.textContent = 'Type the 5 characters shown above.';
        return;
      }

      if (val === bugCaptchaCode) {
        bugCaptchaVerified = true;
        box.classList.add('verified');
        input.disabled = true;
        status.textContent = '✓ Signal verified';
        if (submit) submit.disabled = false;
      } else {
        // Wrong code: flag it, then issue a fresh one
        refreshBugCaptcha();
        void box.offsetWidth;
        box.classList.add('failed');
        status.textContent = '✗ Code mismatch — new code generated.';
      }
    }

