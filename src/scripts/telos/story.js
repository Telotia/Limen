// Scroll orchestration for the homepage story.
// ScrollTrigger pins the stage and scrubs one timeline; the timeline drives story time for the
// canvas (which draws everything, Telotia's line and point included) and swaps the words.
// Wide screens get the wide layout, phones the tall one; reduced motion gets the static version.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { createEngine } from './engine.js';

export function initStory() {
  const cv = document.getElementById('story-canvas');
  if (!cv) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });       // the address bar coming and going is not a resize
  const capture = new URLSearchParams(location.search).has('capture');
  const engines = {};

  gsap.matchMedia().add({
    wide: '(min-width: 760px) and (prefers-reduced-motion: no-preference)',
    tall: '(max-width: 759px) and (prefers-reduced-motion: no-preference)',
  }, context => {
    const { wide, tall } = context.conditions;
    if (!wide && !tall) return;
    const kind = tall ? 'tall' : 'wide';
    const E = engines[kind] = engines[kind] || createEngine({ tall });
    const root = document.documentElement;
    root.classList.add('story-on');                            // shows the story, hides the static version
    root.classList.toggle('story-tall', tall);
    const ctx = cv.getContext('2d');
    const frame = document.getElementById('story-frame');
    const viewport = document.getElementById('story-viewport');
    const story = { t: 0 };
    let scale = 1, dpr = 1, lenis = null, raf = null, st = null, alive = true;

    const render = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      const k = scale * dpr;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      E.draw(ctx, story.t);
    };
    const layout = () => {
      const vw = viewport.clientWidth, vh = viewport.clientHeight;
      scale = Math.min(vw / E.W, vh / E.H);
      frame.style.transform = `translate(${(vw - E.W * scale) / 2}px, ${(vh - E.H * scale) / 2}px) scale(${scale})`;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(E.W * scale * dpr);
      cv.height = Math.round(E.H * scale * dpr);
      render();
      frame.style.opacity = '1';
    };
    const onResize = () => { layout(); ScrollTrigger.refresh(); };

    // Built once fonts are ready; context.add keeps these animations in the media query's context,
    // so they are reverted cleanly when the layout changes or reduced motion is switched on.
    document.fonts.ready.then(() => context.add(() => {
      if (!alive) return;
      layout();
      const words = sel => SplitText.create(sel, { type: 'words', mask: 'words' }).words;
      const tl = gsap.timeline({ defaults: { ease: 'none' } });
      tl.to(story, { t: E.TT, duration: E.TT, ease: 'none', onUpdate: render }, 0);

      // Here, elsewhere; first a link, then a whole system; and the end it all points to.
      const s1 = words('.s1 .t'), s2 = words('.s2 .t'), s3a = words('.s3 .a'), s3b = words('.s3 .b'), s5 = words('.s5 .t');
      const out = (w, at) => tl.to(w, { yPercent: -110, opacity: 0, duration: 0.6, stagger: 0.025, ease: 'power2.in' }, at);
      const into = (w, at) => tl.from(w, { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.045, ease: 'power3.out' }, at);
      out(s1, 3.4);
      into(s2, 6.2); out(s2, 10.4);
      into(s3a, 14.2); into(s3b, 17.6); out([...s3a, ...s3b], 24.6);
      into(s5, 29.1);

      st = ScrollTrigger.create({
        trigger: '#story', start: 'top top', end: () => '+=' + Math.round(innerHeight * E.TT / 5),
        pin: '#story-viewport', scrub: true, animation: tl, invalidateOnRefresh: true,
      });
      ScrollTrigger.refresh();                   // fonts can resolve after the load event, which skips the automatic refresh
      if (!capture && wide) {                    // smooth wheel scrolling on desktop; phones keep native touch scrolling
        lenis = new Lenis({ lerp: 0.085, anchors: true });
        lenis.on('scroll', ScrollTrigger.update);
        raf = time => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
      }
      // Hooks for recording previews (?capture): render the exact state at a scroll position.
      window.__capture = y => { window.scrollTo(0, y); ScrollTrigger.update(); render(); return story.t; };
      window.__stage = () => ({ endY: st.end });
      window.__ready = true;
    }));
    addEventListener('resize', onResize);

    return () => {
      alive = false;
      removeEventListener('resize', onResize);
      if (raf) gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      if (lenis) lenis.destroy();
      frame.style.transform = '';
      frame.style.opacity = '';
      root.classList.remove('story-on', 'story-tall');
    };
  });
}
