import geometry from '../data/telotia-brand.json';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// Matched outline samples preserve the distinctive stem while filling its neck.
// Both endpoints use the approved exact Bézier paths, not a raster crossfade.
export function introBrandState(progress: number) {
  const p = clamp(progress);
  const u = ease(p);
  const move = ease((p - .02) / .98);
  let stem = geometry.sourceStem;
  if (p >= 1) stem = geometry.targetStem;
  else if (p > 0) {
    const points = geometry.start.map((point, i) => [
      point[0] + (geometry.end[i][0] - point[0]) * u,
      point[1] + (geometry.end[i][1] - point[1]) * u,
    ]);
    stem = `M${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length; i++) {
      const a = points[(i + points.length - 1) % points.length];
      const b = points[i];
      const c = points[(i + 1) % points.length];
      const d = points[(i + 2) % points.length];
      stem += `C${b[0] + (c[0] - a[0]) / 6} ${b[1] + (c[1] - a[1]) / 6} ${c[0] - (d[0] - b[0]) / 6} ${c[1] - (d[1] - b[1]) / 6} ${c[0]} ${c[1]}`;
    }
    stem += 'Z';
  }
  const b1 = 3 * (1 - move) ** 2 * move;
  const b2 = 3 * (1 - move) * move ** 2;
  const b3 = move ** 3;
  return {
    progress: p,
    stem,
    bar: `translate(577.1912994385 0) scale(${1 - .1 * u} 1) translate(-577.1912994385 0)`,
    dot: `translate(${-105 * b1 - 575 * b2 - 643.422 * b3} ${-62 * b1 - 112 * b2 - 79.88272727272727 * b3})`,
    suffix: `translate(${-65 * u} 0)`,
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
    bar!.setAttribute('transform', state.bar);
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
