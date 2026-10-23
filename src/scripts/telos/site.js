// Shared page behaviour: the wordmark, the header drawing it back into its T as the page scrolls, and the FR · EN switch.
// French by default; the choice stays in this browser only.
import { WORDMARK } from './wordmark.js';

// The wordmark's letters, one subpath each; its T (the tau, also the favicon) is the one that starts at the left edge.
const LETTERS = WORDMARK.d.split(/(?=M)/);
const leftOf = s => Math.min(...s.match(/-?\d+(?:\.\d+)?/g).filter((_, i) => i % 2 === 0).map(Number));
const T = LETTERS.reduce((a, b) => (leftOf(b) < leftOf(a) ? b : a));
const REST = LETTERS.filter(s => s !== T).join('');

export function initSite() {
  for (const el of document.querySelectorAll('[data-wordmark]')) {
    el.innerHTML = `<svg viewBox="0 0 ${WORDMARK.w} ${WORDMARK.h}" role="img" aria-label="Telotia"><path class="wm-t" fill="#282D32" d="${T}"/><path class="wm-rest" fill="#282D32" fill-rule="evenodd" d="${REST}"/><circle class="wm-dot" fill="#00545A" cx="${WORDMARK.dot[0]}" cy="${WORDMARK.dot[1]}" r="${WORDMARK.dot[2]}"/></svg>`;
  }

  // Once the page has moved, the header keeps only the T, so a wordmark further down the page (the story's) stands alone.
  const bar = document.querySelector('.bar');
  if (bar) {
    let queued = false;
    const update = () => { queued = false; bar.classList.toggle('compact', window.scrollY > 24); };
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  const root = document.documentElement;
  const set = lang => {
    root.dataset.lang = lang;
    root.lang = lang === 'fr' ? 'fr-CA' : 'en-CA';
    for (const b of document.querySelectorAll('.lang button')) b.setAttribute('aria-pressed', String(b.dataset.set === lang));
    const title = document.querySelector(`meta[name="title-${lang}"]`);
    if (title) document.title = title.content;
    try { localStorage.setItem('telotia-lang', lang); } catch (e) { /* private mode: the choice lasts for this page only */ }
  };
  set(root.dataset.lang === 'en' ? 'en' : 'fr');
  for (const b of document.querySelectorAll('.lang button')) b.addEventListener('click', () => set(b.dataset.set));
}
