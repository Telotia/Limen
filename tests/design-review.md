# Telotia — Design Review (v2)
**Branch:** `taste-check` · **File reviewed:** `src/pages/index.astro`
**Brand spec:** `C:\Users\whyke\Documents\Dianoetica\github\submit\colors-and-typography.md`
**Date:** 2026-05-27

---

## Skills used

| Skill | Path | What it contributed |
|-------|------|---------------------|
| `taste-skill` | `C:\Users\whyke\.claude\skills\taste-skill` | Anti-slop rules: Inter ban, gradient-text ban, 3-col card ban, glow ban |
| `frontend-design` | `C:\Users\whyke\.claude\skills\frontend-design` | Production aesthetics: typography distinctiveness, color coherence, motion philosophy |
| `minimalist-skill` | `C:\Users\whyke\.claude\skills\minimalist-skill` | Signal-to-noise: forbidden gradients, perpetual animations, layout noise |
| `redesign-skill` | `C:\Users\whyke\.claude\skills\redesign-skill` | Structural and interaction improvement opportunities |

---

## Verdict

**The visual identity built in code is a completely different product from the brand spec.** Every color token and every font is wrong relative to `colors-and-typography.md`. Fix those first — everything else is secondary. On top of that, three patterns explicitly banned by the taste and minimalist skill frameworks are present and visible. The good news: the page structure, the Three.js spike ball, and the workspace mockup are strong and should not change.

---

## 1. Brand compliance — CRITICAL

These are not taste opinions. The brand spec defines the canonical values. The implementation ignores them entirely.

### 1a. Color palette — complete divergence

| Token | Brand spec | Implemented | Delta |
|-------|-----------|-------------|-------|
| Background | `#071025` Deep Navy | `#030f13` teal-black | Wrong hue family — teal vs navy |
| Surface | `#0f1c3a` Ocean | `#0b3d3c` deep teal | Wrong — teal-green, not navy-blue |
| Primary text | `#f4f0ff` Night Ink (cool) | `#f4f0d9` (warm parchment) | Warm vs cool — completely different feel |
| Primary accent | `#DEA193` Rose Gold | `#31988a` teal-green | Wrong hue family — warm rose vs cool teal |
| Secondary accent | `#CCA273` Sand Gold | `#d8d29b` sandy yellow | Adjacent but wrong |
| Proven / blue accent | `#5990C0` Celestial Blue | absent | Not implemented at all |
| Pending / neutral | `#7E879D` Slate | absent | Not implemented at all |

**The Rose Gold `#DEA193` — the brand's primary signal color — does not appear anywhere in the implementation.** The entire page is built in teal-green, which is a completely different identity.

### 1b. Typography — complete divergence

| Role | Brand spec | Implemented |
|------|-----------|-------------|
| UI / body | IBM Plex Sans 400, 500 | Inter (not even loaded) |
| Display / headings | Newsreader 380, 400 | Inter (same fallback as above) |
| Mono | IBM Plex Mono 400 | JetBrains Mono (not loaded) |

Three problems simultaneously:
1. The wrong families are specified in CSS
2. Neither Inter nor JetBrains Mono are loaded via `<link>` or `@font-face` — so the browser falls back to system fonts
3. Inter is explicitly banned by the taste-skill framework regardless ("NO Inter Font: Banned")

The brand spec pairs IBM Plex Sans (neutral, precise) with Newsreader (editorial serif) for hero headings. This pairing establishes the "technical precision + editorial credibility" tone. What's implemented is Inter-everywhere, which is the definition of generic.

---

## 2. Forbidden patterns (taste-skill + minimalist-skill)

### 2a. Gradient text on the hero H1 — banned

```css
/* line ~544 */
background: linear-gradient(135deg, #d8d29b 0%, #31988a 48%, #030f13 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

Both taste-skill and minimalist-skill explicitly ban this: *"NO Excessive Gradient Text: Do not use text-fill gradients for large headers."* It also fades the hero title into near-black at the end, killing legibility. Solid `--paper` or `var(--night-ink)` white is stronger.

### 2b. 3-equal-column card layouts — banned (twice)

Process section: `grid-template-columns: repeat(3, minmax(0, 1fr))` — three identical cards.
Contact section: `grid-template-columns: repeat(3, minmax(0, 1fr))` — three identical cards.

Taste-skill rule: *"NO 3-Column Card Layouts: The generic '3 equal cards horizontally' feature row is BANNED. Use a 2-column Zig-Zag, asymmetric grid, or horizontal scrolling approach."*

For Process: a numbered vertical stack or a 2+1 asymmetric layout reads as more intentional than three clones. For Contact: 2-column with one large featured card would differentiate the primary CTA.

### 2c. Neon outer glows — banned

Spike ball keywords and nodes use stacked `box-shadow` glows:

```css
/* line ~1112 */
box-shadow:
  0 0 10px rgba(216, 210, 155, 0.58),
  0 0 22px rgba(216, 210, 155, 0.26);
