// Source contours: vendored Lucide/Tabler icons; licenses in assets/resource-intro/morph.
// The particle sequence is a decorative brand motif, not a product workflow.
type Point = { x: number; y: number };
const names = ['handshake', 'building-bridge', 'scribble', 'star'] as const;
const count = 420, duration = 4200, hold = 2500;

async function loadContour(name: string): Promise<Point[]> {
  const response = await fetch(`/assets/resource-intro/morph/${name}.svg`);
  if (!response.ok) throw new Error(`Motion asset unavailable: ${name}`);
  const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  const paths = Array.from(doc.querySelectorAll<SVGPathElement>('path')).filter(path => path.getAttribute('stroke') !== 'none');
  const lengths = paths.map(path => path.getTotalLength());
  const total = lengths.reduce((a, b) => a + b, 0);
  return Array.from({ length: count }, (_, index) => {
    let position = (index + .5) / count * total, pathIndex = 0;
    while (pathIndex < paths.length - 1 && position > lengths[pathIndex]) position -= lengths[pathIndex++];
    const point = paths[pathIndex].getPointAtLength(position);
    return { x: (point.x - 12) / 24, y: (point.y - 12) / 24 };
  });
}
export async function mountCoordinationMotion(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const context = canvas.getContext('2d');
  const toggle = root.querySelector<HTMLButtonElement>('button')!;
  if (!context) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let shapes: Point[][];
  try { shapes = await Promise.all(names.map(loadContour)); } catch { return; }
  const noise = (index: number) => { const n = Math.sin(index * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  shapes[2] = shapes[2].map((p, i) => ({ x: p.x * .65 + (noise(i) - .5) * .55, y: p.y * .65 + (noise(i + count) - .5) * .55 }));
  let frame = 0, elapsed = 0, last = 0, paused = false, visible = true;
  let language = document.documentElement.lang.startsWith('fr') ? 'fr' : 'en';
  function label() {
    toggle.textContent = language === 'fr' ? (paused ? 'Reprendre l’animation' : 'Mettre en pause') : (paused ? 'Play animation' : 'Pause animation');
    toggle.setAttribute('aria-pressed', String(paused)); toggle.hidden = reduced.matches;
  }
  function draw(time: number) {
    const segment = Math.floor(time / duration) % shapes.length;
    const fraction = Math.max(0, (time % duration - hold) / (duration - hold));
    const t = fraction * fraction * (3 - 2 * fraction);
    const from = shapes[segment], to = shapes[(segment + 1) % shapes.length], size = canvas.width;
    context!.clearRect(0, 0, size, size); context!.fillStyle = '#00545A';
    for (let i = 0; i < count; i++) {
      const drift = Math.sin(t * Math.PI) * .055;
      const x = from[i].x + (to[i].x - from[i].x) * t + Math.sin(i * 2.4) * drift;
      const y = from[i].y + (to[i].y - from[i].y) * t + Math.cos(i * 1.7) * drift;
      context!.globalAlpha = .55 + noise(i + 99) * .4;
      context!.beginPath(); context!.arc(size * (.5 + x * .91), size * (.5 + y * .91), size * (.0038 + noise(i + 33) * .0016), 0, Math.PI * 2); context!.fill();
    }
    root.dataset.shape = names[segment]; root.dataset.phase = fraction > 0 ? 'morph' : 'hold';
  }
  function tick(now: number) {
    if (last) elapsed += now - last;
    last = now; draw(elapsed); frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); last = 0;
    if (reduced.matches) draw(0);
    else if (!paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
    root.dataset.playing = String(!reduced.matches && !paused && visible && !document.hidden); label();
  }
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
  document.addEventListener('resource-language', ((event: CustomEvent<string>) => { language = event.detail; label(); }) as EventListener);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(root);
  new ResizeObserver(() => { canvas.width = canvas.height = Math.round(root.clientWidth * Math.min(devicePixelRatio || 1, 2)); draw(reduced.matches ? 0 : elapsed); }).observe(root);
  root.dataset.ready = 'true'; draw(0); sync();
}
