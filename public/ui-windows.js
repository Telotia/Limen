(function initTelotiaWindows() {
  var zoomLevels = [0.9, 1, 1.15, 1.3, 1.5];
  var targetSpecs = [
    { selector: '.home-hero .glow-wrap', key: 'hero-ledger', label: 'Evidence ledger', minWidth: 320, minHeight: 180 },
    { selector: '.home-path .proof-ledger', key: 'proof-path', label: 'Proof path', minWidth: 360, minHeight: 220 },
    { selector: '.workspace-window', key: 'workspace', label: 'Review workspace', minWidth: 560, minHeight: 320, os: true },
    { selector: '#demo .glow-wrap', key: 'demo', label: 'Interactive demo', minWidth: 420, minHeight: 280 },
    { selector: '.process-window', key: 'process', label: 'Process view', minWidth: 420, minHeight: 220 },
    { selector: '.particle-lifecycle-panel', key: 'particle-lifecycle', label: 'Particle lifecycle', minWidth: 420, minHeight: 300 },
    { selector: '#tlSpikeWrap', key: 'verdict', label: 'Verdict space', minWidth: 360, minHeight: 220 }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function requestCompactNavigation(reason) {
    window.dispatchEvent(new CustomEvent('telotia:navigation-collapse', {
      detail: { reason: reason || 'ui-window-interaction' }
    }));
  }

  function makeButton(text, label, action) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui-window-tool-button';
    button.dataset.windowAction = action;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.textContent = text;
    return button;
  }

  function ensureClip(frame) {
    var clip = frame.querySelector(':scope > .ui-window-clip');
    if (!clip) {
      clip = document.createElement('div');
      clip.className = 'ui-window-clip';
      Array.prototype.slice.call(frame.childNodes).forEach(function (child) {
        if (child.nodeType === 1 && child.classList.contains('ink-capillary-layer')) return;
        clip.appendChild(child);
      });
      frame.insertBefore(clip, frame.firstChild);
    }
    return clip;
  }

  function prepareWorkspaceNativeControls(clip) {
    var controlGroup = clip.querySelector('.window-controls');
    if (!controlGroup) return [];
    controlGroup.removeAttribute('aria-hidden');
    return Array.prototype.slice.call(controlGroup.children).map(function (node) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'workspace-native-control';
      node.replaceWith(button);
      return button;
    });
  }

  function setWorkspaceOS(frame, os, controls, nativeControls) {
    frame.dataset.windowOs = os;
    controls.forEach(function (button) {
      var active = button.dataset.windowOs === os;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    var actions = os === 'windows' ? ['minimize', 'maximize', 'close'] : ['close', 'minimize', 'maximize'];
    var labels = { close: 'Close TELOTIA', minimize: 'Minimize TELOTIA', maximize: 'Maximize or restore TELOTIA' };
    nativeControls.forEach(function (button, index) {
      var action = actions[index];
      button.className = 'workspace-native-control window-control-' + action;
      button.dataset.nativeWindowAction = action;
      button.setAttribute('aria-label', labels[action]);
      button.title = labels[action];
    });
    try { sessionStorage.setItem('telotia-window-os', os); } catch (error) {}
  }

  function enhance(frame, spec, index) {
    if (frame.dataset.windowControlsReady === 'true') return;
    frame.dataset.windowControlsReady = 'true';
    frame.dataset.windowKey = spec.key + '-' + index;
    frame.classList.add('ui-manipulable-window');
    frame.setAttribute('aria-label', frame.getAttribute('aria-label') || spec.label);

    var clip = ensureClip(frame);
    var nativeControls = spec.os ? prepareWorkspaceNativeControls(clip) : [];
    var viewport = document.createElement('div');
    viewport.className = 'ui-window-viewport';
    clip.parentNode.insertBefore(viewport, clip);
    viewport.appendChild(clip);

    var toolbar = document.createElement('div');
    toolbar.className = 'ui-window-tools';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', spec.label + ' controls');

    if (spec.os) {
      var styleGroup = document.createElement('span');
      styleGroup.className = 'ui-window-style-group';
      styleGroup.setAttribute('aria-label', 'Window style');
      var macButton = makeButton('macOS', 'Use macOS window style', 'os');
      var windowsButton = makeButton('Windows', 'Use Windows window style', 'os');
      macButton.dataset.windowOs = 'mac';
      windowsButton.dataset.windowOs = 'windows';
      styleGroup.appendChild(macButton);
      styleGroup.appendChild(windowsButton);
      toolbar.appendChild(styleGroup);
      toolbar.appendChild(document.createElement('span')).className = 'ui-window-tool-divider';
      var storedOS = 'mac';
      try { storedOS = sessionStorage.getItem('telotia-window-os') || 'mac'; } catch (error) {}
      setWorkspaceOS(frame, storedOS === 'windows98' || storedOS === 'windows' ? 'windows' : 'mac', [macButton, windowsButton], nativeControls);
      styleGroup.addEventListener('click', function (event) {
        var button = event.target.closest('[data-window-os]');
        if (!button) return;
        requestCompactNavigation('window-style');
        setWorkspaceOS(frame, button.dataset.windowOs, [macButton, windowsButton], nativeControls);
      });
    }

    var zoomLabel = document.createElement('span');
    zoomLabel.className = 'ui-window-tool-label';
    zoomLabel.textContent = 'Zoom';
    toolbar.appendChild(zoomLabel);
    var zoomOut = makeButton('\u2212', 'Zoom out', 'zoom-out');
    var zoomIn = makeButton('+', 'Zoom in', 'zoom-in');
    var fit = makeButton('Fit', 'Fit window to content', 'fit');
    fit.classList.add('ui-window-fit');
    fit.disabled = true;
    toolbar.appendChild(zoomOut);
    toolbar.appendChild(zoomIn);
    toolbar.appendChild(fit);
    frame.appendChild(toolbar);

    var live = document.createElement('span');
    live.className = 'ui-window-live';
    live.setAttribute('aria-live', 'polite');
    frame.appendChild(live);

    var zoomIndex = 1;
    function applyZoom(nextIndex) {
      zoomIndex = clamp(nextIndex, 0, zoomLevels.length - 1);
      var zoom = zoomLevels[zoomIndex];
      clip.style.zoom = String(zoom);
      clip.style.removeProperty('width');
      frame.dataset.windowZoom = String(Math.round(zoom * 100));
      zoomOut.disabled = zoomIndex === 0;
      zoomIn.disabled = zoomIndex === zoomLevels.length - 1;
      updateFitState();
      live.textContent = spec.label + ' zoom ' + Math.round(zoom * 100) + ' percent';
    }
    applyZoom(zoomIndex);

    toolbar.addEventListener('click', function (event) {
      var button = event.target.closest('[data-window-action]');
      if (!button || button.disabled) return;
      requestCompactNavigation(button.dataset.windowAction);
      var action = button.dataset.windowAction;
      if (action === 'zoom-out') applyZoom(zoomIndex - 1);
      if (action === 'zoom-in') applyZoom(zoomIndex + 1);
      if (action === 'fit') {
        resetSize();
        applyZoom(1);
      }
    });

    function makeResizeHandle(xDirection, yDirection, className, orientation, label) {
      var resizeHandle = document.createElement('div');
      resizeHandle.className = 'ui-window-resize-handle ' + className;
      resizeHandle.dataset.resizeX = String(xDirection);
      resizeHandle.dataset.resizeY = String(yDirection);
      resizeHandle.tabIndex = 0;
      resizeHandle.setAttribute('role', 'separator');
      resizeHandle.setAttribute('aria-orientation', orientation);
      resizeHandle.setAttribute('aria-label', label + '. Use arrow keys or drag.');
      resizeHandle.title = label + '. Double-click to reset.';
      frame.appendChild(resizeHandle);
      return resizeHandle;
    }
    var resizeHandles = [
      makeResizeHandle(-1, 0, 'ui-window-resize-left', 'vertical', 'Resize ' + spec.label + ' from left edge'),
      makeResizeHandle(1, 0, 'ui-window-resize-right', 'vertical', 'Resize ' + spec.label + ' from right edge'),
      makeResizeHandle(0, -1, 'ui-window-resize-top', 'horizontal', 'Resize ' + spec.label + ' from top edge'),
      makeResizeHandle(0, 1, 'ui-window-resize-bottom', 'horizontal', 'Resize ' + spec.label + ' from bottom edge'),
      makeResizeHandle(-1, -1, 'ui-window-resize-top-left ui-window-resize-corner', 'horizontal', 'Resize ' + spec.label + ' from top left corner'),
      makeResizeHandle(1, -1, 'ui-window-resize-top-right ui-window-resize-corner', 'horizontal', 'Resize ' + spec.label + ' from top right corner'),
      makeResizeHandle(-1, 1, 'ui-window-resize-bottom-left ui-window-resize-corner', 'horizontal', 'Resize ' + spec.label + ' from bottom left corner'),
      makeResizeHandle(1, 1, 'ui-window-resize-bottom-right ui-window-resize-corner', 'horizontal', 'Resize ' + spec.label + ' from bottom right corner')
    ];

    var resizeState = null;
    var pendingFrame = 0;
    var pendingSize = null;

    function sizeLimits(rect, xDirection) {
      var currentRect = rect || frame.getBoundingClientRect();
      var viewportMargin = 12;
      var viewportWidth = Math.max(280, window.innerWidth - viewportMargin * 2);
      var maxWidth = viewportWidth;
      if (xDirection > 0) maxWidth = window.innerWidth - viewportMargin - currentRect.left;
      if (xDirection < 0) maxWidth = currentRect.right - viewportMargin;
      return {
        minWidth: Math.min(spec.minWidth, viewportWidth),
        maxWidth: Math.max(280, maxWidth),
        minHeight: spec.minHeight,
        maxHeight: Math.max(spec.minHeight, Math.min(1200, window.innerHeight * 1.35))
      };
    }

    var offsetX = 0;
    var offsetY = 0;

    function writeSize() {
      pendingFrame = 0;
      if (!pendingSize) return;
      frame.style.width = pendingSize.width + 'px';
      frame.style.height = pendingSize.height + 'px';
      frame.style.translate = offsetX + 'px ' + offsetY + 'px';
      var resizedRect = frame.getBoundingClientRect();
      offsetX += pendingSize.left - resizedRect.left;
      offsetY += pendingSize.top - resizedRect.top;
      frame.style.translate = Math.round(offsetX) + 'px ' + Math.round(offsetY) + 'px';
      pendingSize = null;
    }

    function queueSize(width, height, left, top) {
      pendingSize = { width: width, height: height, left: left, top: top };
      if (!pendingFrame) pendingFrame = requestAnimationFrame(writeSize);
    }

    function beginResize(event) {
      if (window.matchMedia('(max-width: 820px)').matches) return;
      event.preventDefault();
      requestCompactNavigation('window-resize');
      var rect = frame.getBoundingClientRect();
      var xDirection = Number(event.currentTarget.dataset.resizeX);
      var limits = sizeLimits(rect, xDirection);
      resizeState = {
        startX: event.clientX,
        startY: event.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
        startLeft: rect.left,
        startTop: rect.top,
        xDirection: xDirection,
        yDirection: Number(event.currentTarget.dataset.resizeY),
        limits: limits
      };
      frame.classList.add('is-window-resizing', 'has-user-window-size');
      updateFitState();
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    function moveResize(event) {
      if (!resizeState) return;
      var width = resizeState.startWidth;
      var height = resizeState.startHeight;
      if (resizeState.xDirection) {
        width = clamp(resizeState.startWidth + resizeState.xDirection * (event.clientX - resizeState.startX), resizeState.limits.minWidth, resizeState.limits.maxWidth);
      }
      if (resizeState.yDirection) {
        height = clamp(resizeState.startHeight + resizeState.yDirection * (event.clientY - resizeState.startY), resizeState.limits.minHeight, resizeState.limits.maxHeight);
      }
      var left = resizeState.xDirection < 0 ? resizeState.startLeft + resizeState.startWidth - width : resizeState.startLeft;
      var top = resizeState.yDirection < 0 ? resizeState.startTop + resizeState.startHeight - height : resizeState.startTop;
      queueSize(Math.round(width), Math.round(height), left, top);
      live.textContent = spec.label + ' ' + Math.round(width) + ' by ' + Math.round(height) + ' pixels';
    }

    function endResize(event) {
      if (!resizeState) return;
      resizeState = null;
      frame.classList.remove('is-window-resizing');
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }

    function resetSize() {
      if (pendingFrame) cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
      pendingSize = null;
      resizeState = null;
      frame.style.removeProperty('width');
      frame.style.removeProperty('height');
      frame.style.removeProperty('translate');
      offsetX = 0;
      offsetY = 0;
      frame.classList.remove('is-window-resizing', 'has-user-window-size', 'has-user-window-position');
      updateFitState();
      live.textContent = spec.label + ' size reset';
    }

    function updateFitState() {
      fit.disabled = !frame.classList.contains('has-user-window-size') && !frame.classList.contains('has-user-window-position') && zoomIndex === 1;
    }

    if (spec.os) {
      var launcher = document.createElement('div');
      launcher.className = 'workspace-app-launcher';
      launcher.tabIndex = 0;
      launcher.hidden = true;
      launcher.setAttribute('role', 'button');
      launcher.setAttribute('aria-label', 'Open TELOTIA. Double-click to open.');
      var launcherIcon = document.createElement('img');
      launcherIcon.src = '/telotia-mark-tricolor-transparent.webp';
      launcherIcon.alt = '';
      launcherIcon.width = 76;
      launcherIcon.height = 76;
      var launcherIconShell = document.createElement('span');
      launcherIconShell.className = 'workspace-app-icon';
      launcherIconShell.setAttribute('aria-hidden', 'true');
      launcherIconShell.appendChild(launcherIcon);
      var launcherName = document.createElement('span');
      launcherName.className = 'workspace-app-name';
      launcherName.textContent = 'TELOTIA';
      var launcherHint = document.createElement('small');
      launcherHint.textContent = 'Double-click to open';
      launcher.appendChild(launcherIconShell);
      launcher.appendChild(launcherName);
      launcher.appendChild(launcherHint);
      frame.parentNode.insertBefore(launcher, frame.nextSibling);

      var normalWindowState = null;
      var closingTimer = 0;

      function captureWindowState() {
        return {
          width: frame.style.width,
          height: frame.style.height,
          translate: frame.style.translate,
          offsetX: offsetX,
          offsetY: offsetY,
          hasUserSize: frame.classList.contains('has-user-window-size'),
          hasUserPosition: frame.classList.contains('has-user-window-position')
        };
      }

      function restoreWindowState() {
        if (!normalWindowState) return;
        frame.style.width = normalWindowState.width;
        frame.style.height = normalWindowState.height;
        frame.style.translate = normalWindowState.translate;
        offsetX = normalWindowState.offsetX;
        offsetY = normalWindowState.offsetY;
        frame.classList.toggle('has-user-window-size', normalWindowState.hasUserSize);
        frame.classList.toggle('has-user-window-position', normalWindowState.hasUserPosition);
        normalWindowState = null;
        updateFitState();
      }

      function toggleMinimize() {
        var minimized = frame.classList.toggle('is-minimized');
        live.textContent = minimized ? 'TELOTIA minimized to its title bar' : 'TELOTIA restored';
      }

      function toggleMaximize() {
        if (frame.classList.contains('is-minimized')) frame.classList.remove('is-minimized');
        if (frame.classList.contains('is-maximized')) {
          frame.classList.remove('is-maximized');
          restoreWindowState();
          live.textContent = 'TELOTIA restored';
          return;
        }
        normalWindowState = captureWindowState();
        var limits = sizeLimits(frame.getBoundingClientRect(), 0);
        var rect = frame.getBoundingClientRect();
        var targetLeft = 12;
        frame.classList.add('is-maximized', 'has-user-window-size');
        frame.style.width = limits.maxWidth + 'px';
        frame.style.height = Math.round(Math.max(spec.minHeight, Math.min(820, window.innerHeight - 120))) + 'px';
        offsetX += targetLeft - rect.left;
        frame.style.translate = Math.round(offsetX) + 'px ' + Math.round(offsetY) + 'px';
        updateFitState();
        live.textContent = 'TELOTIA maximized';
      }

      function closeWorkspace() {
        if (closingTimer) return;
        if (frame.classList.contains('is-maximized')) {
          frame.classList.remove('is-maximized');
          restoreWindowState();
        }
        frame.classList.remove('is-minimized');
        frame.classList.add('is-closing');
        closingTimer = window.setTimeout(function () {
          frame.hidden = true;
          frame.classList.remove('is-closing');
          launcher.hidden = false;
          launcher.classList.add('is-arriving');
          launcher.focus();
          closingTimer = 0;
        }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180);
      }

      function openWorkspace() {
        if (closingTimer) {
          clearTimeout(closingTimer);
          closingTimer = 0;
        }
        launcher.hidden = true;
        launcher.classList.remove('is-selected', 'is-arriving');
        frame.hidden = false;
        frame.classList.add('is-opening');
        frame.querySelector('.workspace-toolbar').focus({ preventScroll: true });
        window.setTimeout(function () { frame.classList.remove('is-opening'); }, 260);
        live.textContent = 'TELOTIA opened';
      }

      nativeControls.forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          requestCompactNavigation(button.dataset.nativeWindowAction);
          var action = button.dataset.nativeWindowAction;
          if (action === 'minimize') toggleMinimize();
          if (action === 'maximize') toggleMaximize();
          if (action === 'close') closeWorkspace();
        });
      });

      var nativeTitlebar = clip.querySelector('.workspace-toolbar');
      if (nativeTitlebar) {
        nativeTitlebar.tabIndex = 0;
        nativeTitlebar.title = 'Drag to move. Double-click to maximize or restore.';
        var dragState = null;
        var suppressTitlebarDoubleClickUntil = 0;

        function beginWindowDrag(event) {
          if (event.button !== 0 || window.matchMedia('(max-width: 820px)').matches) return;
          if (event.target.closest('button, a, input, select, textarea, [data-no-window-drag]')) return;
          if (frame.classList.contains('is-maximized')) return;
          event.preventDefault();
          requestCompactNavigation('window-drag');
          var rect = frame.getBoundingClientRect();
          dragState = {
            startX: event.clientX,
            startY: event.clientY,
            startLeft: rect.left,
            startTop: rect.top,
            startOffsetX: offsetX,
            startOffsetY: offsetY,
            width: rect.width,
            moved: false
          };
          frame.classList.add('is-window-dragging');
          window.addEventListener('mousemove', moveWindowDrag);
          window.addEventListener('mouseup', endWindowDrag, { once: true });
          window.addEventListener('blur', endWindowDrag, { once: true });
        }

        function moveWindowDrag(event) {
          if (!dragState) return;
          var deltaX = event.clientX - dragState.startX;
          var deltaY = event.clientY - dragState.startY;
          if (!dragState.moved && Math.abs(deltaX) + Math.abs(deltaY) > 3) dragState.moved = true;
          var minLeft = 12;
          var maxLeft = Math.max(minLeft, window.innerWidth - dragState.width - 12);
          var minTop = 76;
          var maxTop = Math.max(minTop, window.innerHeight - 44);
          var targetLeft = clamp(dragState.startLeft + deltaX, minLeft, maxLeft);
          var targetTop = clamp(dragState.startTop + deltaY, minTop, maxTop);
          offsetX = dragState.startOffsetX + targetLeft - dragState.startLeft;
          offsetY = dragState.startOffsetY + targetTop - dragState.startTop;
          frame.style.translate = Math.round(offsetX) + 'px ' + Math.round(offsetY) + 'px';
          frame.classList.add('has-user-window-position');
          updateFitState();
          live.textContent = 'TELOTIA moved to ' + Math.round(targetLeft) + ', ' + Math.round(targetTop);
        }

        function endWindowDrag() {
          if (!dragState) return;
          if (dragState.moved) suppressTitlebarDoubleClickUntil = performance.now() + 350;
          dragState = null;
          frame.classList.remove('is-window-dragging');
          window.removeEventListener('mousemove', moveWindowDrag);
          window.removeEventListener('mouseup', endWindowDrag);
          window.removeEventListener('blur', endWindowDrag);
        }

        nativeTitlebar.addEventListener('mousedown', beginWindowDrag);
        nativeTitlebar.addEventListener('dblclick', function (event) {
          if (event.target.closest('.workspace-native-control')) return;
          if (performance.now() < suppressTitlebarDoubleClickUntil) return;
          requestCompactNavigation('window-maximize');
          toggleMaximize();
        });
      }
      launcher.addEventListener('click', function () { launcher.classList.add('is-selected'); });
      launcher.addEventListener('dblclick', openWorkspace);
      launcher.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') openWorkspace();
        if (event.key === ' ') {
          event.preventDefault();
          launcher.classList.add('is-selected');
        }
      });
    }

    resizeHandles.forEach(function (resizeHandle) {
      resizeHandle.addEventListener('pointerdown', beginResize);
      resizeHandle.addEventListener('pointermove', moveResize);
      resizeHandle.addEventListener('pointerup', endResize);
      resizeHandle.addEventListener('pointercancel', endResize);
      resizeHandle.addEventListener('dblclick', function () {
        requestCompactNavigation('window-size-reset');
        resetSize();
      });
      resizeHandle.addEventListener('keydown', function (event) {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        var xDirection = Number(resizeHandle.dataset.resizeX);
        var yDirection = Number(resizeHandle.dataset.resizeY);
        var horizontalKey = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
        var verticalKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';
        if ((horizontalKey && !xDirection) || (verticalKey && !yDirection)) return;
        event.preventDefault();
        requestCompactNavigation('window-keyboard-resize');
        var rect = frame.getBoundingClientRect();
        var limits = sizeLimits(rect, xDirection);
        var step = event.shiftKey ? 8 : 24;
        var width = rect.width;
        var height = rect.height;
        if (horizontalKey) width += xDirection * (event.key === 'ArrowLeft' ? -step : step);
        if (verticalKey) height += yDirection * (event.key === 'ArrowUp' ? -step : step);
        width = Math.round(clamp(width, limits.minWidth, limits.maxWidth));
        height = Math.round(clamp(height, limits.minHeight, limits.maxHeight));
        var left = xDirection < 0 ? rect.left + rect.width - width : rect.left;
        var top = yDirection < 0 ? rect.top + rect.height - height : rect.top;
        frame.classList.add('has-user-window-size');
        updateFitState();
        queueSize(width, height, left, top);
      });
    });

    window.addEventListener('resize', function () {
      if (window.matchMedia('(max-width: 820px)').matches) resetSize();
    }, { passive: true });
  }

  targetSpecs.forEach(function (spec) {
    Array.prototype.slice.call(document.querySelectorAll(spec.selector)).forEach(function (frame, index) {
      enhance(frame, spec, index);
    });
  });
})();
