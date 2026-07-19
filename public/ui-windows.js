(function initTelotiaWindows() {
  var zoomLevels = [0.9, 1, 1.15, 1.3, 1.5];
  var targetSpecs = [
    { selector: '.home-hero .glow-wrap', key: 'hero-ledger', label: 'Evidence ledger', minWidth: 320, minHeight: 180 },
    { selector: '.home-path .proof-ledger', key: 'proof-path', label: 'Proof path', minWidth: 360, minHeight: 220 },
    { selector: '.workspace-window', key: 'workspace', label: 'Review workspace', minWidth: 560, minHeight: 320, os: true },
    { selector: '#demo .glow-wrap', key: 'demo', label: 'Interactive demo', minWidth: 420, minHeight: 280 },
    { selector: '.process-window', key: 'process', label: 'Process view', minWidth: 420, minHeight: 220 },
    { selector: '#tlSpikeWrap', key: 'verdict', label: 'Verdict space', minWidth: 360, minHeight: 220 }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

  function setWorkspaceOS(frame, os, controls) {
    frame.dataset.windowOs = os;
    controls.forEach(function (button) {
      var active = button.dataset.windowOs === os;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
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
      var windowsButton = makeButton('Windows 98', 'Use Windows 98 window style', 'os');
      macButton.dataset.windowOs = 'mac';
      windowsButton.dataset.windowOs = 'windows98';
      styleGroup.appendChild(macButton);
      styleGroup.appendChild(windowsButton);
      toolbar.appendChild(styleGroup);
      toolbar.appendChild(document.createElement('span')).className = 'ui-window-tool-divider';
      var storedOS = 'mac';
      try { storedOS = sessionStorage.getItem('telotia-window-os') || 'mac'; } catch (error) {}
      setWorkspaceOS(frame, storedOS === 'windows98' || storedOS === 'windows' ? 'windows98' : 'mac', [macButton, windowsButton]);
      styleGroup.addEventListener('click', function (event) {
        var button = event.target.closest('[data-window-os]');
        if (!button) return;
        setWorkspaceOS(frame, button.dataset.windowOs, [macButton, windowsButton]);
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

    function sizeLimits() {
      var parent = frame.parentElement;
      var parentWidth = parent ? parent.getBoundingClientRect().width : window.innerWidth - 32;
      return {
        minWidth: Math.min(spec.minWidth, Math.max(280, parentWidth)),
        maxWidth: Math.max(280, Math.min(parentWidth, window.innerWidth - 32)),
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
      var rect = frame.getBoundingClientRect();
      var limits = sizeLimits();
      resizeState = {
        startX: event.clientX,
        startY: event.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
        startLeft: rect.left,
        startTop: rect.top,
        xDirection: Number(event.currentTarget.dataset.resizeX),
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
      frame.classList.remove('is-window-resizing', 'has-user-window-size');
      updateFitState();
      live.textContent = spec.label + ' size reset';
    }

    function updateFitState() {
      fit.disabled = !frame.classList.contains('has-user-window-size') && zoomIndex === 1;
    }

    resizeHandles.forEach(function (resizeHandle) {
      resizeHandle.addEventListener('pointerdown', beginResize);
      resizeHandle.addEventListener('pointermove', moveResize);
      resizeHandle.addEventListener('pointerup', endResize);
      resizeHandle.addEventListener('pointercancel', endResize);
      resizeHandle.addEventListener('dblclick', resetSize);
      resizeHandle.addEventListener('keydown', function (event) {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        var xDirection = Number(resizeHandle.dataset.resizeX);
        var yDirection = Number(resizeHandle.dataset.resizeY);
        var horizontalKey = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
        var verticalKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';
        if ((horizontalKey && !xDirection) || (verticalKey && !yDirection)) return;
        event.preventDefault();
        var rect = frame.getBoundingClientRect();
        var limits = sizeLimits();
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
