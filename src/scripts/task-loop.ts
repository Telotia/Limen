import { ease, loopState, loopSteps } from './task-loop-model';

type Point = { x: number; y: number };
const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function mountTaskLoop() {
  const section = document.querySelector<HTMLElement>('#task-story');
  const canvas = section?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!section || !canvas || !ctx) return;
  const title = section.querySelector<HTMLElement>('[data-loop-title]')!;
  const body = section.querySelector<HTMLElement>('[data-loop-body]')!;
  const count = section.querySelector<HTMLElement>('[data-loop-count]')!;
  const play = section.querySelector<HTMLButtonElement>('[data-play]')!;
  const previous = section.querySelector<HTMLButtonElement>('[data-previous]')!;
  const next = section.querySelector<HTMLButtonElement>('[data-next]')!;
  const replay = section.querySelector<HTMLButtonElement>('[data-replay]')!;
  const scrub = section.querySelector<HTMLInputElement>('[data-scrub]')!;
  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-step]'));
  const hint = section.querySelector<HTMLElement>('[data-loop-hint]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 650px)');
  let progress = 0, width = 0, height = 0, frame = 0, last = 0, current = -1;
  let playing = false, visible = true, manual = false;
  const ink = '#282D32', muted = '#617075', teal = '#00545A', line = '#DEE6E4';

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
  function queue(x: number, bottom: number, columns: number, n: number, cell = 6) {
    ctx!.fillStyle = '#A2B0AE';
    for (let i = 0; i < n; i++) {
      ctx!.beginPath(); ctx!.roundRect(x + (i % columns) * (cell + 3), bottom - Math.floor(i / columns) * (cell + 3), cell, cell, 1); ctx!.fill();
    }
  }
  function routePoint(a: Point, b: Point, t: number, lift: number): Point {
    const point = mix(a, b, t); point.y -= Math.sin(t * Math.PI) * lift; return point;
  }

  function draw() {
    if (!width || !height) return;
    ctx!.clearRect(0, 0, width, height);
    const state = loopState(progress), s = state.step, f = state.fraction;
    const tall = width < 600;
    const p = (x: number, y: number): Point => ({ x: x * width, y: y * height });
    const origin = tall ? p(.21, .24) : p(.16, .48);
    const pool = tall ? p(.70, .48) : p(.51, .51);
    const pharmacist = tall ? p(.25, .80) : p(.83, .45);
    const review = tall ? p(.21, .43) : p(.16, .80);
    const font = tall ? 11 : 13;

    // A continuous guide connects the three roles. The highlighted square is
    // always the same task; the rest of the queue is visual context only.
    segment(origin, pool); segment(pool, pharmacist);
    ctx!.beginPath(); ctx!.moveTo(pharmacist.x, pharmacist.y);
    if (tall) ctx!.bezierCurveTo(width * .04, height * .74, width * .03, height * .32, review.x, review.y);
    else ctx!.bezierCurveTo(width * .90, height * .04, width * .04, height * .04, review.x, review.y);
    ctx!.strokeStyle = s >= 4 ? '#91B8B5' : line; ctx!.lineWidth = 1; ctx!.setLineDash([3, 6]); ctx!.stroke(); ctx!.setLineDash([]);

    // Origin: Pharmacy A is a stable, named lane. Other pharmacies never
    // receive the highlighted returned task.
    if (!tall) {
      [.08, .24].forEach((x, i) => {
        const column = p(x, .37); box(column.x - 22, column.y, 44, height * .30);
        queue(column.x - 13, height * .64, 3, i ? 22 : 11, 6);
        text(i ? 'C' : 'B', column.x, height * .72, muted, 11);
      });
    }
    const laneW = tall ? 62 : 64, laneTop = tall ? height * .12 : height * .31;
    const laneBottom = tall ? height * .52 : height * .90;
    box(origin.x - laneW / 2, laneTop, laneW, laneBottom - laneTop, teal, '#F6FAF9', 9);
    queue(origin.x - 17, tall ? height * .30 : height * .65, 4, tall ? 4 : 24, tall ? 5 : 6);
    text('Pharmacy A', origin.x, Math.max(10, laneTop - 16), teal, font);
    box(review.x - 24, review.y - 16, 48, 32, s >= 5 ? teal : '#B4C8C5', '#FFFFFF', 5);
    if (!tall) text(s === 6 ? 'Reviewed at A' : 'Review at A', origin.x, height * .96, s >= 5 ? teal : muted, font);
    else text(s === 6 ? 'Reviewed' : s === 5 ? 'Awaiting review' : 'Review at A', origin.x, height * .59, teal, font);

    const poolW = tall ? Math.min(100, width * .32) : width * .17;
    const poolH = tall ? height * .20 : height * .36;
    box(pool.x - poolW / 2, pool.y - poolH / 2, poolW, poolH, '#A3BDB9', '#FBFCFC', 9);
    const queueCount = tall ? 12 : 36, columns = tall ? 5 : 9;
    queue(pool.x - (columns * 9 - 3) / 2, pool.y + poolH / 2 - 15, columns, queueCount, 6);
    text('Platform pool', pool.x, pool.y - poolH / 2 - 18, ink, font);
    if (!tall) text('Origin stays attached', pool.x, pool.y + poolH / 2 + 25, muted, 12);

    // Circle = professional; square = task. A deliberate selection link grows
    // from the pharmacist toward the held task before processing starts.
    const radius = tall ? 20 : 26;
    for (let i = 0; i < (tall ? 6 : 14); i++) {
      const column = i % (tall ? 3 : 4), row = Math.floor(i / (tall ? 3 : 4));
      const dot = tall ? p(.12 + column * .14, .64 + row * .19) : p(.74 + column * .055, .26 + row * .13);
      if (Math.hypot(dot.x - pharmacist.x, dot.y - pharmacist.y) > radius + 12) circle(dot, tall ? 3 : 4, '#AFBCBA', i % 3 ? '#AFBCBA' : '#FFFFFF');
    }
    circle(pharmacist, radius, s >= 2 ? teal : '#9BB0AD', '#FFFFFF', s >= 2 ? 2 : 1);
    text(tall ? 'Remote pharmacist' : 'Remote pharmacists', pharmacist.x, tall ? Math.min(height - 8, height * .96) : height * .91, ink, font);
    if (s === 2) {
      const selection = mix(pharmacist, pool, ease((f - .12) / .65));
      segment(pharmacist, selection, teal, true);
      circle(pharmacist, radius + 5 * ease(f), teal, '#FFFFFF', 1);
    }

    let task = origin;
    if (s === 1) task = routePoint(origin, pool, ease((f - .1) / .7), tall ? -15 : height * .13);
    else if (s === 2) task = pool;
    else if (s === 3) task = routePoint(pool, pharmacist, ease(f / .35), tall ? -10 : height * .08);
    else if (s === 4) {
      const t = ease((f - .08) / .82), a = pharmacist, b = review;
      const c1 = tall ? p(.04, .74) : p(.90, .04), c2 = tall ? p(.03, .32) : p(.04, .04);
      const z = 1 - t;
      task = { x: z ** 3 * a.x + 3 * z ** 2 * t * c1.x + 3 * z * t ** 2 * c2.x + t ** 3 * b.x, y: z ** 3 * a.y + 3 * z ** 2 * t * c1.y + 3 * z * t ** 2 * c2.y + t ** 3 * b.y };
    } else if (s >= 5) task = review;

    if (s === 3) {
      ctx!.beginPath(); ctx!.arc(pharmacist.x, pharmacist.y, radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ease((f - .35) / .65));
      ctx!.strokeStyle = teal; ctx!.lineWidth = 2; ctx!.stroke();
    }
    const size = tall ? 12 : 16;
    box(task.x - size / 2, task.y - size / 2, size, size, teal, s >= 4 && s < 6 ? '#FFFFFF' : teal, 3);
    // This label follows the same token on every frame; source is also pinned
    // in the real-text caption for screen readers and small displays.
    const tagX = Math.max(33, Math.min(width - 33, task.x));
    text('T-01', tagX, task.y - size / 2 - 12, teal, tall ? 10 : 12);
    if (s === 5 && !tall) text('Awaiting Pharmacy A review', origin.x, review.y + 34, teal, 12);
    if (s === 6) {
      ctx!.beginPath(); ctx!.moveTo(task.x - 4, task.y); ctx!.lineTo(task.x - 1, task.y + 3); ctx!.lineTo(task.x + 4, task.y - 3);
      ctx!.strokeStyle = '#FFFFFF'; ctx!.lineWidth = 1.5; ctx!.stroke();
    }
  }

  function render() {
    const state = loopState(progress);
    if (state.step !== current) {
      current = state.step;
      title.textContent = loopSteps[current].title; body.textContent = loopSteps[current].body;
      count.textContent = `${current + 1} / ${loopSteps.length}`;
      buttons.forEach((button, i) => i === current ? button.setAttribute('aria-current', 'step') : button.removeAttribute('aria-current'));
    }
    scrub.value = String(Math.round(progress * 1000));
    previous.disabled = current === 0; next.disabled = current === loopSteps.length - 1;
    play.textContent = playing ? 'Pause' : progress >= 1 ? 'Play again' : 'Play the loop';
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
    hint.textContent = reduced.matches ? 'Reduced motion: use the step buttons or read the complete journey below.' : 'Scroll to follow the task, or use the playback controls.';
    resize();
  }
  document.documentElement.classList.add('task-loop-on');
  section.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input').forEach(control => { control.disabled = false; });
  play.addEventListener('click', () => {
    manual = true;
    if (progress >= 1) progress = 0;
    playing = !playing && !reduced.matches; last = 0; schedule();
  });
  previous.addEventListener('click', () => setProgress(Math.max(0, loopState(progress).step - 1) / loopSteps.length + .04));
  next.addEventListener('click', () => setProgress(Math.min(loopSteps.length - 1, loopState(progress).step + 1) / loopSteps.length + .04));
  replay.addEventListener('click', () => { setProgress(0); playing = !reduced.matches; schedule(); });
  scrub.addEventListener('input', () => setProgress(Number(scrub.value) / 1000));
  buttons.forEach((button, i) => button.addEventListener('click', () => setProgress(i / loopSteps.length + .08)));
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