```

Taste-skill rule: *"NO Neon/Outer Glows: Do not use default box-shadow glows. Use inner borders or subtle tinted shadows."* Replace with `inset` borders or a very tight single-layer tinted shadow at low opacity.

### 2d. Pill-shaped UI elements — minimalist-skill flags

Verdict pills, keyword tooltips, spike label text all use `border-radius: 999px`. Minimalist-skill bans pill-shaped components. Replace with `border-radius: 4–6px` for functional badges.

---

## 3. Visual noise — minimalist-skill

The page stacks four independent gradient systems with no clear hierarchy signal:

| Layer | Where | Covers |
|-------|-------|--------|
| `body` linear + radial gradients | Fixed, behind everything | Full viewport, always |
| `site-shell::before` linear gradient | Absolute, over body | Entire page height |
| Per-section radial gradients | `process-step`, `glossary-row`, `contact-card` | Individual components |
| `hero::before` radial gradient | Hero section only | Hero area |

Each layer is individually subtle. Stacked, they compound into an undefined murk where no gradient is readable as a signal. The minimalist-skill principle: gradients are forbidden decoratively; they are only valid as state communication. Strip back to one layer — the `body` or the `site-shell::before`, not both.

**Perpetual animations at page load:** The particle canvas, all process SVG animations, and the Three.js spike ball all animate on load without user interaction. Minimalist-skill: *"No perpetual animations."* The spike ball in the Evidence section is justified as interactive (you engage it by clicking). The particle canvas and the process SVG dash loops are ambient noise that add GPU cost without adding information.

---

## 4. Functional gaps (from initial review — unchanged)

### 4a. Mobile navigation missing (P0)
`nav-links` is `display: none` at ≤ 720px with no hamburger or drawer. On mobile, only the CTA button remains. No section navigation is accessible.

### 4b. `background-attachment: fixed` on iOS (P0)
Broken rendering on all iOS Safari. Needs:
```css
@supports (-webkit-touch-callout: none) {
  body { background-attachment: scroll; }
}
```

---

## 5. Hidden elements — turn them on (P1)

Five groups are fully styled but `display: none`. All should be enabled:

| Selector | Content | Fix |
|----------|---------|-----|
| `.label` | Section eyebrows: "How it works", "Verdicts", "Glossary"… | `display: block` |
| `.step-number` | STEP 01 / 02 / 03 in process cards | `display: block` |
| `.contact-card span` | "Request access", "Review team", "Benchmark" | `display: block` |
| `.glossary-term span` | `noun` / `verb` type tags | `display: block` |
| `.verdict-detail .type` | "verdict" / "noun" type badge | `display: block` |

---

## 6. Missing infrastructure (P2)

| Gap | Fix |
|-----|-----|
| Fonts never loaded | Add `<link>` for IBM Plex Sans + Newsreader + IBM Plex Mono from Google Fonts |
| No Open Graph meta | Add `og:title`, `og:description`, `og:type`, `twitter:card` |
| Download buttons → `about:blank` | Add `aria-disabled` + "Private beta" tooltip, or replace with waitlist input |

---

## 7. Polish (P3)

- **Contact card hover:** No transform, no border feedback. Add `translateY(-2px)` + border-color change on hover.
- **Mobile section padding:** `72px` is too heavy at 720px. Reduce to `52px`.
- **Metric source label:** `source: example review corpus` is hidden on mobile. Keep visible or bake "(example)" into the label text.
- **Glossary / Evidence overlap:** Atomic claim, Evidence base, Decomposition appear in both sections. Either merge or differentiate scope clearly.
- **`lang="en-CA"`:** Product is explicitly Canadian — use `en-CA` instead of `en`.

---

## 8. What to keep

| Element | Reason |
|---------|--------|
| Three.js spike ball (Evidence) | Premium, interactive, justified Three.js usage |
| Interactive workspace mockup | Best section — shows actual product surface |
| Vertical edge titles (`writing-mode: vertical-rl`) | Editorial, distinctive, keep |
| CSS custom properties architecture | Well-named and consistent |
| `clamp()` fluid type scale | Correct throughout |
| `prefers-reduced-motion` implementation | Complete and correct |
| `aria-live`, skip link, aria labels | Solid accessibility foundation |

---

## Fix priority order

| Priority | Item |
|----------|------|
| **P0 — do now** | Align palette to brand spec: Deep Navy + Rose Gold + Night Ink |
| **P0 — do now** | Align fonts to brand spec: IBM Plex Sans + Newsreader + IBM Plex Mono, and load them |
| **P0 — do now** | Mobile hamburger nav |
| **P0 — do now** | `background-attachment: fixed` iOS fix |
| **P1** | Remove gradient text from hero H1 |
| **P1** | Replace 3-equal-column Process and Contact grids with asymmetric layouts |
| **P1** | Replace neon box-shadow glows with inner borders |
| **P1** | Enable all 5 `display: none` element groups |
| **P1** | Collapse gradient layers — keep one, remove the rest |
| **P2** | Add OG / social meta tags |
| **P2** | Fix download button placeholder state |
| **P3** | Contact card hover, mobile padding, metric source label, lang attribute |
