import { lorenzCurve, type CurvePoint } from "./lorenz-curve";
// Continuous source-library contours morph into a numerically integrated attractor.
// The sequence is decorative; it does not depict a product workflow.
const names = ["handshake", "building-bridge", "lorenz", "cross-star"] as const;
const count = 4800,
  duration = 6000,
  hold = 3900;
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
    let position = ((index + 0.5) / count) * total,
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
  const canvas = root.querySelector<HTMLCanvasElement>("canvas")!,
    context = canvas.getContext("2d");
  const toggle = root.querySelector<HTMLButtonElement>("button")!;
  if (!context) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let shapes: CurvePoint[][];
  try {
    const [handshake, bridge, cross] = await Promise.all(
      ["handshake", "building-bridge", "cross-star"].map(loadContour),
    );
    shapes = [handshake, bridge, lorenzCurve(count), cross];
  } catch {
    return;
  }
  // Reuse the interpolation buffer to avoid per-frame garbage collection.
  const points = Array.from({ length: count }, () => ({ x: 0, y: 0, move: false }));
  let frame = 0,
    elapsed = 0,
    last = 0,
    paused = false,
    visible = true;
  let language = document.documentElement.lang.startsWith("fr") ? "fr" : "en";
  function label() {
    toggle.textContent =
      language === "fr"
        ? paused
          ? "Reprendre l’animation"
          : "Mettre en pause"
        : paused
          ? "Play animation"
          : "Pause animation";
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.hidden = reduced.matches;
  }
  function draw(time: number) {
    const segment = Math.floor(time / duration) % shapes.length;
    const fraction = Math.max(
      0,
      ((time % duration) - hold) / (duration - hold),
    );
    // Quintic easing has zero velocity and acceleration at both ends.
    const t =
      fraction * fraction * fraction * (fraction * (fraction * 6 - 15) + 10);
    const from = shapes[segment],
      to = shapes[(segment + 1) % shapes.length],
      size = canvas.width;
    const chaos =
      (segment === 2 ? 1 - t : 0) + ((segment + 1) % 4 === 2 ? t : 0);
    for (let i = 0; i < count; i++) {
      points[i].x = from[i].x + (to[i].x - from[i].x) * t;
      points[i].y = from[i].y + (to[i].y - from[i].y) * t;
      points[i].move = Boolean((t < 0.999 && from[i].move) || (t > 0.001 && to[i].move));
    }
    context!.clearRect(0, 0, size, size);
    context!.lineCap = "round";
    context!.lineJoin = "round";
    context!.strokeStyle = "#00545A";
    context!.lineWidth = (size / 264) * (1.15 - 0.65 * chaos);
    context!.globalAlpha = 0.88 - 0.46 * chaos;
    context!.beginPath();
    points.forEach((p, i) => {
      const x = size * (0.5 + p.x * 0.91),
        y = size * (0.5 + p.y * 0.91);
      if (!i || p.move) context!.moveTo(x, y);
      else context!.lineTo(x, y);
    });
    context!.stroke();
    // A moving ink trace follows the actual orbit; no flicker or scattered dots.
    if (chaos > 0.001) {
      const head = Math.floor((time * 0.12) % count),
        tail = 380;
      context!.globalAlpha = 0.65 * chaos;
      context!.lineWidth = (size / 264) * 0.85;
      context!.beginPath();
      for (let j = 0; j < tail; j++) {
        const i = (head + j) % count,
          p = points[i],
          x = size * (0.5 + p.x * 0.91),
          y = size * (0.5 + p.y * 0.91);
        if (!j || i === 0 || p.move) context!.moveTo(x, y);
        else context!.lineTo(x, y);
      }
      context!.stroke();
    }
    root.dataset.shape = names[segment];
    root.dataset.phase = fraction > 0 ? "morph" : "hold";
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
