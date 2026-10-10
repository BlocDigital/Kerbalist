    /* ---------- Bug report screenshots ----------
       Option 1: full-viewport capture of the app (auto, copied to clipboard)
       Option 2: user-supplied image (browse / drag & drop / paste)               */
    const BUG_SHOT_MAX_BYTES = 5 * 1024 * 1024;
    const BUG_SHOT_NOTE_DEFAULT = 'Option 2 replaces Option 1 · PNG, JPG, GIF, WebP · max 5MB';
    let bugAutoShot = null;      // { blob, url }
    let bugAutoState = 'idle';   // idle | capturing | ready | failed | removed
    let bugAutoCopied = false;   // was Option 1 copied to the clipboard when the modal opened?
    let bugAutoToken = 0;        // invalidates stale captures
    let bugAutoDone = null;      // promise resolving when the current capture settles
    let bugCustomShot = null;    // { blob, url, name }
    let bugNoteTimer = null;

    function canvasToPngBlob(canvas) {
      return new Promise((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas export failed')), 'image/png'));
    }

    function loadImageFromUrl(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image decode failed'));
        img.src = url;
      });
    }

    // The async clipboard API only accepts image/png, so normalise JPG/GIF/WebP first.
    async function blobToPngBlob(blob) {
      if (blob.type === 'image/png') return blob;
      const url = URL.createObjectURL(blob);
      try {
        const img = await loadImageFromUrl(url);
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        return await canvasToPngBlob(c);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    function withTimeout(promise, ms, label) {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(label + ' timed out')), ms);
        promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
      });
    }

    // html2canvas is only fetched when a bug report is opened, so the app stays fully offline-capable.
    function loadHtml2Canvas() {
      if (window.html2canvas) return Promise.resolve(window.html2canvas);
      if (loadHtml2Canvas._p) return loadHtml2Canvas._p;
      loadHtml2Canvas._p = new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        el.onload = () => window.html2canvas ? resolve(window.html2canvas) : reject(new Error('html2canvas missing'));
        el.onerror = () => { loadHtml2Canvas._p = null; reject(new Error('html2canvas failed to load')); };
        document.head.appendChild(el);
      });
      return loadHtml2Canvas._p;
    }

    async function captureAppViewport() {
      // A WebGL canvas can only be read in the same tick as a render, so grab it BEFORE any await.
      let webgl = null;
      try {
        if (typeof window.__kerbalistSnapshotWebGL === 'function') webgl = window.__kerbalistSnapshotWebGL();
      } catch (e) { /* fall through without a map snapshot */ }

      const vw = window.innerWidth, vh = window.innerHeight;
      try {
        const h2c = await loadHtml2Canvas();
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#060a11';
        const canvas = await h2c(document.documentElement, {
          backgroundColor: bg,
          x: window.scrollX, y: window.scrollY,
          width: vw, height: vh, windowWidth: vw, windowHeight: vh,
          scale: Math.min(window.devicePixelRatio || 1, 1.5),
          useCORS: true,
          logging: false,
          ignoreElements: el => el.id === 'bugReportOverlay',   // never capture the report form itself
          onclone: doc => {
            // html2canvas can't clone a WebGL canvas, so swap in the snapshot taken above.
            if (!webgl) return;
            const live = doc.getElementById(webgl.id);
            if (!live || !live.parentNode) return;
            const img = doc.createElement('img');
            img.id = live.id;
            img.className = live.className;
            img.setAttribute('style', live.getAttribute('style') || '');
            img.style.objectFit = 'fill';
            img.src = webgl.dataUrl;
            live.parentNode.replaceChild(img, live);
          }
        });
        return await canvasToPngBlob(canvas);
      } catch (err) {
        console.warn('[Kerbalist] Full-viewport capture failed, falling back to map only:', err);
        if (!webgl) throw err;
        const img = await loadImageFromUrl(webgl.dataUrl);
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        return canvasToPngBlob(c);
      }
    }

    async function copyImageToClipboard(blobOrPromise) {
      try {
        if (!navigator.clipboard || !window.ClipboardItem) return false;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobOrPromise })]);
        return true;
      } catch (e) {
        console.warn('[Kerbalist] Clipboard write failed:', e);
        return false;
      }
    }

    function releaseAutoShot() {
      if (bugAutoShot) URL.revokeObjectURL(bugAutoShot.url);
      bugAutoShot = null;
      bugAutoCopied = false;
    }

    function releaseCustomShot() {
      if (bugCustomShot) URL.revokeObjectURL(bugCustomShot.url);
      bugCustomShot = null;
    }

    // Must be called from a click handler so the clipboard write has user activation.
    function startAutoShot(copyToClipboard) {
      const token = ++bugAutoToken;
      releaseAutoShot();
      bugAutoState = 'capturing';
      refreshShotUI();

      const capture = withTimeout(captureAppViewport(), 20000, 'Capture');
      // Passing the promise straight into ClipboardItem keeps the user gesture alive while we render.
      const copied = copyToClipboard ? copyImageToClipboard(capture) : Promise.resolve(false);

      bugAutoDone = Promise.all([capture.then(b => b, () => null), copied]).then(([blob, wasCopied]) => {
        if (token !== bugAutoToken) return;   // superseded by a retake / remove / re-open
        if (blob) {
          bugAutoShot = { blob, url: URL.createObjectURL(blob) };
          bugAutoCopied = wasCopied;
          bugAutoState = 'ready';
        } else {
          bugAutoState = 'failed';
        }
        refreshShotUI();
      });
      return bugAutoDone;
    }

    function removeAutoShot() {
      bugAutoToken++;
      releaseAutoShot();
      bugAutoState = 'removed';
      refreshShotUI();
    }

    function getActiveBugShot() {
      if (bugCustomShot) return bugCustomShot;
      if (bugAutoState === 'ready' && bugAutoShot) return bugAutoShot;
      return null;
    }

    function refreshShotUI() {
      const autoCard = document.getElementById('bugShotAuto');
      const customCard = document.getElementById('bugShotCustom');
      if (!autoCard || !customCard) return;
      const thumb = document.getElementById('bugShotAutoThumb');
      const img = document.getElementById('bugShotAutoImg');
      const status = document.getElementById('bugShotAutoStatus');
      const retake = document.getElementById('bugShotRetakeBtn');
      const remove = document.getElementById('bugShotRemoveBtn');
      const usingCustom = !!bugCustomShot;
      const ready = bugAutoState === 'ready' && !!bugAutoShot;

      autoCard.classList.toggle('active', ready && !usingCustom);
      autoCard.classList.toggle('inactive', usingCustom);
      customCard.classList.toggle('active', usingCustom);

      thumb.classList.toggle('loading', bugAutoState === 'capturing');
      thumb.classList.toggle('has-img', ready);
      if (ready) img.src = bugAutoShot.url; else img.removeAttribute('src');

      let text = '', cls = '';
      if (bugAutoState === 'capturing') {
        text = 'Capturing full app view…';
      } else if (ready) {
        if (usingCustom) { text = 'Ready — not used, Option 2 is selected.'; }
        else if (bugAutoCopied) { text = '✓ Ready — copied to clipboard'; cls = 'ok'; }
        else { text = '✓ Ready — will be copied to clipboard when you open the issue'; cls = 'ok'; }
      } else if (bugAutoState === 'failed') {
        text = '⚠ Couldn’t capture the app view — use Option 2 instead.'; cls = 'err';
      } else if (bugAutoState === 'removed') {
        text = 'Removed — no app screenshot will be attached.';
      }
      status.textContent = text;
      status.className = 'bug-shot-status' + (cls ? ' ' + cls : '');

      retake.disabled = bugAutoState === 'capturing';
      retake.textContent = (ready || bugAutoState === 'capturing') ? 'Retake' : (bugAutoState === 'removed' ? 'Capture' : 'Try again');
      remove.disabled = !ready;

      // Option 2 preview
      const preview = document.getElementById('bugScreenshotPreview');
      const label = document.getElementById('bugScreenshotLabel');
      if (usingCustom) {
        document.getElementById('bugScreenshotImg').src = bugCustomShot.url;
        label.textContent = `✓ ${bugCustomShot.name}`;
        preview.style.display = 'flex';
      } else {
        document.getElementById('bugScreenshotImg').removeAttribute('src');
        label.textContent = '📎 Click, drag & drop, or paste an image';
        preview.style.display = 'none';
      }
    }

    function showShotNote(msg) {
      const note = document.getElementById('bugShotNote');
      if (!note) return;
      clearTimeout(bugNoteTimer);
      note.textContent = msg;
      note.classList.add('error');
      bugNoteTimer = setTimeout(() => {
        note.textContent = BUG_SHOT_NOTE_DEFAULT;
        note.classList.remove('error');
      }, 5000);
    }

    // Shared by the file picker, drag & drop and paste.
    function processScreenshotFile(file) {
      if (!file) {
        showShotNote('Couldn’t read that image — save it to your computer and upload it, or copy it and press Ctrl+V.');
        return;
      }
      if (!file.type || !file.type.startsWith('image/')) {
        showShotNote('That file isn’t an image (PNG, JPG, GIF or WebP).');
        return;
      }
      if (file.size > BUG_SHOT_MAX_BYTES) {
        showShotNote('Image is too large — max 5MB.');
        return;
      }
      blobToPngBlob(file).then(png => {
        releaseCustomShot();
        bugCustomShot = { blob: png, url: URL.createObjectURL(png), name: file.name || 'pasted-image.png' };
        refreshShotUI();
      }).catch(() => showShotNote('Couldn’t decode that image — try a PNG or JPG.'));
    }

    function handleScreenshotSelect(event) {
      const input = event.target;
      const file = input.files && input.files[0];
      input.value = '';   // allow picking the same file again after Clear
      if (file) processScreenshotFile(file);
    }

    function clearScreenshot() {
      releaseCustomShot();
      const input = document.getElementById('bugScreenshot');
      if (input) input.value = '';
      refreshShotUI();
    }

