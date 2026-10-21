import geometry from '../data/telotia-brand.json';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// Both the curved crossbar and stem morph to the approved solid compact mark.
// Exact native paths at either end avoid accumulating outline approximation.
function morph(source: string, target: string, start: number[][], end: number[][], amount: number) {
  if (amount <= 0) return source;
  if (amount >= 1) return target;
  const points = start.map((point, i) => [
    point[0] + (end[i][0] - point[0]) * amount,
    point[1] + (end[i][1] - point[1]) * amount,
  ]);
  let path = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length; i++) {
    const a = points[(i + points.length - 1) % points.length];
    const b = points[i];
    const c = points[(i + 1) % points.length];
    const d = points[(i + 2) % points.length];
    path += `C${b[0] + (c[0] - a[0]) / 6} ${b[1] + (c[1] - a[1]) / 6} ${c[0] - (d[0] - b[0]) / 6} ${c[1] - (d[1] - b[1]) / 6} ${c[0]} ${c[1]}`;
  }
  return path + 'Z';
}

export function introBrandState(progress: number) {
  const p = clamp(progress);
  const amount = ease((p - .025) / .95);
  const move = ease((p - .02) / .98);
  const b1 = 3 * (1 - move) ** 2 * move;
  const b2 = 3 * (1 - move) * move ** 2;
  const b3 = move ** 3;
  return {
    progress: p,
    stem: morph(geometry.sourceStem, geometry.targetStem, geometry.stemStart, geometry.stemEnd, amount),
    bar: morph(geometry.sourceBar, geometry.targetBar, geometry.barStart, geometry.barEnd, amount),
    dot: `translate(${-105 * b1 - 585 * b2 - 659.33543847625 * b3} ${-62 * b1 - 112 * b2 - 82.48596164702 * b3})`,
    suffix: `translate(${-55 * ease(p)} 0)`,
    opacity: 1 - ease(p / .7),
  };
}

export function mountIntroBrand() {
  const header = document.querySelector<HTMLElement>('[data-intro-header]');
  const svg = header?.querySelector<SVGSVGElement>('[data-intro-brand]');
  const bar = svg?.querySelector<SVGPathElement>('[data-brand-bar]');
  const stem = svg?.querySelector<SVGPathElement>('[data-brand-stem]');
  const dot = svg?.querySelector<SVGPathElement>('[data-brand-dot]');
  const suffix = svg?.querySelector<SVGGElement>('[data-brand-suffix]');
  if (!header || !svg || !bar || !stem || !dot || !suffix || header.dataset.brandMounted) return;
  header.dataset.brandMounted = 'true';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let target = 0;
  let frame = 0;
  let previous = 0;

  function paint() {
    const state = introBrandState(current);
    stem!.setAttribute('d', state.stem);
    bar!.setAttribute('d', state.bar);
    dot!.setAttribute('transform', state.dot);
    suffix!.setAttribute('transform', state.suffix);
    suffix!.setAttribute('opacity', String(state.opacity));
    svg!.dataset.progress = current.toFixed(4);
  }

  function tick(now: number) {
    frame = 0;
    if (document.hidden) return;
    const dt = Math.min(64, Math.max(1, now - previous));
    previous = now;
    current += (target - current) * (1 - Math.exp(-dt / 90));
    if (Math.abs(current - target) < .0002) current = target;
    paint();
    if (current !== target) frame = requestAnimationFrame(tick);
  }

  function schedule() {
    // A bounded native-scroll relationship; there is no wheel interception and
    // the fixed SVG viewport keeps every navigation item in its original place.
    target = clamp((window.scrollY - 16) / 240);
    header!.toggleAttribute('data-scrolled', window.scrollY > 8);
    if (reduced.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      current = target < .5 ? 0 : 1;
      paint();
    } else if (!frame && !document.hidden) {
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function visibilityChanged() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden) schedule();
  }

  function cleanup(event: PageTransitionEvent) {
    cancelAnimationFrame(frame);
    frame = 0;
    if (event.persisted) return;
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('pageshow', schedule);
    document.removeEventListener('visibilitychange', visibilityChanged);
    reduced.removeEventListener('change', schedule);
    delete header!.dataset.brandMounted;
  }

  target = clamp((window.scrollY - 16) / 240);
  current = reduced.matches ? (target < .5 ? 0 : 1) : target;
  paint();
  schedule();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', visibilityChanged);
  reduced.addEventListener('change', schedule);
  window.addEventListener('pagehide', cleanup);
}
