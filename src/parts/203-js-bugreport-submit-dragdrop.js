    function hideBugReportModal() {
      const overlay = document.getElementById("bugReportOverlay");
      if (overlay) overlay.classList.remove("open");
    }

    function getBrowserInfo() {
      const ua = navigator.userAgent;
      if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edge") === -1) return "Chrome";
      if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) return "Safari";
      if (ua.indexOf("Edge") > -1) return "Edge";
      if (ua.indexOf("Firefox") > -1) return "Firefox";
      return "Other";
    }

    async function submitBugReport() {
      const title = document.getElementById("bugTitle").value.trim();
      const description = document.getElementById("bugDescription").value.trim();

      if (!title) {
        alert("Please enter a bug title");
        return;
      }

      if (!bugCaptchaVerified) {
        document.getElementById('bugCaptchaInput').focus();
        return;
      }

      const submitBtn = document.getElementById('bugSubmitBtn');
      if (submitBtn.dataset.busy) return;
      submitBtn.dataset.busy = '1';
      const submitLabel = submitBtn.textContent;

      try {
        // If Option 1 is still rendering and no custom image was chosen, wait for it.
        if (!bugCustomShot && bugAutoState === 'capturing' && bugAutoDone) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Preparing screenshot…';
          await bugAutoDone;
        }

        // Re-copy right now so the clipboard holds the image we're actually attaching.
        const shot = getActiveBugShot();
        const copied = shot ? await copyImageToClipboard(shot.blob) : false;

        // Build GitHub issue URL (images can't go in the URL — the clipboard carries them instead)
        const gitHubRepo = "https://github.com/BlocDigital/Kerbalist";
        const browserInfo = getBrowserInfo();
        const timestamp = new Date().toISOString();

        let issueBody = `## Description\n${description}\n\n`;

        if (shot && copied) {
          issueBody += `## Screenshot\n_Screenshot copied to your clipboard — click here and press Ctrl+V (Cmd+V on Mac) to attach it._\n\n`;
        } else if (shot) {
          issueBody += `## Screenshot\n_A screenshot was prepared but couldn't be copied automatically — please attach one manually._\n\n`;
        }

        issueBody += `## Environment\n`;
        issueBody += `- **App Version:** v4.1\n`;
        issueBody += `- **Browser:** ${browserInfo}\n`;
        issueBody += `- **Reported:** ${timestamp}\n`;

        const issueUrl = `${gitHubRepo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(issueBody)}`;

        const win = window.open(issueUrl, "_blank");
        if (win) {
          hideBugReportModal();
        } else {
          // Popup blocked — give the user a link they can click themselves
          const status = document.getElementById('bugCaptchaStatus');
          status.textContent = '';
          const a = document.createElement('a');
          a.href = issueUrl;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'Popup blocked — click here to open the GitHub issue';
          a.style.color = 'var(--cyan)';
          status.appendChild(a);
        }
      } finally {
        delete submitBtn.dataset.busy;
        submitBtn.textContent = submitLabel;
        submitBtn.disabled = !bugCaptchaVerified;
      }
    }

    // Close modals on Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        hideChangelog();
        hideBugReportModal();
      }
    });

    // Drag & drop + paste for screenshots.
    // Listeners live on the WINDOW (capture phase) while the modal is open. Previously only the small dashed
    // label handled drops, so dropping anywhere else made the browser navigate to the image in a new tab.
    (function initBugShotDropAndPaste() {
      const overlayEl = () => document.getElementById('bugReportOverlay');
      const isOpen = () => { const o = overlayEl(); return !!o && o.classList.contains('open'); };
      const droppable = e => {
        const types = e.dataTransfer && e.dataTransfer.types ? Array.from(e.dataTransfer.types) : [];
        return types.indexOf('Files') !== -1 || types.indexOf('text/uri-list') !== -1;
      };
      const setActive = on => { const o = overlayEl(); if (o) o.classList.toggle('drag-active', on); };
      let depth = 0;

      window.addEventListener('dragenter', e => {
        if (!isOpen() || !droppable(e)) return;
        e.preventDefault();
        depth++;
        setActive(true);
      }, true);

      window.addEventListener('dragover', e => {
        if (!isOpen() || !droppable(e)) return;
        e.preventDefault();                       // required, otherwise the browser treats the page as a non-target
        e.dataTransfer.dropEffect = 'copy';
      }, true);

      window.addEventListener('dragleave', e => {
        if (!isOpen() || !droppable(e)) return;
        depth = Math.max(0, depth - 1);
        if (!depth) setActive(false);
      }, true);

      window.addEventListener('drop', e => {
        if (!isOpen() || !droppable(e)) return;
        e.preventDefault();                       // stops the browser opening the image in a new tab
        e.stopPropagation();
        depth = 0;
        setActive(false);

        const dt = e.dataTransfer;
        let file = null;
        if (dt.files && dt.files.length) {
          file = Array.from(dt.files).find(f => f.type && f.type.startsWith('image/')) || dt.files[0];
        } else if (dt.items) {
          const it = Array.from(dt.items).find(i => i.kind === 'file' && i.type.startsWith('image/'));
          file = it ? it.getAsFile() : null;
        }
        processScreenshotFile(file);
      }, true);

      window.addEventListener('dragend', () => { depth = 0; setActive(false); }, true);

      // Ctrl+V / Cmd+V of an image anywhere in the modal
      document.addEventListener('paste', e => {
        if (!isOpen() || !e.clipboardData) return;
        const item = Array.from(e.clipboardData.items || []).find(i => i.kind === 'file' && i.type.startsWith('image/'));
        if (!item) return;                        // plain text paste into the inputs keeps working
        e.preventDefault();
        processScreenshotFile(item.getAsFile());
      });
    })();
