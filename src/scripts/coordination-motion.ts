import type { CurvePoint } from './lorenz-curve';
import { THREAD_POINTS, shortOrbit, threadFrame, type ThreadShapes } from './thread-motion';
const count = THREAD_POINTS;
async function loadContour(name: string): Promise<CurvePoint[]> {
  const response = await fetch(`/assets/resource-intro/morph/${name}.svg`);
  if (!response.ok) throw new Error(`Motion asset unavailable: ${name}`);
  const doc = new DOMParser().parseFromString(
    await response.text(),
    "image/svg+xml",
  );
  const paths = Array.from(doc.querySelectorAll<SVGPathElement>("path")).filter(
    (path) => path.getAttribute("stroke") !== "none",
  );
  const lengths = paths.map((path) => path.getTotalLength()),
    total = lengths.reduce((a, b) => a + b, 0);
  let previous = -1;
  return Array.from({ length: count }, (_, index) => {
    let position = (index / (count - 1)) * total,
      pathIndex = 0;
    while (pathIndex < paths.length - 1 && position > lengths[pathIndex])
      position -= lengths[pathIndex++];
    const p = paths[pathIndex].getPointAtLength(position),
      move = pathIndex !== previous;
    previous = pathIndex;
    return { x: (p.x - 12) / 24, y: (p.y - 12) / 24, move };
  });
}
export async function mountCoordinationMotion(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!, context = canvas.getContext('2d');
  const toggle = root.querySelector<HTMLButtonElement>('button')!;
  if (!context) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let shapes: ThreadShapes;
  try {
    const [handshake, bridge, star] = await Promise.all(['handshake', 'building-bridge', 'cross-star'].map(loadContour));
    shapes = { handshake, bridge, star, orbit: shortOrbit() };
  } catch { return; }
  const points = Array.from({ length: count }, () => ({ x: 0, y: 0, move: false }));
  let frame = 0, elapsed = 0, last = 0, paused = false, visible = true;
  let language = document.documentElement.lang.startsWith('fr') ? 'fr' : 'en';
  function label() {
    toggle.textContent = language === 'fr'
      ? paused ? 'Reprendre l’animation' : 'Mettre en pause'
      : paused ? 'Play animation' : 'Pause animation';
    toggle.setAttribute('aria-pressed', String(paused)); toggle.hidden = reduced.matches;
  }
  function draw(time: number) {
    const state = threadFrame(time, shapes, points), size = canvas.width;
    context!.clearRect(0, 0, size, size);
    context!.lineCap = 'round'; context!.lineJoin = 'round';
    context!.strokeStyle = '#00545A'; context!.fillStyle = '#00545A';
    context!.lineWidth = size / 264 * 1.2;
    context!.beginPath();
    for (let i = 0; i < state.visible; i++) {
      const p = points[i], x = size * (.5 + p.x * .91), y = size * (.5 + p.y * .91);
      if (!i || p.move) context!.moveTo(x, y); else context!.lineTo(x, y);
    }
    if (state.closed) context!.closePath();
    if (state.fill > 0) { context!.globalAlpha = .88 * state.fill; context!.fill(); }
    context!.globalAlpha = .88; context!.stroke();
    root.dataset.shape = state.stage;
    root.dataset.phase = ['bridge', 'star', 'handshake'].includes(state.stage) ? 'hold' : 'morph';
  }
  function tick(now: number) {
    if (last) elapsed += now - last;
    last = now;
    draw(elapsed);
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    if (reduced.matches) draw(0);
    else if (!paused && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
    root.dataset.playing = String(
      !reduced.matches && !paused && visible && !document.hidden,
    );
    label();
  }
  toggle.addEventListener("click", () => {
    paused = !paused;
    sync();
    document.dispatchEvent(
      new CustomEvent("resource-motion", { detail: { paused } }),
    );
  });
  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("resource-language", ((
    event: CustomEvent<string>,
  ) => {
    language = event.detail;
    label();
  }) as EventListener);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(root);
  new ResizeObserver(() => {
    canvas.width = canvas.height = Math.round(
      root.clientWidth * Math.min(devicePixelRatio || 1, 2),
    );
    draw(reduced.matches ? 0 : elapsed);
  }).observe(root);
  root.dataset.ready = "true";
  draw(0);
  sync();
}
