import { attractor, sampleAttractor } from './task-loop-chaos';
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
  let progress = 0, width = 0, height = 0, frame = 0, last = 0, current = -1;
  let playing = false, visible = false, autoStarted = false, interacted = false;
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
      ctx!.globalAlpha = alpha; ctx!.fillStyle = '#617875';
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
        particle({ x: x + (j % 2) * (size + 4), y: y + Math.sin(clock * 5 + j) * 1.4 }, Math.sin(j + clock) * .12, .65 + seed(j + lane * 30) * .25);
      }
    }
    const chaosPoint = (index: number): Point => {
      const q = sampleAttractor(index);
      return { x: pool.x + q.x * width * (tall ? .21 : .135), y: pool.y + q.y * height * (tall ? .12 : .24) };
    };
    // A real Lorenz attractor gives the shared pool its two-lobed, folding
    // structure. Short moving strands retain the airy white composition.
    if (!reduced.matches) {
      for (let strand = 0; strand < 20; strand++) {
        const phase = mod(clock * .09 + strand / 20);
        const start = Math.floor(phase * (attractor.length - 160));
        ctx!.beginPath();
        for (let j = 0; j < 100; j += 2) {
          const q = chaosPoint(start + j);
          if (!j) ctx!.moveTo(q.x, q.y); else ctx!.lineTo(q.x, q.y);
        }
        ctx!.strokeStyle = '#93A8A3'; ctx!.globalAlpha = .32 * Math.min(1, phase * 15, (1 - phase) * 15); ctx!.lineWidth = .7; ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
    }
    // Each contextual particle enters and leaves at exactly the point where
    // its Lorenz segment starts/ends. This avoids the old pool position jumps.
    function flowPoint(i: number, t: number): Point {
      const start = seed(i + 7) * 4000;
      const a = tall ? p(.07 + seed(i) * .24, .20) : p(.06 + seed(i) * .22, .56);
      const target = tall ? p(.12 + seed(i + 12) * .55, .72 + seed(i + 13) * .14) : p(.72 + seed(i + 12) * .22, .21 + seed(i + 13) * .49);
      if (t < .26) return routePoint(a, chaosPoint(start), ease(t / .26), height * .08);
      if (t < .76) return chaosPoint(start + ease((t - .26) / .50) * 1000);
      return routePoint(chaosPoint(start + 1000), target, ease((t - .76) / .24), height * .08);
    }
    for (let i = 0; i < (tall ? 62 : 110); i++) {
      const t = mod(clock * (.29 + seed(i + 60) * .10) + seed(i + 2));
      const q = flowPoint(i, t);
      const fade = Math.min(1, t * 18, (1 - t) * 18);
      if (!reduced.matches) {
        const tail = flowPoint(i, Math.max(0, t - .009));
        ctx!.globalAlpha = fade * .22; ctx!.lineWidth = 1;
        segment(tail, q, '#617875'); ctx!.globalAlpha = 1;
      }
      particle(q, seed(i) * 2 + clock * .3, fade * .68, .8 + seed(i + 30) * .55);
    }
    // A loose field of circles represents professionals, distinct from tasks.
    for (let i = 0; i < (tall ? 25 : 56); i++) {
      const dot = tall ? p(.12 + seed(i + 220) * .63, .69 + seed(i + 320) * .20) : p(.72 + seed(i + 220) * .24, .18 + seed(i + 320) * .54);
      if (Math.hypot(dot.x - worker.x, dot.y - worker.y) < 20) continue;
      dot.y += Math.sin(clock * 2 + i) * 2;
      circle(dot, tall ? 2 : 2.8, '#8B9F9B', i % 5 ? '#8B9F9B' : '#FFFFFF');
    }
    const selected = s >= 2 && s <= 4;
    circle(worker, tall ? 4 : 5, selected ? '#617075' : '#8B9F9B', '#FFFFFF', 1.5);
    if (s === 2 || s === 3) {
      // The professional reaches for the task; the token never changes identity.
      const reach = s === 2 ? Math.sin(Math.PI * ease(f)) : 0;
      const endpoint = mix(worker, pool, reach * .25);
      segment(worker, endpoint, '#8B9F9B');
    }
    let task = origin;
    const trace: Point[] = [];
    function taskAt(step: number, fraction: number): Point {
      if (step === 1) return routePoint(origin, pool, ease(fraction), height * .18);
      if (step === 2) {
        const q = chaosPoint(1800 + ease(fraction) * 900), envelope = Math.sin(Math.PI * fraction) ** 2;
        return mix(pool, q, envelope);
      }
      if (step === 3) return routePoint(pool, worker, ease(fraction / .42), height * .08);
      if (step === 4) {
        const t = ease(fraction), z = 1 - t;
        const c1 = tall ? p(.93, .93) : p(.94, .08), c2 = tall ? p(.05, .66) : p(.11, .04);
        return { x: z ** 3 * worker.x + 3 * z * z * t * c1.x + 3 * z * t * t * c2.x + t ** 3 * home.x, y: z ** 3 * worker.y + 3 * z * z * t * c1.y + 3 * z * t * t * c2.y + t ** 3 * home.y };
      }
      return step >= 5 ? home : origin;
    }
    task = taskAt(s, f);
    if (!reduced.matches && [1, 2, 3, 4].includes(s)) {
      for (let j = 12; j >= 1; j--) trace.push(taskAt(s, Math.max(0, f - j * .012)));
      trace.forEach((q, i) => { ctx!.globalAlpha = .12 + i * .035; circle(q, 2.4, teal, teal); }); ctx!.globalAlpha = 1;
    }
    const token = tall ? 16 : 20;
    ctx!.save(); ctx!.translate(task.x, task.y);
    ctx!.rotate(s === 1 || s === 4 ? Math.sin(f * Math.PI) * .6 : 0);
    box(-token / 2 - 3, -token / 2 - 3, token + 6, token + 6, '#FFFFFF', '#FFFFFF', 5);
    box(-token / 2, -token / 2, token, token, teal, teal, 3);
    if (s === 6) {
      ctx!.beginPath(); ctx!.moveTo(-3, 0); ctx!.lineTo(-.5, 2.5); ctx!.lineTo(3.5, -2.5); ctx!.strokeStyle = '#FFFFFF'; ctx!.lineWidth = 1.3; ctx!.stroke();
    }
    ctx!.restore();
    const labelX = Math.max(25, Math.min(width - 25, task.x));
    box(labelX - 23, task.y - token / 2 - 30, 46, 22, '#FFFFFF', '#FFFFFF', 4);
    ctx!.font = '600 12px Inter, Arial, sans-serif'; ctx!.fillStyle = teal; ctx!.textAlign = 'center';
    ctx!.fillText('T-01', labelX, task.y - token / 2 - 18);
    // Restrained role labels ground the otherwise abstract particle field.
    text('Pharmacies', tall ? width * .18 : width * .17, tall ? height * .08 : height * .88, muted, 11);
    text('Pool', pool.x, tall ? height * .61 : height * .88, muted, 11);
    text('Remote pharmacists', tall ? width * .43 : width * .84, tall ? height * .95 : height * .88, muted, 11);
    if (s >= 5) box(home.x - 43, home.y + 13, 86, 19, '#FFFFFF', '#FFFFFF', 3);
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
    }
    render();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function schedule() { if (!frame && !document.hidden && visible) frame = requestAnimationFrame(tick); }
  function setProgress(value: number) {
    playing = false; interacted = true; last = 0; progress = Math.max(0, Math.min(1, value)); schedule();
  }
  function resize() {
    const rect = canvas!.parentElement!.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); schedule();
  }
  function preference() {
    if (reduced.matches) { playing = false; last = 0; }
    hint.textContent = reduced.matches ? 'Use the slider to explore' : 'Plays once on entry';
    resize();
  }
  document.documentElement.classList.add('task-loop-on');
  section.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input').forEach(control => { control.disabled = false; });
  play.addEventListener('click', () => {
    interacted = true;
    if (progress >= 1) progress = 0;
    playing = !playing && !reduced.matches; last = 0; schedule();
  });
  scrub.addEventListener('input', () => setProgress(Number(scrub.value) / 1000));
  const observer = new ResizeObserver(resize); observer.observe(canvas.parentElement!);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= .55; last = 0;
    if (visible && !autoStarted && !interacted && !reduced.matches) {
      autoStarted = true; progress = 0; playing = true;
    }
    if (visible) schedule();
  }, { threshold: [0, .55] });
  intersection.observe(canvas);
  document.addEventListener('visibilitychange', () => { last = 0; if (!document.hidden) schedule(); });
  reduced.addEventListener('change', preference);
  document.fonts.ready.then(schedule);
  preference(); resize(); render();
}
