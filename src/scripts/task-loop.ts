import { chaosPoint, cinematicFrame, cinematicTask, type Point } from './task-loop-cinematic';
import { ease, loopState, loopSteps } from './task-loop-model';

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
  function draw() {
    if (!width || !height) return;
    ctx!.clearRect(0, 0, width, height);
    const state = cinematicFrame(progress, reduced.matches);
    const step = loopState(progress).step;
    const mobile = width < 600;
    const project = (q: { x: number; y: number }) => ({
      x: width * (.5 + (q.x - state.camera.x) * state.camera.zoom * (mobile ? .92 : .86)),
      y: height * .48 + (q.y - state.camera.y) * state.camera.zoom * (mobile ? Math.min(height * .96, width) : height * .96),
    });
    // One camera follows a single token while its surrounding particles morph
    // from document to workload, attractor, professional field, and document.
    if (state.chaos > .01 && !reduced.matches) {
      for (let strand = 0; strand < 26; strand++) {
        const start = strand * 170 + progress * 1500;
        ctx!.beginPath();
        for (let j = 0; j < 125; j += 2) {
          const q = project(chaosPoint(start + j));
          if (!j) ctx!.moveTo(q.x, q.y); else ctx!.lineTo(q.x, q.y);
        }
        ctx!.globalAlpha = state.chaos * .36; ctx!.strokeStyle = '#8B9F9B'; ctx!.lineWidth = .8; ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
    }
    if (state.document > .01) {
      const a = project({ x: .265, y: .22 }), b = project({ x: .765, y: .81 });
      ctx!.globalAlpha = Math.min(1, state.document);
      box(a.x, a.y, b.x - a.x, b.y - a.y, '#D8E2DF', '#FFFFFF', 12);
      ctx!.globalAlpha = 1;
    }
    const size = (mobile ? 3.4 : 4.5) * state.camera.zoom;
    for (const particle of state.particles) {
      const q = project(particle);
      ctx!.globalAlpha = particle.opacity;
      ctx!.fillStyle = '#617875';
      ctx!.beginPath(); ctx!.roundRect(q.x - size / 2, q.y - size / 2, size, size, Math.max(.7, particle.round * size / 2)); ctx!.fill();
    }
    ctx!.globalAlpha = 1;
    // Selection comes from a professional. The contact dot stays gray so the
    // task remains the only teal object; final confirmation belongs to A.
    if (progress > .37 && progress < .50) {
      const q = project({ x: .72, y: .43 });
      const opacity = ease((progress - .37) / .04) * (1 - ease((progress - .46) / .04));
      ctx!.globalAlpha = opacity;
      circle(q, mobile ? 8 : 13, '#617075', '#FFFFFF', 1.5);
      ctx!.globalAlpha = 1;
    }
    if (!reduced.matches && progress > .12 && progress < 5 / 7) {
      ctx!.beginPath();
      for (let i = 16; i >= 0; i--) {
        const q = project(cinematicTask(Math.max(0, progress - i * .0009)));
        if (i === 16) ctx!.moveTo(q.x, q.y); else ctx!.lineTo(q.x, q.y);
      }
      ctx!.strokeStyle = teal; ctx!.lineWidth = mobile ? 2 : 2.5; ctx!.globalAlpha = .45; ctx!.stroke(); ctx!.globalAlpha = 1;
    }
    const task = project(state.task), token = mobile ? 17 : 22;
    ctx!.save(); ctx!.translate(task.x, task.y);
    const angle = progress > .12 && progress < 5 / 7 ? Math.sin(progress * Math.PI * 14) * .18 : 0;
    ctx!.rotate(angle);
    box(-token / 2 - 3, -token / 2 - 3, token + 6, token + 6, '#FFFFFF', '#FFFFFF', 5);
    box(-token / 2, -token / 2, token, token, teal, teal, 3);
    if (state.reviewed) {
      ctx!.beginPath(); ctx!.moveTo(-4, 0); ctx!.lineTo(-1, 3); ctx!.lineTo(4, -3); ctx!.strokeStyle = '#FFFFFF'; ctx!.lineWidth = 1.6; ctx!.stroke();
    }
    ctx!.restore();
    const labelX = Math.max(26, Math.min(width - 26, task.x));
    box(labelX - 24, task.y - token / 2 - 29, 48, 22, '#FFFFFF', '#FFFFFF', 4);
    ctx!.font = '600 12px Inter, Arial, sans-serif'; ctx!.fillStyle = teal; ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
    ctx!.fillText('T-01', labelX, task.y - token / 2 - 18);
    if (step === 3 || step === 5) {
      const f = loopState(progress).fraction;
      const scan = project({ x: .30, y: .41 + ease(f) * .33 });
      const end = project({ x: .70, y: .41 + ease(f) * .33 });
      ctx!.beginPath(); ctx!.moveTo(scan.x, scan.y); ctx!.lineTo(end.x, end.y);
      ctx!.strokeStyle = '#A3B3AF'; ctx!.lineWidth = 1; ctx!.stroke();
    }
    // One scene caption replaces three permanent role labels. The pharmacy
    // identity is repeated on the returned document and pinned in real text.
    const labels = ['Pharmacy A', 'Pharmacies → shared pool', 'Shared pool · selected by a remote pharmacist', 'Remote pharmacist · processing', 'Returning to Pharmacy A', 'Pharmacy A · review', 'Pharmacy A · reviewed'];
    text(labels[step], width * .5, height * .94, muted, mobile ? 10 : 12);
    if (state.document > .7) {
      const mark = project({ x: .69, y: .75 });
      text(step === 3 ? 'Remote' : 'A', mark.x, mark.y, muted, 11);
    }
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
