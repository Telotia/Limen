import { ease, loopState, loopSteps } from './task-loop-model';

type Point = { x: number; y: number };
const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function mountTaskLoop() {
  const section = document.querySelector<HTMLElement>('#task-story');
  const canvas = section?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!section || !canvas || !ctx) return;
  const title = section.querySelector<HTMLElement>('[data-loop-title]')!;


  const play = section.querySelector<HTMLButtonElement>('[data-play]')!;



  const scrub = section.querySelector<HTMLInputElement>('[data-scrub]')!;

  const hint = section.querySelector<HTMLElement>('[data-loop-hint]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 650px)');
  let progress = 0, width = 0, height = 0, frame = 0, last = 0, current = -1;
  let playing = false, visible = true, manual = false;
  const muted = '#617075', teal = '#00545A', line = '#DEE6E4';

  function text(value: string, x: number, y: number, color = muted, size = 13, align: CanvasTextAlign = 'center') {
    ctx!.font = `400 ${size}px Inter, Arial, sans-serif`;
    ctx!.fillStyle = color; ctx!.textAlign = align; ctx!.textBaseline = 'middle'; ctx!.fillText(value, x, y);
  }
  function box(x: number, y: number, w: number, h: number, stroke = line, fill = '#FFFFFF', radius = 7) {
    ctx!.beginPath(); ctx!.roundRect(x, y, w, h, radius); ctx!.fillStyle = fill; ctx!.fill(); ctx!.strokeStyle = stroke; ctx!.lineWidth = 1; ctx!.stroke();
  }
  function circle(p: Point, radius: number, stroke = '#A7B6B4', fill = '#FFFFFF', weight = 1) {
    ctx!.beginPath(); ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx!.fillStyle = fill; ctx!.fill(); ctx!.strokeStyle = stroke; ctx!.lineWidth = weight; ctx!.stroke();
  }
  function segment(a: Point, b: Point, color = line, dash = false) {
    ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y); ctx!.strokeStyle = color; ctx!.lineWidth = 1; ctx!.setLineDash(dash ? [3, 5] : []); ctx!.stroke(); ctx!.setLineDash([]);
  }
  function routePoint(a: Point, b: Point, t: number, lift: number): Point {
    const point = mix(a, b, t); point.y -= Math.sin(t * Math.PI) * lift; return point;
  }

  // Seeded positions keep backwards scrubbing continuous and reproducible.
  const seed = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const mod = (n: number) => ((n % 1) + 1) % 1;
  function draw() {
    if (!width || !height) return;
    ctx!.clearRect(0, 0, width, height);
    const { step: s, fraction: f } = loopState(progress);
    const tall = width < 600;
    const p = (x: number, y: number): Point => ({ x: x * width, y: y * height });
    const origin = tall ? p(.19, .22) : p(.17, .55);
    const pool = tall ? p(.72, .48) : p(.51, .58);
    const worker = tall ? p(.32, .78) : p(.83, .46);
    const home = tall ? p(.19, .34) : p(.17, .72);
    const clock = progress * 5;
    const size = tall ? 4 : 5;
    function particle(point: Point, angle: number, alpha = .55, scale = 1) {
      ctx!.save(); ctx!.translate(point.x, point.y); ctx!.rotate(angle);
      ctx!.globalAlpha = alpha; ctx!.fillStyle = '#849592';
      ctx!.beginPath(); ctx!.roundRect(-size * scale / 2, -size * scale / 2, size * scale, size * scale, 1); ctx!.fill(); ctx!.restore();
    }
    // Uneven pharmacy workloads dissolve into a shared stream, rather than
    // becoming diagram nodes. Only the source lane has a small identity marker.
    for (let lane = 0; lane < 5; lane++) {
      const x = tall ? width * (.065 + lane * .062) : width * (.06 + lane * .055);
      const bottom = tall ? height * .35 : height * .76;
      const n = [18, 9, 26, 12, 21][lane];
      for (let j = 0; j < n; j++) {
        const y = bottom - Math.floor(j / 2) * (size + 4);
        particle({ x: x + (j % 2) * (size + 4), y: y + Math.sin(clock * 5 + j) * 1.4 }, Math.sin(j + clock) * .12, .25 + seed(j + lane * 30) * .35);
      }
    }
    // Background tasks have staggered departures, eddies in the pool and
    // arrivals among professionals. No arrows or permanent connecting paths.
    for (let i = 0; i < (tall ? 48 : 96); i++) {
      const t = mod(clock * (.38 + seed(i + 60) * .15) + seed(i + 2));
      const a = tall ? p(.07 + seed(i) * .24, .20) : p(.06 + seed(i) * .22, .56);
      let q: Point;
      if (t < .36) q = routePoint(a, pool, ease(t / .36), (seed(i + 5) - .7) * height * .3);
      else if (t < .67) {
        const theta = (t - .36) * 12 + seed(i + 7) * Math.PI * 2;
        const r = (.025 + seed(i + 9) * .085) * Math.sin(Math.PI * (t - .36) / .31);
        q = { x: pool.x + Math.cos(theta) * width * r, y: pool.y + Math.sin(theta) * height * r * 1.8 };
      } else {
        const target = tall ? p(.12 + seed(i + 12) * .55, .72 + seed(i + 13) * .14) : p(.72 + seed(i + 12) * .22, .21 + seed(i + 13) * .49);
        q = routePoint(pool, target, ease((t - .67) / .33), height * .12);
      }
      const fade = Math.min(1, t * 12, (1 - t) * 12);
      particle(q, seed(i) * 2 + clock * .5, fade * .32, .75 + seed(i + 30) * .55);
    }
    // A loose field of circles represents professionals, distinct from tasks.
    for (let i = 0; i < (tall ? 25 : 56); i++) {
      const dot = tall ? p(.12 + seed(i + 220) * .63, .69 + seed(i + 320) * .20) : p(.72 + seed(i + 220) * .24, .18 + seed(i + 320) * .54);
      if (Math.hypot(dot.x - worker.x, dot.y - worker.y) < 20) continue;
      dot.y += Math.sin(clock * 2 + i) * 2;
      circle(dot, tall ? 2 : 2.8, '#AAB7B4', i % 5 ? '#AAB7B4' : '#FFFFFF');
    }
    const selected = s >= 2 && s <= 4;
    circle(worker, tall ? 4 : 5, selected ? '#617075' : '#AAB7B4', '#FFFFFF', 1.5);
    if (s === 2 || s === 3) {
      // The professional reaches for the task; the token never changes identity.
      const reach = s === 2 ? Math.sin(Math.PI * ease(f)) : 0;
      const endpoint = mix(worker, pool, reach * .25);
      segment(worker, endpoint, '#AAB7B4');
    }
    let task = origin;
    const trace: Point[] = [];
    function taskAt(step: number, fraction: number): Point {
      if (step === 1) return routePoint(origin, pool, ease(fraction), height * .18);
      if (step === 2) return { x: pool.x + Math.sin(fraction * Math.PI * 2) * 7, y: pool.y + (1 - Math.cos(fraction * Math.PI * 2)) * 5 };
      if (step === 3) return routePoint(pool, worker, ease(fraction / .42), height * .08);
      if (step === 4) {
        const t = ease(fraction), z = 1 - t;
        const c1 = tall ? p(.93, .93) : p(.94, .08), c2 = tall ? p(.05, .66) : p(.11, .04);
        return { x: z ** 3 * worker.x + 3 * z * z * t * c1.x + 3 * z * t * t * c2.x + t ** 3 * home.x, y: z ** 3 * worker.y + 3 * z * z * t * c1.y + 3 * z * t * t * c2.y + t ** 3 * home.y };
      }
      return step >= 5 ? home : origin;
    }
    task = taskAt(s, f);
    if (!reduced.matches && [1, 3, 4].includes(s)) {
      for (let j = 12; j >= 1; j--) trace.push(taskAt(s, Math.max(0, f - j * .012)));
      trace.forEach((q, i) => { ctx!.globalAlpha = .03 + i * .014; circle(q, 2, teal, teal); }); ctx!.globalAlpha = 1;
    }
    const token = tall ? 10 : 12;
    ctx!.save(); ctx!.translate(task.x, task.y);
    ctx!.rotate(s === 1 || s === 4 ? Math.sin(f * Math.PI) * .6 : 0);
    box(-token / 2, -token / 2, token, token, teal, s === 4 || s === 5 ? '#FFFFFF' : teal, 2);
    if (s === 6) {
      ctx!.beginPath(); ctx!.moveTo(-3, 0); ctx!.lineTo(-.5, 2.5); ctx!.lineTo(3.5, -2.5); ctx!.strokeStyle = '#FFFFFF'; ctx!.lineWidth = 1.3; ctx!.stroke();
    }
    ctx!.restore();
    text('T-01', Math.max(23, Math.min(width - 23, task.x)), task.y - 21, teal, 11);
    // Restrained role labels ground the otherwise abstract particle field.
    text('Pharmacies', tall ? width * .18 : width * .17, tall ? height * .08 : height * .88, muted, 11);
    text('Pool', pool.x, tall ? height * .61 : height * .88, muted, 11);
    text('Remote pharmacists', tall ? width * .43 : width * .84, tall ? height * .95 : height * .88, muted, 11);
    text(s >= 5 ? s === 6 ? 'A · Reviewed' : 'A · Review' : 'A', home.x, home.y + 22, teal, 10);
  }

  function render() {
    const state = loopState(progress);
    if (state.step !== current) {
      current = state.step;
      title.textContent = ['One task, from Pharmacy A.', 'Into the shared pool.', 'A remote pharmacist selects it.', 'Professional work, in progress.', 'Back to Pharmacy A.', 'Pharmacy A reviews the work.', 'Reviewed. The loop is complete.'][current];
      scrub.setAttribute('aria-valuetext', loopSteps[current].title);
    }
    scrub.value = String(Math.round(progress * 1000));
    play.textContent = playing ? 'Pause' : progress >= 1 ? 'Replay' : 'Play';
    play.setAttribute('aria-pressed', String(playing));
    draw();
  }
  function tick(time: number) {
    frame = 0;
    if (document.hidden || !visible) { last = 0; return; }
    if (playing) {
      if (last) progress = Math.min(1, progress + Math.min(80, time - last) / 24500);
      last = time;
      if (progress === 1) playing = false;
      syncScroll();
    }
    render();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function schedule() { if (!frame && !document.hidden && visible) frame = requestAnimationFrame(tick); }
  function setProgress(value: number) {
    playing = false; manual = true; last = 0; progress = Math.max(0, Math.min(1, value)); syncScroll(); schedule();
  }
  function syncScroll() {
    // Seeking and playback keep the native scroll position in sync, so taking
    // over with the wheel never jumps back to an unrelated chapter.
    if (!reduced.matches && !short.matches && visible) window.scrollTo({ top: section!.offsetTop + progress * (section!.offsetHeight - innerHeight), behavior: 'instant' });
  }
  function scroll() {
    if (manual || reduced.matches || short.matches) return;
    progress = Math.max(0, Math.min(1, -section!.getBoundingClientRect().top / Math.max(1, section!.offsetHeight - innerHeight)));
    schedule();
  }
  function userScroll() { manual = false; playing = false; last = 0; scroll(); }
  function resize() {
    const rect = canvas!.parentElement!.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); schedule();
  }
  function preference() {
    if (reduced.matches) { playing = false; last = 0; }
    hint.textContent = reduced.matches ? 'Use the slider to explore' : 'Scroll to follow';
    resize();
  }
  document.documentElement.classList.add('task-loop-on');
  section.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input').forEach(control => { control.disabled = false; });
  play.addEventListener('click', () => {
    manual = true;
    if (progress >= 1) progress = 0;
    playing = !playing && !reduced.matches; last = 0; schedule();
  });
  scrub.addEventListener('input', () => setProgress(Number(scrub.value) / 1000));
  const observer = new ResizeObserver(resize); observer.observe(canvas.parentElement!);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; last = 0; if (visible) schedule(); });
  intersection.observe(canvas);
  document.addEventListener('visibilitychange', () => { last = 0; if (!document.hidden) schedule(); });
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('wheel', userScroll, { passive: true });
  window.addEventListener('touchmove', userScroll, { passive: true });
  window.addEventListener('keydown', event => {
    if (event.target instanceof HTMLElement && /INPUT|BUTTON|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' '].includes(event.key)) userScroll();
  });
  reduced.addEventListener('change', preference);
  short.addEventListener('change', resize);
  document.fonts.ready.then(schedule);
  preference(); resize(); render();
}
