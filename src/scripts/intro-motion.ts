// One reading sequence: information gains emphasis as the visitor moves toward
// professional judgment. Native scrolling owns the page; no scroll interception.
export function mountIntroMotion() {
  const title = document.querySelector<HTMLElement>('[data-reading-title]');
  const stage = document.querySelector<HTMLElement>('.reading-stage');
  const hero = document.querySelector<HTMLElement>('#hero-title');
  if (!title || !stage || !hero) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-section-link]'));
  const sections = links.map(link => document.getElementById(link.dataset.sectionLink!));
  let words: HTMLElement[] = [];
  let frame = 0;
  let entrances: Animation[] = [];
  let lines: HTMLElement[] = [];
  const about = document.querySelector<HTMLElement>('#about')!;
  const aboutHeading = about.querySelector<HTMLElement>('h2')!;
  const paragraphs = Array.from(about.querySelectorAll<HTMLElement>('p'));
  const audience = Array.from(document.querySelectorAll<HTMLElement>('.audience-panel'));
  const symbols = audience.map(panel => panel.querySelector<HTMLElement>('.audience-symbol')!);
  const desktop = matchMedia('(min-width: 768px) and (min-height: 650px)');
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const root = document.documentElement;
  root.classList.add('scroll-chapters');

  function update() {
    frame = 0;
    if (document.hidden) return;
    const height = window.innerHeight;
    const bounds = stage!.getBoundingClientRect();
    // Read all geometry before changing styles. Use layout positions so arrival
    // transforms do not feed back into the next frame when scrolling in reverse.
    const aboutTop = about.getBoundingClientRect().top;
    const panelTops = audience.map(panel => panel.offsetTop - window.scrollY);
    const travel = Math.max(1, Math.min(bounds.height - height * .38, height * .7));
    const progress = Math.max(0, Math.min(1, (height * .9 - bounds.top) / travel));
    const enter = clamp((height * .9 - bounds.top) / (height * .65));
    lines.forEach((line, index) => {
      const distance = (1 - enter) * (desktop.matches ? 100 : 32) * (index % 2 ? 1 : -1);
      line.style.transform = reduced.matches ? '' : `translateX(${distance}px) scale(${.92 + .08 * enter})`;
    });
    const aboutEnter = clamp((height * .85 - aboutTop) / (height * .6));
    aboutHeading.style.transform = reduced.matches ? '' : `translateX(${-56 * (1 - aboutEnter)}px)`;
    paragraphs.forEach((paragraph, index) => {
      const amount = clamp(aboutEnter * 1.4 - index * .25);
      paragraph.style.transform = reduced.matches ? '' : `translateY(${(1 - amount) * 72}px)`;
    });
    audience.forEach((panel, index) => {
      const arrival = smooth((height - panelTops[index]) / (height * .8));
      panel.style.transform = reduced.matches || desktop.matches ? '' : `translateY(${(1 - arrival) * 32}px)`;
      symbols[index].style.transform = reduced.matches ? '' : `rotate(${(1 - arrival) * (index ? -45 : 18)}deg) scale(${.72 + arrival * .28})`;
    });
    words.forEach((word, index) => {
      const amount = reduced.matches ? 1 : Math.max(0, Math.min(1, progress * words.length - index));
      word.classList.toggle('is-read', amount > .5);
      word.style.setProperty('--reading-weight', String(Math.round(400 + 100 * amount)));
    });
    let active = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= height * .4) active = index;
    });
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function schedule() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(update);
  }

  function prepare(animateEntrance = false) {
    entrances.forEach(animation => animation.cancel());
    entrances = [];
    const headline = hero!.textContent ?? '';
    hero!.setAttribute('aria-label', headline.replace(/\s+/g, ' '));
    hero!.replaceChildren(...headline.split('\n').map((line, index) => {
      const mask = document.createElement('span');
      mask.className = 'hero-line-mask';
      mask.setAttribute('aria-hidden', 'true');
      const ink = document.createElement('span');
      ink.className = 'hero-line';
      ink.textContent = line;
      mask.append(ink);
      if (animateEntrance && !reduced.matches && !location.hash) {
        entrances.push(ink.animate([
          { transform: 'translateY(105%)', opacity: .35 },
          { transform: 'translateY(0)', opacity: 1 },
        ], { duration: 760, delay: index * 90, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
      }
      return mask;
    }));

    const text = title!.textContent ?? '';
    title!.setAttribute('aria-label', text.replace(/\s+/g, ' '));
    words = [];
    lines = [];
    const fragment = document.createDocumentFragment();
    text.split('\n').forEach(lineText => {
      const line = document.createElement('span');
      line.className = 'reading-line';
      line.setAttribute('aria-hidden', 'true');
      lines.push(line);
      lineText.split(/(\s+)/).forEach(part => {
      if (/^\s+$/.test(part)) {
        line.append(document.createTextNode(part));
        return;
      }
      const word = document.createElement('span');
      word.className = 'reading-word';
      word.setAttribute('aria-hidden', 'true');
      const measure = document.createElement('span');
      measure.className = 'reading-word-measure';
      measure.textContent = part;
      const ink = document.createElement('span');
      ink.className = 'reading-word-ink';
      ink.textContent = part;
      word.append(measure, ink);
      words.push(word);
      line.append(word);
      });
      fragment.append(line);
    });
    title!.replaceChildren(fragment);
    title!.classList.toggle('reading-motion', !reduced.matches);
    schedule();
  }

  function languageChanged() { prepare(); }
  function preferenceChanged() {
    entrances.forEach(animation => animation.cancel());
    title!.classList.toggle('reading-motion', !reduced.matches);
    schedule();
  }
  function visibilityChanged() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  }
  prepare(true);
  document.fonts.ready.then(schedule);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('resource-language', languageChanged);
  document.addEventListener('visibilitychange', visibilityChanged);
  reduced.addEventListener('change', preferenceChanged);
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    cancelAnimationFrame(frame);
    entrances.forEach(animation => animation.cancel());
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('resource-language', languageChanged);
    document.removeEventListener('visibilitychange', visibilityChanged);
    reduced.removeEventListener('change', preferenceChanged);
  }, { once: true });
}
