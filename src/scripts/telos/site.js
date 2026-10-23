// Shared page behaviour: the wordmark, and the FR · EN switch.
// French by default; the choice stays in this browser only.
import { WORDMARK } from './wordmark.js';

export function initSite() {
  for (const el of document.querySelectorAll('[data-wordmark]')) {
    el.innerHTML = `<svg viewBox="0 0 ${WORDMARK.w} ${WORDMARK.h}" role="img" aria-label="Telotia"><path fill="#282D32" fill-rule="evenodd" d="${WORDMARK.d}"/><circle fill="#00545A" cx="${WORDMARK.dot[0]}" cy="${WORDMARK.dot[1]}" r="${WORDMARK.dot[2]}"/></svg>`;
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
