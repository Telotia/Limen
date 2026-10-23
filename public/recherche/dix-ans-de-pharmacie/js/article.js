// The articles' behaviours, all optional: without this script, or with reduced motion, every number and chart is on
// the page, still.
//   - what changed: openings and figures settle in once as they reach the reader; numbers count up to what they
//     say; bars grow from their baseline; a series unrolls along its time axis.
//   - the decade: its chart follows the reader's scroll, so scrolling moves time from 2016 to 2026; it glides rather
//     than jumps, and a wheel, touchpad or key move carries the page straight to the next step.
//   - the opening: patients in line at a pharmacy, each as tall as a month's value, who turn into the bars of the
//     real series: the first beat plays by itself, then the reader's scroll moves it from stop to stop. Ten years opens
//     on the topic map in 3D instead, turning with the scroll, to explore by theme and by subject.
//   - where you are: a hairline of progress under the band.
// On telotia.com a page holds the article in both languages ([data-lang-root], one shown at a time): each copy starts
// the first time it is shown (window.TelotiaArticle.start), and its numbers take the language of their own copy.
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var still = !("IntersectionObserver" in window) || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var fr = (root.lang || "en").slice(0, 2) === "fr";
  var NNBSP = " ";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  var scope = document;  // the copy being started: the page, or one language of it
  function all(sel, el) { return Array.prototype.slice.call((el || scope).querySelectorAll(sel)); }
  // the language an element is written in: its copy's, else the page's
  function frOf(el) {
    var l = el && el.closest ? el.closest("[lang]") : null;
    return ((l && l.getAttribute("lang")) || root.lang || "en").slice(0, 2) === "fr";
  }

  // ── a number counts up to what it says, then says it exactly ──
  function count(el) {
    if (still || el.dataset.counted) return;
    var fr = frOf(el);
    el.dataset.counted = "1";
    var text = el.textContent;
    var m = text.match(/\d[\d  ,.]*/);
    if (!m) return;
    var tok = m[0].replace(/[  ,.]+$/, "");
    var decSep = fr ? "," : ".";
    var grouped = fr ? /[  ]/.test(tok) : /,/.test(tok);
    var clean = fr ? tok.replace(/[  ]/g, "") : tok.replace(/,/g, "");
    var parts = clean.split(decSep);
    var decimals = parts[1] ? parts[1].length : 0;
    var target = parseFloat(parts[0] + (parts[1] ? "." + parts[1] : ""));
    if (!isFinite(target)) return;
    var from = parseFloat(el.dataset.from || "0");
    var pre = text.slice(0, m.index), post = text.slice(m.index + tok.length);
    function fmt(v) {
      var s = v.toFixed(decimals).split(".");
      var w = grouped ? s[0].replace(/\B(?=(\d{3})+(?!\d))/g, fr ? NNBSP : ",") : s[0];
      return pre + w + (s[1] ? decSep + s[1] : "") + post;
    }
    var dur = 1100, t0 = null;
    el.textContent = fmt(from);
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      if (p < 1) {
        el.textContent = fmt(from + (target - from) * (1 - Math.pow(1 - p, 4)));
        window.requestAnimationFrame(step);
      } else el.textContent = text;
    }
    window.requestAnimationFrame(step);
  }

  function show(el) {
    el.classList.add("in");
    if (el.hasAttribute("data-count")) count(el);
    all("[data-count]", el).forEach(count);
  }

  // ── what changed settles in once ──
  function reveal() {
    if (still) return;
    root.classList.add("motion");
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        show(en.target);
        seen.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    var items = all("[data-reveal]");
    if (location.hash) { items.forEach(show); return; }
    // let the first state paint, then watch: what is already in view settles in at once
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { items.forEach(function (el) { seen.observe(el); }); });
    });
  }

  // ── stops: scrolling through a sequence moves from one stop to the next (Mohan, 18 Oct 2026: "a momentum to attach
  // to the prev/next state instead of jamming in-between") ──
  // Inside a sequence, a wheel, touchpad or key move carries the page at once to the next stop in its direction, in one
  // glide that slows into it; the rest of that gesture (a touchpad's inertia, more notches of the same flick) is
  // absorbed, so one gesture is one stop. Before the first stop and after the last, the page scrolls as usual. Touch
  // and the scrollbar scroll natively, then settle on a stop (land). Two columns only (a phone scrolls freely), and
  // never in a recording. Snapping that waits for the scroll to stop (CSS scroll snap, ScrollTrigger's snap, our first
  // try) always rests in between before it moves. rests() gives the stops' scroll positions (Ten years' timeline, the
  // openings); with skipFirst, a move down from above the first stop goes on to the second, since the first is what's
  // on screen already (an opening's still).
  function stops(rests, opts) {
    opts = opts || {};
    var from = window.scrollY, aim = null, wait = 0, ride = null;
    var lastAt = 0, lastAbs = 0, lastDir = 0, absorbing = false;
    function zone(r, y) {
      var gap = (r[r.length - 1] - r[0]) / (r.length - 1);
      return y >= r[0] - gap / 2 && y <= r[r.length - 1] + gap / 2;
    }
    // where a move in this direction stops: the next step, or null outside the timeline or past its first or last step
    function next(y, dir) {
      var r = rests(), i;
      if (window.innerWidth < 900 || r.length < 2 || !zone(r, y)) return null;
      if (dir > 0) { for (i = 0; i < r.length; i++) if (r[i] > y + 1) return i === 0 && opts.skipFirst ? r[1] : r[i]; }
      else { for (i = r.length - 1; i >= 0; i--) if (r[i] < y - 1) return r[i]; }
      return null;
    }
    // the glide starts at full pace and slows into the step (ease-out), about two thirds of a second for one step;
    // "instant" because the hub's stylesheet makes every scroll smooth, which would lag each frame
    function glideTo(y) {
      window.clearTimeout(wait);
      aim = null;
      var a = window.scrollY;
      ride = { a: a, b: y, t0: 0, dur: Math.max(480, Math.min(900, 360 + Math.abs(y - a) * 0.55)) };
      window.requestAnimationFrame(rideFrame);
    }
    function rideFrame(ts) {
      var g = ride;
      if (!g) return;
      if (!g.t0) g.t0 = ts;
      var p = Math.min(1, (ts - g.t0) / g.dur), k = 1 - Math.pow(1 - p, 3);
      window.scrollTo({ top: g.a + (g.b - g.a) * k, behavior: "instant" });
      if (p < 1) window.requestAnimationFrame(rideFrame);
      else { ride = null; from = window.scrollY; }
    }
    function wheel(e) {
      window.clearTimeout(wait);
      if (aim !== null) { aim = null; from = window.scrollY; }
      if (e.ctrlKey) return;  // a pinch zooms
      var dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (!dy || Math.abs(dy) < Math.abs(e.deltaX)) return;
      var dir = dy > 0 ? 1 : -1, abs = Math.abs(dy);
      // the same gesture goes on: same direction, close in time, not pushing harder
      var same = dir === lastDir && e.timeStamp - lastAt < 200 && abs <= lastAbs * 1.5 + 2;
      lastAt = e.timeStamp; lastAbs = abs; lastDir = dir;
      if (ride || (absorbing && same)) { if (e.cancelable) e.preventDefault(); return; }
      absorbing = false;
      if (opts.inside && opts.inside(dir)) return;  // more of this step to read that way: the page scrolls as usual
      // a gesture the browser already scrolls (it began outside the timeline) can't be taken over; it settles after
      if (!e.cancelable) return;
      var y = next(window.scrollY, dir);
      if (y === null) return;
      e.preventDefault();
      absorbing = true;
      glideTo(y);
    }
    function key(e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A)$/.test(t.tagName))) return;
      var dir = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key] || (e.key === " " ? (e.shiftKey ? -1 : 1) : 0);
      if (!dir) { if (ride && /^(Home|End)$/.test(e.key)) ride = null; return; }
      if (!ride && opts.inside && opts.inside(dir)) return;
      var y = next(ride ? ride.b : window.scrollY, dir);  // a key pressed again during a glide goes one step further
      if (y === null) return;
      e.preventDefault();
      glideTo(y);
    }

    // after a scroll the page didn't steer (touch, the scrollbar, a wheel that began outside the timeline), it settles
    // on a step: a short move goes on to the next step in its direction, a long one to the nearest
    function land() {
      if (ride) return;
      if (opts.inside && (opts.inside(1) || opts.inside(-1))) { from = window.scrollY; aim = null; return; }  // reading a long step
      var y = window.scrollY, i;
      if (aim !== null) {
        var ours = Math.abs(y - aim) < 2;
        aim = null;
        if (ours) { from = y; return; }
      }
      var moved = y - from;
      from = y;
      var rest = rests();
      if (window.innerWidth < 900 || rest.length < 2 || Math.abs(moved) < 2) return;
      var gap = (rest[rest.length - 1] - rest[0]) / (rest.length - 1);
      if (!zone(rest, y)) return;
      for (i = 0; i < rest.length; i++) if (Math.abs(rest[i] - y) < 2) return;
      var to = -1;
      if (Math.abs(moved) < gap * 0.6) {
        if (moved > 0) { for (i = 0; i < rest.length; i++) if (rest[i] > y) { to = i; break; } }
        else { for (i = rest.length - 1; i >= 0; i--) if (rest[i] < y) { to = i; break; } }
      } else {
        to = 0;
        for (i = 1; i < rest.length; i++) if (Math.abs(rest[i] - y) < Math.abs(rest[to] - y)) to = i;
      }
      if (to < 0) return;  // a nudge out of the timeline, past its first or last step
      aim = rest[to];
      window.scrollTo({ top: aim, behavior: "smooth" });
    }
    // it waits until nothing has moved the page for a moment, so a stream of small scrolls is one move
    function ended() { if (!ride) { window.clearTimeout(wait); wait = window.setTimeout(land, 120); } }
    // a touch takes over from a glide or a settling page at once
    function takeover() { window.clearTimeout(wait); ride = null; if (aim !== null) aim = null; from = window.scrollY; }
    if (!capture) {
      window.addEventListener("wheel", wheel, { passive: false });
      window.addEventListener("keydown", key);
      window.addEventListener("touchstart", takeover, { passive: true });
      window.addEventListener("onscrollend" in window ? "scrollend" : "scroll", ended, { passive: true });
    }
  }

  // ── the decade: scrolling moves time ──
  function decade() {
    var sec = scope.querySelector(".decade");
    if (!sec || still) return;  // still: the whole decade, then its steps
    var chart = sec.querySelector(".dc-chart");
    var t0 = +chart.dataset.t0, t1 = +chart.dataset.t1;
    var steps = all(".dc-step", sec);
    var events = all(".dc-ev", sec);
    var dots = all(".dc-dot", sec);
    var labels = all(".dc-lab", sec);
    var year = sec.querySelector(".dc-year"), val = sec.querySelector(".dc-val");
    var anchors = [], queued = false, lastT = t0;
    // the chart glides toward the time the scroll points at, a tenth of a second behind, so a wheel's notches read as
    // one motion; a recording (?capture) and the first paint are exact
    var target = t0, shown = t0, primed = false, moving = false, before = 0;
    function glide(ts) {
      var dt = before ? Math.min(64, ts - before) : 16;
      before = ts;
      shown += (target - shown) * (1 - Math.exp(-dt / 110));
      if (Math.abs(target - shown) < 0.0008) shown = target;
      set(shown);
      if (shown !== target) window.requestAnimationFrame(glide);
      else moving = false;
    }
    sec.classList.add("live");

    function set(t) {
      lastT = t;
      var x = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
      chart.style.setProperty("--x", x.toFixed(4));
      var now = null;
      events.forEach(function (ev) {
        var past = t >= +ev.dataset.t;
        ev.classList.toggle("past", past);
        ev.classList.remove("now");
        if (past) now = ev;
      });
      if (now && t - +now.dataset.t < 1.1) now.classList.add("now");
      var cur = null;
      dots.forEach(function (d) { var on = +d.dataset.t <= t + 0.0001; d.classList.toggle("on", on); if (on) cur = d; });
      labels.forEach(function (l) { l.classList.toggle("on", +l.dataset.t <= t + 0.0001); });
      year.textContent = cur ? cur.dataset.y : String(Math.floor(Math.max(t, t0)));
      val.textContent = cur ? cur.dataset.v : "";
    }
    // on a wide screen each step rests where all of it shows, under the band (Lina, 21 Oct 2026: "I cannot go down and
    // read the rest of the paragraph, it directly flips to the next year!"); a step taller than the screen is read
    // through before the next (inside, for stops); on a narrow one the reading line sets the time, as before
    var restAt = [];
    function head() { var b = document.querySelector(".tl-conf-band"); return (b ? b.offsetHeight : 48) + 16; }
    function measure() {
      var wide = window.innerWidth >= 900, top = head(), room = window.innerHeight - top - 24;
      restAt = [];
      anchors = steps.map(function (s) {
        var r = s.getBoundingClientRect(), y0 = r.top + window.scrollY;
        var rest = Math.round(y0 - top - Math.max(0, (room - r.height) * 0.35));
        restAt.push(rest);
        return { y: wide ? rest + window.innerHeight * 0.5 : y0 + Math.min(r.height, window.innerHeight * 0.4) / 2, t: +s.dataset.t };
      });
      update();
    }
    function inside(dir) {
      var y = window.scrollY, i = -1;
      for (var k = 0; k < restAt.length; k++) if (restAt[k] <= y + 1) i = k;
      if (i < 0 || (i < restAt.length - 1 && y >= restAt[i + 1] - 1)) return false;
      // where its words and figure end, not its box (a step is at least 64vh tall)
      var r = steps[i].getBoundingClientRect(), end = r.top;
      for (var c = steps[i].firstElementChild; c; c = c.nextElementSibling) end = Math.max(end, c.getBoundingClientRect().bottom);
      return dir > 0 ? end > window.innerHeight - 8 : r.top < head() - 1 && y > restAt[i] + 1;
    }
    function update() {
      queued = false;
      if (!anchors.length) return;
      var line = window.scrollY + window.innerHeight * (window.innerWidth >= 900 ? 0.5 : 0.7);
      var first = anchors[0], last = anchors[anchors.length - 1];
      var t = first.t, active = 0;
      if (line <= first.y) t = Math.max(t0, first.t - (first.y - line) / window.innerHeight);
      else if (line >= last.y) { t = Math.min(t1, last.t + (line - last.y) / window.innerHeight); active = anchors.length - 1; }
      else {
        for (var i = 0; i < anchors.length - 1; i++) {
          var a = anchors[i], b = anchors[i + 1];
          if (line >= a.y && line < b.y) {
            var f = (line - a.y) / (b.y - a.y);
            t = a.t + (b.t - a.t) * f;
            active = f < 0.5 ? i : i + 1;
            break;
          }
        }
      }
      steps.forEach(function (s, j) { s.classList.toggle("on", j === active); });
      target = t;
      if (capture || !primed) { primed = true; shown = t; set(t); return; }
      if (!moving) { moving = true; before = 0; window.requestAnimationFrame(glide); }
    }
    function queue() {
      if (!queued) { queued = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();

    // the steps are stops: a wheel, touchpad or key move goes from one to the next (stops, below)
    function rests() { return restAt; }
    stops(rests, { inside: inside });
    return function () { update(); return lastT; };
  }

  // ── the opening: patients in line at a pharmacy, each as tall as a month's value (Mohan, 21 Oct 2026) ──
  // Stacks of review posts become patients in line at a counter, one to a month (or a year); the line changes from one
  // year to another; then it turns to face the reader, so the patients are the bars of the real series, and the view
  // pulls back to all of it (how it plays, below). Every frame is a function of v (0 to 1) alone: 0.58 is the still the
  // covers use, 1 the whole series. With reduced motion and in a recording, the still; without the script, its table.
  function hero() {
    var fig = scope.querySelector(".ao--hero");
    if (!fig) return;
    var S;
    try { S = JSON.parse(fig.getAttribute("data-hero")); } catch (err) { return; }
    var canvas = fig.querySelector("canvas"), ctx = canvas.getContext("2d");
    var STILL = 0.58, XS = 0.44, BW = 0.3, WZ = -0.45, WX0 = -0.35, SHELVES = [0.35, 0.7, 1.05];
    var STOOP = [0, 0, 0, 0.08, 0, 0, 0, 0.05, 0, 0, 0.07, 0];
    var W = 0, H = 0, K = {}, font = "", v = still || capture ? STILL : 0;

    function cl(x) { return Math.max(0, Math.min(1, x)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function dec(t) { return 1 - Math.pow(1 - t, 3); }
    function io(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    // tokens, so the figure follows the theme; mixed toward the surface, so colour stays the exception
    var probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    function rgb(css) {
      probe.clearRect(0, 0, 1, 1); probe.fillStyle = "#000"; probe.fillStyle = css; probe.fillRect(0, 0, 1, 1);
      var d = probe.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    }
    function css(a) { return "rgb(" + a.map(Math.round).join(",") + ")"; }
    function mix(a, b, t) { return [0, 1, 2].map(function (i) { return a[i] + (b[i] - a[i]) * t; }); }
    function palette() {
      var cs = getComputedStyle(fig), tok = function (n) { return rgb(cs.getPropertyValue(n).trim() || "#888"); };
      var sf = tok("--surface"), bs = tok("--border-strong"), t2 = tok("--text-secondary");
      K = { r: mix(tok("--error"), sf, 0.18), t: tok("--teal"), w: mix(tok("--warning"), sf, 0.12), n: mix(t2, sf, 0.3), ph: mix(tok("--text"), sf, 0.15),
            cnt: bs, file: mix(bs, sf, 0.75), fileSide: mix(bs, sf, 0.5), wall: sf, edge: tok("--border"), shelf: mix(bs, sf, 0.6),
            side: mix(bs, sf, 0.45), top: mix(bs, sf, 0.65), bar: mix(bs, sf, 0.6), txt: tok("--text"), tx2: t2 };
      font = cs.fontFamily;
    }

    // vectors, and a person as two profiles (body, head) in the z-y plane, extruded across x
    function V(x, y, z) { return { x: x, y: y, z: z }; }
    function add(a, b) { return V(a.x + b.x, a.y + b.y, a.z + b.z); }
    function sub(a, b) { return V(a.x - b.x, a.y - b.y, a.z - b.z); }
    function mul(a, k) { return V(a.x * k, a.y * k, a.z * k); }
    function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
    function crs(a, b) { return V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
    function nrm(a) { return mul(a, 1 / Math.hypot(a.x, a.y, a.z)); }
    var UP = V(0, 1, 0);
    function rounded(z0, z1, y0, y1, r, lean) {
      var p = [[z0, y0], [z1, y0]], i, a;
      for (i = 0; i <= 8; i++) { a = i / 8 * Math.PI / 2; p.push([z1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
      for (i = 0; i <= 8; i++) { a = Math.PI / 2 + i / 8 * Math.PI / 2; p.push([z0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
      return p.map(function (q) { return [q[0] + lean * q[1], q[1]]; });
    }
    function circle(cz, cy, r) {
      var p = [];
      for (var i = 0; i < 20; i++) { var a = i / 20 * 2 * Math.PI; p.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]); }
      return p;
    }
    // the top of the head is at 0.95 h whatever the stoop, so a patient is exactly as tall as the value
    function person(h, s, back) {
      var f = back ? -1 : 1;
      return [rounded(-0.11 * h, 0.09 * h, 0, 0.76 * h, 0.06 * h, s), circle(0.02 * h + s * 0.76 * h + 0.02 * s, 0.855 * h, 0.095 * h)]
        .map(function (P) { return P.map(function (q) { return [f * q[0], q[1]]; }); });
    }
    function extrude(poly, x0, x1, out, o, sy) {
      var Q = poly.map(function (q) { return [q[0] + o.z, q[1] * sy]; }), cz = 0, cy = 0;
      Q.forEach(function (q) { cz += q[0]; cy += q[1]; });
      cz /= Q.length; cy /= Q.length;
      out.push({ pts: Q.map(function (q) { return V(x1, q[1], q[0]); }), n: V(1, 0, 0), cap: 1, o: o });
      out.push({ pts: Q.map(function (q) { return V(x0, q[1], q[0]); }), n: V(-1, 0, 0), cap: 1, o: o });
      for (var j = 0; j < Q.length; j++) {
        var a = Q[j], b = Q[(j + 1) % Q.length];
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-6) continue;
        var n = nrm(V(0, b[0] - a[0], -(b[1] - a[1])));
        if (n.z * ((a[0] + b[0]) / 2 - cz) + n.y * ((a[1] + b[1]) / 2 - cy) < 0) n = mul(n, -1);
        out.push({ pts: [V(x0, a[1], a[0]), V(x1, a[1], a[0]), V(x1, b[1], b[0]), V(x0, b[1], b[0])], n: n, cap: 0, o: o });
      }
    }

    // the line: one patient to a month of the later year (or to each year), the earlier year's values to start from
    var monthly = S.kind === "m", N = monthly ? 12 : S.vals.length;
    var A = monthly ? S.vals.slice(S.a0, S.a0 + 12) : S.vals, B = monthly ? S.vals.slice(S.b0, S.b0 + 12) : S.vals;
    var VREF = Math.max.apply(null, A.concat(B)), L = S.vals.length;
    var PAT = [];
    for (var k = 0; k < N; k++) {
      var p0 = 0.06 + k * (0.25 / N);
      PAT.push({ k: k, x: (k + 2) * XS, z: 1.1 + 0.6 * k, va: A[k], vb: B[k], idx: monthly ? S.b0 + k : k, grow: [p0 + 0.02, p0 + 0.08], card: p0, kind: "pat" });
    }
    var WX1 = (N + 1) * XS + 0.35, TG = V((N + 1) * XS / 2, 0.5, (1.1 + 0.6 * (N - 1)) / 2);
    function slot(i) { return monthly ? 2 + (i - S.b0) : 2 + i; }
    function isB(i) { return monthly ? i >= S.b0 && i < S.b0 + 12 : i === S.bi; }
    function isA(i) { return monthly ? i >= S.a0 && i < S.a0 + 12 : i === S.ai; }

    function camera(th, phi, zoom) {
      var t = th * Math.PI / 180, p = phi * Math.PI / 180;
      var C = add(TG, V(40 * Math.sin(t) * Math.cos(p), 40 * Math.sin(p), 40 * Math.cos(t) * Math.cos(p)));
      var f = nrm(sub(TG, C)), r = nrm(crs(f, UP)), u = crs(r, f);
      var unit = Math.min(W / 442, H / 356) * 80 * 12 / (N + 2), FP = unit * 40 * zoom, CX = W * 0.45, CY = H * 0.56;
      return { C: C, f: f, P: function (q) { var d = sub(q, C), z = dot(d, f); return [CX + dot(d, r) / z * FP, CY - dot(d, u) / z * FP]; } };
    }

    function draw(v) {
      if (!W) return;
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = "round";
      var beat = cl((v - 0.4) / 0.15), turn = io(cl((v - 0.6) / 0.15)), pull = io(cl((v - 0.75) / 0.17)), push = io(cl(v / 0.36));
      var fade = 1 - cl((v - 0.75) / 0.07), wx1 = lerp(1.25, WX1, turn);
      var cam = v < 0.75 ? camera(lerp(64, 0, turn), lerp(9, 0, turn), lerp(lerp(1.04, 1.14, push), 1, turn)) : camera(0, 0, 1), P = cam.P;
      function poly(pts, fill, a, line) {
        ctx.globalAlpha = a;
        ctx.beginPath();
        pts.forEach(function (q, i) { var s = P(q); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); });
        ctx.closePath();
        ctx.fillStyle = css(fill); ctx.fill();
        ctx.strokeStyle = css(line || fill); ctx.lineWidth = line ? 1 : 0.6; ctx.stroke();
      }
      function order(list) {
        return list.filter(function (F) { return dot(F.n, sub(cam.C, F.pts[0])) > 1e-4; }).map(function (F) {
          var c = V(0, 0, 0);
          F.pts.forEach(function (q) { c = add(c, q); });
          return { F: F, z: dot(sub(mul(c, 1 / F.pts.length), cam.C), cam.f) };
        }).sort(function (a, b) { return b.z - a.z; });
      }

      // the pharmacy: its back wall, short behind the pharmacist until the line turns and it becomes the chart's plot area;
      // its shelves (the gridlines); a pharmacist; a counter
      if (fade > 0) {
        poly([V(WX0, 0, WZ), V(wx1, 0, WZ), V(wx1, 1.25, WZ), V(WX0, 1.25, WZ)], K.wall, cl(v / 0.05) * fade, K.edge);
        var sf = [];
        SHELVES.forEach(function (y, j) {
          var t = dec(cl((v - 0.02 * j) / 0.08));
          if (t > 0) extrude([[WZ, y - 0.012], [WZ + 0.15, y - 0.012], [WZ + 0.15, y + 0.012], [WZ, y + 0.012]], WX0, WX0 + (wx1 - WX0) * t, sf, { kind: "shelf", z: 0 }, 1);
        });
        order(sf).forEach(function (o) { poly(o.F.pts, K.shelf, fade); });
      }
      var fs = [], cards = [], gp = dec(cl(v / 0.08));
      if (fade > 0 && gp > 0) {
        person(1, 0, S.ph === "busy").forEach(function (P_) { extrude(P_, -BW / 2, BW / 2, fs, { kind: "ph", z: S.greet ? 0.1 * io(beat) : 0 }, gp); });
        extrude([[-0.16, 0], [0.12, 0], [0.12, 0.42], [0.2, 0.42], [0.2, 0.46], [-0.16, 0.46]], XS - BW / 2, XS + BW / 2, fs, { kind: "cnt", z: 0.48 }, gp);
        for (var j = 0; j < (S.files || 0); j++) {
          var y0 = 0.46 + 0.032 * j, o = 0.01 * (j % 2);
          extrude([[-0.12 + o, y0], [0.06 + o, y0], [0.06 + o, y0 + 0.026], [-0.12 + o, y0 + 0.026]], XS - 0.11, XS + 0.11, fs, { kind: "file", z: 0.48 }, gp);
        }
      }
      // the patients, while the line still stands in the pharmacy; their heights move from the earlier year to the later
      if (v < 0.75) {
        PAT.forEach(function (o) {
          var g = dec(cl((v - o.grow[0]) / (o.grow[1] - o.grow[0]))), b = monthly ? io(cl((beat - o.k * 0.03) / 0.6)) : 0, e = io(beat);
          o.val = lerp(o.va, o.vb, b);
          o.col = K.n;
          if (!monthly && o.idx === S.bi) o.col = mix(K.n, K[S.c], e);
          else if (!monthly && o.idx === S.ai) o.col = mix(K.n, mix(K[S.c], K.n, 0.45), e);
          var ca = cl((v - o.card) / 0.03) * (1 - cl((v - o.card - 0.07) / 0.03));
          if (ca > 0) cards.push({ o: o, a: ca });
          if (g > 0) person(o.val / VREF * 1.1 / 0.95, STOOP[o.k % STOOP.length], true).forEach(function (P_) { extrude(P_, o.x - BW / 2, o.x + BW / 2, fs, o, g); });
        });
      }
      order(fs).forEach(function (q) {
        // the shading that shows a rounded head or shoulder fades as the line turns, so head-on the bars are flat
        var o = q.F.o, fill = q.F.cap ? (o.kind === "pat" ? o.col : K[o.kind]) : (o.kind === "file" ? K.fileSide : (q.F.n.y > 0.55 ? mix(K.side, K.top, 1 - turn) : K.side));
        poly(q.F.pts, fill, o.kind === "pat" ? 1 : fade);
      });
      // a small stack of posts over each patient as it arrives
      cards.forEach(function (c) {
        var top = P(V(c.o.x, c.o.va / VREF * 1.1 + 0.04, c.o.z)), drop = (1 - cl((v - c.o.card) / 0.03)) * -8;
        for (var j = 2; j >= 0; j--) {
          ctx.globalAlpha = c.a; ctx.fillStyle = css(K.wall); ctx.strokeStyle = css(K.edge); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(top[0] - 11 + j * 2, top[1] - 16 - j * 2 + drop, 20, 9, 2); ctx.fill(); ctx.stroke();
        }
      });

      // head-on, the patients are the bars; then the view pulls back to the whole series, every bar on one scale
      if (v >= 0.75) {
        var P0 = camera(0, 0, 1).P, bx0 = W * 0.04, bx1 = W * 0.97, base = H * 0.86, hc = H * 0.6, vmax = Math.max.apply(null, S.vals) * 1.12;
        var appear = cl((v - 0.75) / 0.06), XC = function (i) { return bx0 + (i + 0.5) * (bx1 - bx0) / L; }, HC = function (i) { return S.vals[i] / vmax * hc; };
        for (var i = 0; i < L; i++) {
          var s = slot(i), x = s * XS, z = 1.1 + 0.6 * (s - 2), a0 = P0(V(x, 0, z)), a1 = P0(V(x, S.vals[i] / VREF * 1.1, z));
          var wp = Math.abs(P0(V(x + BW / 2, 0, z))[0] - P0(V(x - BW / 2, 0, z))[0]), wc = Math.max(1.3, (bx1 - bx0) / L * 0.72);
          var X = lerp(a0[0], XC(i), pull), Wd = lerp(wp, wc, pull), Yb = lerp(a0[1], base, pull), Hh = lerp(a0[1] - a1[1], HC(i), pull);
          if (X < -30 || X > W + 30) continue;
          var mine = monthly ? isB(i) : true, goal = isB(i) ? K[S.c] : isA(i) ? mix(K[S.c], K.bar, 0.5) : K.bar;
          var c = mine && monthly ? mix(K.n, K[S.c], pull) : mine && !isA(i) && !isB(i) ? mix(K.n, K.bar, pull) : goal;
          ctx.globalAlpha = mine ? 1 : appear; ctx.fillStyle = css(c);
          ctx.beginPath(); ctx.roundRect(X - Wd / 2, Yb - Hh, Wd, Hh, Math.min(3, Wd / 2)); ctx.fill();
        }
        var g0 = P0(V(0, 0, 1.1));
        ctx.globalAlpha = appear; ctx.strokeStyle = css(K.edge); ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(lerp(P0(V(WX0, 0, 0))[0], bx0, pull), lerp(g0[1], base, pull) + 0.5); ctx.lineTo(lerp(P0(V(WX1, 0, 0))[0], bx1, pull), lerp(g0[1], base, pull) + 0.5); ctx.stroke();
        var shown = cl((v - 0.9) / 0.06);
        if (shown > 0) {
          ctx.globalAlpha = shown; ctx.textAlign = "center";
          var spans = monthly ? [[S.a0, S.a0 + 11], [S.b0, S.b0 + 11]] : [[S.ai, S.ai], [S.bi, S.bi]];
          spans.forEach(function (sp, j) {
            var top = 0;
            for (var i = sp[0]; i <= sp[1]; i++) top = Math.max(top, HC(i));
            var y = base - top - 7;
            if (sp[1] > sp[0]) {
              ctx.strokeStyle = css(K.tx2); ctx.lineWidth = 1; ctx.beginPath();
              ctx.moveTo(XC(sp[0]) - 2, y + 3); ctx.lineTo(XC(sp[0]) - 2, y); ctx.lineTo(XC(sp[1]) + 2, y); ctx.lineTo(XC(sp[1]) + 2, y + 3); ctx.stroke();
            }
            ctx.fillStyle = css(K.txt); ctx.font = "500 13px " + font; ctx.fillText(S.lab[j], (XC(sp[0]) + XC(sp[1])) / 2, y - 5);
          });
          ctx.fillStyle = css(K.tx2); ctx.font = "12px " + font;
          var seen = {};
          S.ticks.forEach(function (t) { if (seen[t[0]]) return; seen[t[0]] = 1; ctx.fillText(t[1], XC(t[0]), base + 16); });
        }
      }
      // which years the line is, in a corner, while it stands in the pharmacy
      var lab = 1 - cl((v - 0.6) / 0.06);
      if (lab > 0) {
        var on = lab * cl((v - 0.3) / 0.06);
        ctx.textAlign = "right"; ctx.fillStyle = css(K.tx2); ctx.font = "13px " + font;
        if (monthly) {
          ctx.globalAlpha = on * (1 - cl((beat - 0.2) / 0.4)); ctx.fillText(S.A, W - 8, 18);
          ctx.globalAlpha = on * cl((beat - 0.4) / 0.4); ctx.fillText(S.B, W - 8, 18);
        } else { ctx.globalAlpha = on; ctx.fillText(S.range, W - 8, 18); }
      }
      ctx.globalAlpha = 1;
    }

    function size() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = Math.round(Math.max(240, Math.min(400, W * 0.52)));
      canvas.style.height = H + "px";
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      palette();
      draw(v);
    }

    // ── how it plays (Mohan, 21 Oct 2026: a slow scroller and a fast one should both see all of it) ──
    // The first beat (the posts become the line, the line changes) plays by itself once the figure is in view: a timed
    // animation finishes whatever the scroll does. Then the figure is pinned for a stretch of scrolling with three
    // stops, the still, the bars head-on and the whole series, which the scroll moves between: the picture glides a
    // moment behind the scroll, and on a wide screen one wheel, touchpad or key gesture is one stop, as in Ten years'
    // timeline. A reader who scrolls on before the first beat ends sees it finish quickly instead of skipping it.
    var pin = fig.parentNode, INTRO = 6000, PIN = 0, start = 0, clock = 0, seen = false, last = null, raf = 0, target = v;
    function measure() {
      PIN = Math.round(window.innerHeight * 1.1);
      pin.classList.add("pinned");
      pin.style.height = (fig.offsetHeight + PIN) + "px";
      start = Math.round(pin.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(fig).top) || 0));
      kick();
    }
    function rests() { return [start, start + PIN / 2, start + PIN]; }
    // where the scroll puts the sequence: the still at the pin's start, the bars head-on halfway, the series at its end
    function scrolled() {
      var p = cl((window.scrollY - start) / Math.max(1, PIN));
      return p < 0.5 ? lerp(STILL, 0.75, p / 0.5) : lerp(0.75, 1, (p - 0.5) / 0.5);
    }
    function frame(ts) {
      var dt = last === null ? 16 : Math.min(64, ts - last);
      last = ts;
      // the first beat's clock runs while the figure is in view, eight times faster once the reader has scrolled on
      if (clock < INTRO && seen) clock = Math.min(INTRO, clock + dt * (window.scrollY > start + 4 ? 8 : 1));
      target = clock < INTRO ? STILL * clock / INTRO : scrolled();
      v += (target - v) * (1 - Math.exp(-dt / 140));
      if (Math.abs(target - v) < 0.0005) v = target;
      draw(v);
      if (v !== target || (clock < INTRO && seen)) raf = window.requestAnimationFrame(frame);
      else { raf = 0; last = null; }
    }
    function kick() { if (!raf) raf = window.requestAnimationFrame(frame); }

    size();
    window.addEventListener("resize", size);
    new MutationObserver(function () { palette(); draw(v); }).observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });
    window.__hero = function (x) { draw(x); return x; };  // for a recording or a cover, any moment of the sequence
    if (still || capture) return;
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      size();
      measure();
      window.addEventListener("resize", measure);
      window.addEventListener("load", measure);
      window.addEventListener("scroll", kick, { passive: true });
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { seen = en.intersectionRatio >= 0.6; });
        kick();
      }, { threshold: [0, 0.3, 0.6, 0.8, 1] }).observe(canvas);
      stops(rests, { skipFirst: true });
    });
  }

  // ── Ten years' opening: the topic map in 3D (Mohan, 21 Oct 2026) ──
  // Every subject patients raised at least three times, placed by meaning (maps_interactive.article_cloud), coloured by
  // theme. On arrival it makes a slow quarter turn by itself, so it reads as a shape; after that it turns as the reader
  // scrolls (gliding a moment behind the scroll) and when dragged, with some momentum when let go; on a phone a sideways
  // drag turns it and an upward one still scrolls. The themes are named in two columns beside it, each with a line to
  // the densest part of its cluster; as it turns, a name follows its cluster up and down and changes side once the
  // cluster is clearly across the middle, neither side taking more than three names in five. Pointing at a name lights
  // its cluster; clicking it holds it (again, or Escape, lets go), and then only that theme's squares answer the pointer
  // and the wheel over the cloud zooms instead of scrolling: up, in toward the cluster, which the cloud then turns about;
  // down, back out, and on to the page once fully out, so the reader is never stuck (+ and - too). Clicking a square
  // opens a card: its subject, how many comments raise it and about how many pharmacies, and its share of one-star reviews
  // against all reviews (its topic's, when it has fewer than 100 comments about 20 pharmacies). On a narrow screen the
  // names sit below the cloud, without lines. With reduced motion and in a recording it holds still and only turns when
  // dragged; without the script it isn't shown (the flat map is further down). Frames are drawn only while something moves.
  function cloud() {
    var fig = scope.querySelector(".cloud[data-cloud]"), fr = frOf(fig);
    if (!fig || !window.fetch) return;
    var C;
    try { C = JSON.parse(fig.getAttribute("data-cloud")); } catch (err) { return; }
    var L = C.t, calm = still || capture, lang = fr ? "fr" : "en";
    var stage = fig.querySelector(".cloud-stage"), canvas = stage.querySelector("canvas"), ctx = canvas.getContext("2d");
    var SLABS = 8, SCROLL = 0.003, INTRO = 4200, HIT = 8, GAP = 4, ZMAX = 8;
    var W = 0, H = 0, LW = 0, narrow = false, D = null, S = null, ST = null, N = 0, X, Y, Z, R, TH, TP, PX, PY, PZ, PK, groups = [], tags = [];
    var yaw = 0.5, pitch = -0.32, vy = 0, vp = 0, drag = null, last = null, raf = 0, t0 = null, V = null;
    var sel = -1, hover = -1, hoverT = -1, lockT = -1, zoom = 1, zoomShown = 1, piv = [0, 0, 0], fp = -1, shownScroll = window.scrollY;

    var card = document.createElement("div");
    card.className = "cloud-card";
    card.setAttribute("role", "status");
    card.hidden = true;
    card.innerHTML = '<button type="button" class="cloud-x">×</button><p class="cloud-theme"><i></i><span></span></p>' +
      '<p class="cloud-subject"></p><p class="cloud-note"></p><div class="cloud-more"></div>';
    card.querySelector(".cloud-x").setAttribute("aria-label", L.close);
    var tagBox = document.createElement("div"), zhint = document.createElement("p");
    tagBox.className = "cloud-tags";
    zhint.className = "cloud-zhint";
    zhint.setAttribute("aria-live", "polite");
    stage.append(tagBox, card, zhint);
    fig.classList.add("on");

    function get(url) { return window.fetch(url).then(function (r) { return r.json(); }); }
    get(C.data.cloud).then(start).catch(function () {});

    function start(data) {
      D = data;
      N = D.points.length;
      X = new Float32Array(N); Y = new Float32Array(N); Z = new Float32Array(N); R = new Float32Array(N);
      TH = new Int16Array(N); TP = new Int16Array(N);
      PX = new Float32Array(N); PY = new Float32Array(N); PZ = new Float32Array(N); PK = new Uint8Array(N);
      var by = {}, rad = [];
      D.points.forEach(function (p, i) {
        X[i] = p[0] / 999; Y[i] = p[1] / 999; Z[i] = p[2] / 999; TH[i] = p[3]; R[i] = [0, 2.2, 3.2, 4.6][p[4]]; TP[i] = p[5];
        rad.push(Math.sqrt(X[i] * X[i] + Y[i] * Y[i] + Z[i] * Z[i]));
        (by[p[3]] = by[p[3]] || []).push(i);
      });
      // scaled so most of the cloud fills the frame: 95 subjects in 100 within the unit sphere, the far few drawn in
      rad.sort(function (a, b) { return a - b; });
      var r95 = rad[Math.floor(N * 0.95)];
      for (var i = 0; i < N; i++) {
        var r = Math.sqrt(X[i] * X[i] + Y[i] * Y[i] + Z[i] * Z[i]) / r95, f = r > 1 ? (1 + 0.25 * Math.tanh((r - 1) / 0.25)) / r : 1;
        X[i] *= f / r95; Y[i] *= f / r95; Z[i] *= f / r95;
      }
      // one group per colour, the unthemed subjects first so the themes draw over them
      groups = Object.keys(by).map(Number).sort(function (a, b) { return a - b; }).map(function (k) {
        return { t: k, colour: k < 0 ? D.noise : D.themes[k].colour, idx: by[k], noise: k < 0 };
      });
      // a name for each theme with at least ten squares, pointing at the square with most of its theme close by
      tags = D.themes.map(function (t, k) { return k; }).filter(function (k) { return by[k] && by[k].length >= 10; }).map(function (k) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cloud-tag";
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = "<i></i><span></span>";
        b.querySelector("i").style.background = D.themes[k].colour;
        b.querySelector("span").textContent = D.themes[k][lang];
        b.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") light(k); });
        b.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") light(-1); });
        b.addEventListener("focus", function () { light(k); });
        b.addEventListener("blur", function () { light(-1); });
        b.addEventListener("click", function () { lock(lockT === k ? -1 : k); });
        tagBox.append(b);
        return { t: k, el: b, at: densest(by[k]), side: -1, y: 0, to: 0, h: 0, q: null };
      });
      fig.classList.add("ready");
      size();
      window.addEventListener("resize", size);
      window.addEventListener("scroll", kick, { passive: true });
      // what each square is, for the card: fetched once the cloud is up
      get(C.data.subjects).then(function (s) { S = s; if (sel >= 0) fill(sel); }).catch(function () {});
      get(C.data.stats).then(function (s) { ST = s; if (sel >= 0) fill(sel); }).catch(function () {});
    }
    function densest(ix) {
      var step = Math.max(1, Math.floor(ix.length / 500)), best = ix[0], bn = -1, r2 = 0.15 * 0.15;
      for (var a = 0; a < ix.length; a += step) {
        var c = ix[a], n = 0;
        for (var b = 0; b < ix.length; b++) {
          var j = ix[b], dx = X[j] - X[c], dy = Y[j] - Y[c], dz = Z[j] - Z[c];
          if (dx * dx + dy * dy + dz * dz < r2) n++;
        }
        if (n > bn) { bn = n; best = c; }
      }
      return [X[best], Y[best], Z[best]];
    }
    function size() {
      W = canvas.getBoundingClientRect().width;
      narrow = W < 600;
      fig.classList.toggle("narrow", narrow);
      LW = narrow ? 0 : Math.round(Math.max(120, Math.min(170, W * 0.21)));
      H = Math.round(Math.max(320, Math.min(540, W * 0.75, window.innerHeight - 220)));
      canvas.style.height = H + "px";
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      tags.forEach(function (g) { g.el.style.width = narrow ? "" : LW + "px"; g.h = g.el.offsetHeight; g.side = -1; });
      kick();
    }

    // turned by the angle around the vertical, then tilted, then seen in perspective from 3.2 units away; zoomed in,
    // around the held cluster (or the square last chosen there): the view turns about it, and everything is magnified
    function project(turn) {
      var cy = Math.cos(turn), sy = Math.sin(turn), cp = Math.cos(pitch), sp = Math.sin(pitch), ox = piv[0], oy = piv[1], oz = piv[2];
      var s = (narrow ? Math.min(W * 0.42, H * 0.5) : Math.min(W / 2 - LW - 8, H * 0.48)) * zoomShown;
      V = function (x, y, z) {
        x -= ox; y -= oy; z -= oz;
        var x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, k = 3.2 / (3.2 - z2);
        return [W / 2 + x1 * k * s, H / 2 - y2 * k * s, z2];
      };
      for (var i = 0; i < N; i++) {
        var x0 = X[i] - ox, y0 = Y[i] - oy, z0 = Z[i] - oz, x1 = x0 * cy + z0 * sy, z1 = -x0 * sy + z0 * cy;
        var y2 = y0 * cp - z1 * sp, z2 = y0 * sp + z1 * cp, k = 3.2 / (3.2 - z2);
        PX[i] = W / 2 + x1 * k * s; PY[i] = H / 2 - y2 * k * s; PZ[i] = z2;
        PK[i] = Math.max(0, Math.min(SLABS - 1, Math.floor((z2 + 1) / 2 * SLABS)));
      }
    }
    function sizeOf(i) { return R[i] * (0.75 + 0.5 * (PZ[i] + 1) / 2) * Math.sqrt(zoomShown); }

    // the names beside the cloud, on their clusters' sides, in their order from top to bottom, pushed apart where they
    // would touch; they glide to their places
    function layout(dt) {
      var moving = false;
      tags.forEach(function (g) {
        g.q = V(g.at[0], g.at[1], g.at[2]);
        g.want = g.side < 0 ? (g.q[0] < W / 2 ? 0 : 1) : g.q[0] < W / 2 - 24 ? 0 : g.q[0] > W / 2 + 24 ? 1 : g.side;
      });
      var cap = Math.ceil(tags.length * 0.6);
      [0, 1].forEach(function (side) {
        var col = tags.filter(function (g) { return g.want === side; }).sort(function (a, b) { return side ? a.q[0] - b.q[0] : b.q[0] - a.q[0]; });
        for (var n = 0; n < col.length - cap; n++) col[n].want = 1 - side;
      });
      tags.forEach(function (g) { if (g.want !== g.side) { g.side = g.want; g.y = null; } });
      [0, 1].forEach(function (side) {
        var col = tags.filter(function (g) { return g.side === side; }).sort(function (a, b) { return a.q[1] - b.q[1]; });
        col.forEach(function (g, n) { g.to = Math.max(n ? col[n - 1].to + col[n - 1].h + GAP : 0, g.q[1] - 10); });
        for (var n = col.length - 1; n >= 0; n--) {
          var below = n === col.length - 1 ? H : col[n + 1].to - GAP;
          col[n].to = Math.max(0, Math.min(col[n].to, below - col[n].h));
        }
      });
      tags.forEach(function (g) {
        if (g.y === null || calm) g.y = g.to;
        else g.y += (g.to - g.y) * (1 - Math.exp(-dt / 120));
        if (Math.abs(g.to - g.y) > 0.5) moving = true; else g.y = g.to;
        g.el.classList.toggle("l", g.side === 0);
        g.el.classList.toggle("back", g.q[2] < -0.3);
        g.el.style.transform = "translate(" + (g.side === 0 ? 0 : W - LW) + "px," + g.y.toFixed(1) + "px)";
      });
      return moving;
    }
    function lines(on, f) {
      var ink = getComputedStyle(fig), dim = ink.getPropertyValue("--text-secondary").trim() || ink.color;
      tags.forEach(function (g) {
        if ((g.t === f) !== on) return;
        ctx.globalAlpha = on ? 1 : f >= 0 ? 0.12 * Math.max(0, 1 - (zoomShown - 1) / 0.5) : 0.3;
        ctx.strokeStyle = ctx.fillStyle = on ? ink.color : dim;
        ctx.lineWidth = on ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(g.side === 0 ? LW + 2 : W - LW - 2, g.y + 10);
        ctx.lineTo(g.q[0], g.q[1]);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(g.q[0], g.q[1], on ? 3 : 2, 0, 2 * Math.PI);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    function frame(ts) {
      raf = 0;
      var dt = last === null ? 16 : Math.min(64, ts - last), moving = false;
      last = ts;
      if (t0 === null) t0 = ts;
      // the arrival turn, a quarter turn easing out; the scroll's turn, gliding a moment behind the scroll; a drag's momentum
      var intro = calm ? 1 : Math.min(1, (ts - t0) / INTRO), spin = (1 - Math.pow(1 - intro, 3)) * Math.PI / 2;
      if (intro < 1) moving = true;
      if (!calm) {
        shownScroll += (window.scrollY - shownScroll) * (1 - Math.exp(-dt / 160));
        if (Math.abs(window.scrollY - shownScroll) < 0.5) shownScroll = window.scrollY; else moving = true;
      }
      if (!drag && (Math.abs(vy) > 1e-4 || Math.abs(vp) > 1e-4)) {
        vy *= Math.pow(0.93, dt / 16); vp *= Math.pow(0.93, dt / 16);
        yaw += vy; pitch = Math.max(-1.2, Math.min(1.2, pitch + vp));
        moving = true;
      }
      // the zoom glides too, and the view moves onto the held cluster over its first steps
      zoomShown = calm ? zoom : zoomShown + (zoom - zoomShown) * (1 - Math.exp(-dt / 120));
      if (Math.abs(zoom - zoomShown) < 0.002) zoomShown = zoom; else moving = true;
      var held = tags.filter(function (g) { return g.t === lockT; })[0], on = Math.min(1, (zoomShown - 1) / 0.8);
      if (zoom === 1) fp = -1;
      var aim = fp >= 0 ? [X[fp], Y[fp], Z[fp]] : held ? held.at : null;
      [0, 1, 2].forEach(function (a) {
        var to = aim ? aim[a] * on : 0;
        piv[a] = calm ? to : piv[a] + (to - piv[a]) * (1 - Math.exp(-dt / 160));
        if (Math.abs(to - piv[a]) > 1e-4) moving = true; else piv[a] = to;
      });
      project(yaw + spin + (calm ? 0 : shownScroll * SCROLL));
      if (!narrow && layout(dt)) moving = true;
      // a theme in focus (pointed at, or held) is drawn over the rest, which fades; with none, a chosen square's topic is
      var f = hoverT >= 0 ? hoverT : lockT, topic = f < 0 && sel >= 0 ? TP[sel] : null;
      fig.classList.toggle("lit", f >= 0);
      tags.forEach(function (g) { g.el.classList.toggle("on", g.t === f); });
      var dpr = canvas.width / W;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!narrow) lines(false, f);
      // zoomed in, the squares stay between the names' columns
      var clip = !narrow && zoomShown > 1.02;
      if (clip) { ctx.save(); ctx.beginPath(); ctx.rect(LW + 2, 0, W - 2 * LW - 4, H); ctx.clip(); }
      draw(groups.filter(function (g) { return g.t !== f; }), f >= 0 ? 0.15 : 1, topic);
      if (f >= 0) draw(groups.filter(function (g) { return g.t === f; }), 1, null);
      if (clip) ctx.restore();
      if (!narrow && f >= 0) lines(true, f);
      var zt = lockT < 0 ? "" : zoom > 1 ? L.zoomed : L.zoom;
      if (zhint.textContent !== zt) zhint.textContent = zt;
      ring(hover, 1);
      ring(sel, 2);
      if (sel >= 0) place();
      if (moving || drag) kick(); else last = null;
    }
    // back to front in slabs; the back of the cloud is fainter
    function draw(gs, fade, topic) {
      for (var k = 0; k < SLABS; k++) {
        var depth = 0.3 + 0.7 * (k + 0.5) / SLABS;
        gs.forEach(function (g) {
          ctx.fillStyle = g.colour;
          var a = (g.noise ? 0.4 : 0.9) * depth * fade, ix = g.idx;
          for (var n = 0; n < ix.length; n++) {
            var i = ix[n];
            if (PK[i] !== k) continue;
            ctx.globalAlpha = topic === null || TP[i] === topic ? a : a * 0.22;
            var r = sizeOf(i);
            ctx.fillRect(PX[i] - r / 2, PY[i] - r / 2, r, r);
          }
        });
      }
      ctx.globalAlpha = 1;
    }
    function ring(i, w) {
      if (i < 0) return;
      ctx.strokeStyle = getComputedStyle(fig).color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(PX[i], PY[i], sizeOf(i) / 2 + 5, 0, 2 * Math.PI);
      ctx.stroke();
    }
    function kick() { if (D && !raf) raf = window.requestAnimationFrame(frame); }
    function light(k) { hoverT = k; kick(); }
    function lock(k) {
      if (k < 0) zoom = 1;
      if (k !== lockT) fp = -1;
      lockT = k;
      tags.forEach(function (g) { g.el.setAttribute("aria-pressed", String(g.t === k)); });
      fig.classList.toggle("held", k >= 0);
      if (sel >= 0 && k >= 0 && TH[sel] !== k) choose(-1);
      kick();
    }

    // the square under a point of the canvas: the nearest one in front, within a few pixels (of the held theme, if any)
    function pick(e) {
      if (!D) return -1;
      var b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, best = -1, bz = -9;
      if (!narrow && zoomShown > 1.02 && (x < LW + 2 || x > W - LW - 2)) return -1;
      for (var i = 0; i < N; i++) {
        if (lockT >= 0 && TH[i] !== lockT) continue;
        var dx = PX[i] - x, dy = PY[i] - y, h = HIT + sizeOf(i) / 2;
        if (dx * dx + dy * dy <= h * h && PZ[i] > bz) { best = i; bz = PZ[i]; }
      }
      return best;
    }
    // the card: theme, subject, how often it comes up, and one bar of one-star reviews with a tick for all reviews
    function tpl(s, o) { return s.replace(/\{(\w)\}/g, function (m, k) { return o[k]; }); }
    function num(n) { var s = n.toLocaleString(fr ? "fr-CA" : "en-CA"); return fr ? s.replace(/\s/g, NNBSP) : s; }
    function pc(v) { v = Math.round(v * 100); return fr ? v + NNBSP + "%" : v + "%"; }
    function share(a) { return a[0] / (a.reduce(function (x, y) { return x + y; }, 0) || 1); }
    function fill(i) {
      var th = TH[i] >= 0 ? D.themes[TH[i]] : null, tp = TP[i] >= 0 ? D.topics[TP[i]][lang] : L.other, s = S && S[i];
      card.querySelector(".cloud-theme i").style.background = th ? th.colour : D.noise;
      card.querySelector(".cloud-theme span").textContent = th ? th[lang] : L.none;
      card.querySelector(".cloud-subject").textContent = s ? (s[0] === null ? tp : s[0]) : "…";
      var note = card.querySelector(".cloud-note"), box = card.querySelector(".cloud-more");
      note.textContent = s && s[0] === null ? L.screened : "";
      note.hidden = !(s && s[0] === null);
      box.textContent = "";
      if (!ST) return;
      var p = ST.points[i], own = p[2] >= 0, F = own ? ST.rich[p[2]] : TP[i] >= 0 ? ST.topics[TP[i]] : null;
      var cf = document.createElement("p");
      cf.className = "cf";
      cf.textContent = tpl(p[0] === 1 ? L.comment : L.comments, { n: num(p[0]) }) + " · " + (p[1] === null ? L.few_pharm : tpl(L.pharm, { n: num(p[1]) }));
      box.append(cf);
      if (!F) return;
      var v = share(F), all = share(ST.base), bar = document.createElement("span"), cv = document.createElement("p");
      bar.className = "c1";
      bar.setAttribute("aria-hidden", "true");
      bar.innerHTML = '<i style="width:' + (v * 100).toFixed(1) + '%"></i><b style="left:' + (all * 100).toFixed(1) + '%"></b>';
      cv.className = "cv";
      cv.textContent = own ? tpl(L.star, { p: pc(v), a: pc(all) }) : tpl(L.topic_star, { t: tp, p: pc(v), a: pc(all) });
      box.append(bar, cv);
    }
    function choose(i) {
      if (i >= 0 && zoom > 1) fp = i;
      sel = i;
      card.hidden = i < 0;
      if (i >= 0) fill(i);
      kick();
    }
    // the card beside its square, between the names' columns: turned to the other side or nudged in when it would leave
    function place() {
      card.style.maxHeight = (H - 8) + "px";
      var w = card.offsetWidth, h = card.offsetHeight, x = PX[sel] + 16, y = PY[sel] - h / 2, lo = LW + 4, hi = W - LW - 4;
      if (x + w > hi) x = PX[sel] - 16 - w;
      x = Math.max(lo, Math.min(hi - w, x));
      y = Math.max(4, Math.min(H - h - 4, y));
      card.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    }

    // dragging turns it: across turns it around, up and down tilts it; a press that barely moves picks a square
    canvas.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      vy = vp = 0;
      canvas.setPointerCapture(e.pointerId);
      kick();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) {
        if (e.pointerType !== "mouse") return;
        var h = pick(e);
        if (h !== hover) { hover = h; canvas.style.cursor = h >= 0 ? "pointer" : ""; kick(); }
        return;
      }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved < 5) return;
      fig.classList.add("dragging");
      hover = -1;
      vy = dx * 0.007; vp = dy * 0.005;
      yaw += vy; pitch = Math.max(-1.2, Math.min(1.2, pitch + vp));
      kick();
    });
    canvas.addEventListener("pointerup", function (e) {
      var tap = drag && drag.moved < 5;
      drag = null;
      fig.classList.remove("dragging");
      if (tap) { vy = vp = 0; choose(pick(e)); }
      kick();
    });
    canvas.addEventListener("pointercancel", function () { drag = null; fig.classList.remove("dragging"); kick(); });
    canvas.addEventListener("pointerleave", function () { if (hover >= 0) { hover = -1; canvas.style.cursor = ""; kick(); } });
    // with a theme held, the wheel over the cloud zooms (a trackpad's pinch comes as the wheel with Ctrl)
    function zoomBy(f) {
      zoom = Math.max(1, Math.min(ZMAX, zoom * f));
      if (zoom < 1.01) zoom = 1;
      kick();
    }
    canvas.addEventListener("wheel", function (e) {
      if (lockT < 0 || (zoom === 1 && e.deltaY > 0 && !e.ctrlKey)) return;
      e.preventDefault();
      var d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * H : e.deltaY;
      zoomBy(Math.exp(-Math.max(-120, Math.min(120, d)) * (e.ctrlKey ? 0.01 : 0.0025)));
    }, { passive: false });
    card.querySelector(".cloud-x").addEventListener("click", function () { choose(-1); });
    document.addEventListener("keydown", function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
      if (lockT >= 0 && (e.key === "+" || e.key === "=")) { zoomBy(1.4); return; }
      if (lockT >= 0 && (e.key === "-" || e.key === "_")) { zoomBy(1 / 1.4); return; }
      if (e.key !== "Escape") return;
      if (sel >= 0) choose(-1); else if (lockT >= 0) lock(-1);
    });
  }

  // ── the words beside a taller column of figures stay in view (Mohan, 21 Oct 2026: "Maintain the text while we scroll
  // down to read more plots", also when a table view opens): on the wide grid, a section whose figures run longer than
  // its words holds the words in place; words taller than the screen rest by their end, so none of them is hidden ──
  function keep() {
    var beats = all(".beat");
    if (!beats.length) return;
    function fit() {
      var b0 = document.querySelector(".tl-conf-band"), top = (b0 ? b0.offsetHeight : 48) + 24, wide = window.innerWidth >= 1280;
      beats.forEach(function (b) {
        var bt = b.querySelector(".bt"), bf = b.querySelector(".bf");
        var on = !!(wide && bt && bf && bf.offsetHeight > bt.offsetHeight + 24);
        b.classList.toggle("keep", on);
        if (on) b.style.setProperty("--keep-top", Math.min(top, window.innerHeight - bt.offsetHeight - 24) + "px");
        // and the other way round: figures stay in view beside words that run longer (Mohan, 22 Oct 2026, #48: the side
        // of a long section was empty on his screen)
        var hold = !!(wide && bt && bf && bt.offsetHeight > bf.offsetHeight + 24);
        b.classList.toggle("hold", hold);
        if (hold) b.style.setProperty("--hold-top", Math.min(top, window.innerHeight - bf.offsetHeight - 24) + "px");
      });
    }
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("load", fit);
    all(".beat details").forEach(function (d) { d.addEventListener("toggle", fit); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  // ── where you are ──
  function progress() {
    var queued = false;
    function update() {
      queued = false;
      var p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, root.scrollHeight - window.innerHeight)));
      root.style.setProperty("--p", p.toFixed(4));
    }
    window.addEventListener("scroll", function () {
      if (!queued) { queued = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // ── recording (?capture, for a preview video): no settling-in, which a frame-by-frame capture can't show; the
  // decade's scroll is exact, and the recording runs from the decade's opening to its end ──
  var capture = /[?&]capture\b/.test(location.search);

  // one copy's behaviours, once: the page itself on the hub, a language of it on telotia.com
  function start(s) {
    if (s.__telotia) return s.__telotia;
    scope = s;
    if (!capture) reveal();
    hero();
    cloud();
    keep();
    var scrub = decade();
    scope = document;
    s.__telotia = { scrub: scrub };
    return s.__telotia;
  }
  window.TelotiaArticle = { start: start };

  ready(function () {
    var copies = all("[data-lang-root]", document);
    var shown = copies.filter(function (c) { return window.getComputedStyle(c).display !== "none"; })[0];
    var scrub = start(copies.length ? shown || copies[0] : document).scrub;
    progress();
    if (capture && scrub) {
      var sec = document.querySelector(".decade");
      var range = function () {
        var r = sec.getBoundingClientRect(), top = r.top + window.scrollY;
        return { start: Math.max(0, top - 40), end: top + r.height - window.innerHeight };
      };
      window.__capture = function (y) {
        var g = range();
        window.scrollTo(0, g.start + y);
        return scrub();
      };
      window.__stage = function () { var g = range(); return { endY: g.end - g.start }; };
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
        window.dispatchEvent(new Event("resize"));
        window.__ready = true;
      });
    }
  });
})();
