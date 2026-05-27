# Telotia — Design Review
**Branch:** `taste-check` · **File reviewed:** `src/pages/index.astro` · **Date:** 2026-05-27

---

## Skills used for this evaluation

| Skill | Path | Role in this review |
|-------|------|---------------------|
| `taste-skill` | `.claude/skills/taste-skill` | Aesthetic judgment — palette coherence, visual hierarchy, "does it feel premium" |
| `frontend-design` | `.claude/skills/frontend-design` | Production-grade frontend standards — spacing, type scale, component patterns |
| `redesign-skill` | `.claude/skills/redesign-skill` | Identifying structural and interaction improvements |
| `minimalist-skill` | `.claude/skills/minimalist-skill` | Evaluating signal-to-noise ratio, what to strip |

---

## Overall verdict

**Strong foundation. Distinctive identity. Several invisible elements and two functional gaps need fixing before this can go to production.**

The palette (deep teal + sandy gold + warm paper) is distinctive and avoids the generic blue-gray SaaS aesthetic. The Three.js spike ball, particle canvas, and interactive workspace mockup are premium touches that justify the visual complexity. The editorial vertical edge titles (`writing-mode: vertical-rl`) are a confident stylistic choice. Typography system (Inter + JetBrains Mono) is correct for a data-heavy B2B tool.

The problems are concentrated in two areas: **elements that are styled but `display: none`** (the design has been building toward showing them and never shipped them), and **two hard functional gaps** (mobile navigation and iOS background).

---

## Issues — grouped by priority

### P0 — Functional breaks

#### 1. Mobile navigation is missing
`nav-links` is `display: none` at ≤ 720px with no hamburger or drawer replacement. On mobile, only the "Request audit" CTA remains. Users cannot navigate to Process, Evidence, Workspace, Download, or Contact.

```css
/* line ~2148 */
.nav-links {
  display: none; /* nothing replaces this on mobile */
}
```

**Fix:** Add a hamburger button that reveals a full-screen or drawer nav. Or at minimum a bottom-anchored pill nav for the five sections.

---

#### 2. `background-attachment: fixed` is broken on iOS Safari
`background-attachment: fixed` is a known iOS Safari bug — the background either doesn't paint or jitters during scroll. Affects every iPhone/iPad visitor.

```css
/* line ~258 */
body {
  background-attachment: fixed; /* broken on iOS */
}
```

**Fix:**
```css
@supports (-webkit-touch-callout: none) {
  body {
    background-attachment: scroll;
  }
}
```

---

### P1 — Elements built but never shown

Five groups of elements have complete styles written but `display: none`. These exist in the HTML and data, have CSS, and carry semantic value — they just never got turned on.

#### 3. Section eyebrow labels (`display: none`)
Every section has a `.label` eyebrow — "How it works", "Verdicts", "Glossary", "Review workspace", "Contact". All hidden.

```css
/* line ~841 */
.label {
  display: none;
}
```

These are standard on every major product site (Linear, Vercel, Stripe). They anchor the reader before the H2 and improve scan-ability. **Turn them on.**

```css
.label {
  display: block; /* was: none */
}
```

---

#### 4. Step numbers in process cards (`display: none`)
`STEP 01 / 02 / 03` in the process cards are invisible.

```css
/* line ~1006 */
.step-number {
  display: none;
}
```

The monospace treatment is already styled (`color: var(--green-2)`, `font-size: 11px`, `letter-spacing: 0.14em`). Just enable it.

---

#### 5. Contact card category spans (`display: none`)
"Request access", "Review team", "Benchmark" — the overline labels on each contact card are hidden.

```css
/* line ~1966 */
.contact-card span {
  display: none;
}
```

These function as the primary action differentiator. Without them, three cards with similar-length titles look visually identical at a glance.

---

#### 6. Glossary term type tags (`display: none`)
The `<span>` inside `.glossary-term` (the `noun` / `verb` type indicator) is hidden.

```css
/* line ~1365 */
.glossary-term span {
  display: none;
}
```

---

#### 7. Verdict/definition type badges (`display: none`)
`.verdict-detail .type` and `.definition-card .type` ("verdict", "noun") are both hidden.

```css
/* line ~1311 */
.verdict-detail .type,
.definition-card .type {
  display: none;
}
```

---

### P2 — Missing infrastructure

#### 8. Fonts are never loaded
Inter and JetBrains Mono are specified in `--font-sans` and `--font-mono` but there is no `<link>` to Google Fonts, no `@import`, and no `@font-face`. The browser falls back to system fonts silently. On Windows this means Segoe UI; on macOS, SF Pro — both are fine fallbacks but the intended type rhythm (especially JetBrains Mono kerning in the workspace mockup) won't be there.

**Fix — add to `<head>`:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

---

#### 9. No Open Graph or social meta tags
When the URL is shared on Slack, X, or LinkedIn, no preview card generates. For a B2B product in private beta that spreads primarily through direct sharing, this is a meaningful gap.

**Fix — add to `<head>`:**
```html
<meta property="og:title" content="Telotia — Evidence-grade audit for Canadian health-equipment imports" />
<meta property="og:description" content="We turn documentation into citation-linked evidence review for teams preparing Canadian proof packages." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://telotia.com" />
<meta name="twitter:card" content="summary_large_image" />
```

---

### P3 — Polish and UX refinements

#### 10. Download buttons have no "coming soon" affordance
Both download buttons link to `about:blank`. A first-time visitor clicking them gets a blank tab with no explanation. This is a trust signal failure for a tool asking companies to "Request an audit".

**Options:**
- Add `aria-disabled="true"` + `pointer-events: none` + muted style + a tooltip "Private beta — request access above"
- Or replace with a waitlist email form

---

#### 11. Contact card hover state is weak
Contact cards are `<a>` elements covering ~240px height, but hover feedback is only inherited link coloring. No transform, no border-color change, no arrow indicator. Every large-format link card on production sites (Stripe, Linear, Notion) has a `translateY(-2px)` or border brightening on hover.

**Fix:**
```css
.contact-card {
  transition: box-shadow 160ms var(--ease), transform 160ms var(--ease);
}
.contact-card:hover,
.contact-card:focus-visible {
  transform: translateY(-2px);
  box-shadow:
    inset 0 0 0 1px rgba(49, 152, 138, 0.28),
    0 8px 28px rgba(3, 15, 19, 0.12);
}
```

---

#### 12. Metric source disclosure hidden on mobile
`<small class="metric-source">source: example review corpus</small>` is `display: none` at 720px. These numbers (12,480 / 7,326 / 0) read as real product stats without the source label. On mobile — where most first impressions happen — the disclaimer is gone.

Either keep the source label visible at small sizes, or append "(example)" to the metric label itself.

---

#### 13. Section padding on mobile is heavy
`padding: 72px 0` at ≤ 720px is equivalent to about 9× the base line-height. Standard mobile section padding on production sites is 48–56px. The current value makes the page feel long without content density to justify it.

```css
@media (max-width: 720px) {
  .section {
    padding: 52px 0; /* was: 72px */
  }
}
```

---

#### 14. Glossary section duplicates Evidence section content
The Glossary section (Atomic claim, Evidence base, Decomposition) partly overlaps with the Evidence section's interactive widget (Supported, Partial, Unsupported, Atomic claim, Evidence base, Decomposition). Three of six glossary nodes also appear in the spike ball. Consider merging or differentiating the two sections more clearly — e.g., Glossary focuses on process terms only (Atomic claim, Evidence base, Decomposition) and Evidence focuses on verdict taxonomy only.

---

#### 15. `<html lang="en">` — consider `lang="en-CA"`
The product is explicitly Canadian (MDEL, Canadian audit, Montreal). `lang="en-CA"` signals this to assistive technology and search engines.

---

## What's working well — don't touch

| Element | Why it works |
|---------|-------------|
| Vertical edge titles (`writing-mode: vertical-rl`) | Editorial and distinctive. Rare on SaaS sites. Keep. |
| `prefers-reduced-motion` handling | Correct and complete — disables both canvas and transitions. |
| `aria-live="polite"` on dynamic verdict detail | Correct pattern for interactive content. |
| Skip link | Present and functional. |
| `tabular-nums` on metric values | Correct for count-up animation. |
| CSS custom properties system | Well-named, scoped, easy to override. |
| `clamp()` fluid type | Scales correctly across the full viewport range. |
| Three.js spike ball | Premium enough to justify Three.js as a dependency. |
| Interactive workspace mockup | Best section on the page — shows the actual product surface. |
| Palette | Distinctive. The sandy gold + teal-dark combination is not generic. |

---

## Summary fix list

| # | Priority | Change |
|---|----------|--------|
| 1 | P0 | Add mobile hamburger nav |
| 2 | P0 | Fix `background-attachment: fixed` for iOS |
| 3 | P1 | Set `.label { display: block }` |
| 4 | P1 | Set `.step-number { display: block }` |
| 5 | P1 | Set `.contact-card span { display: block }` |
| 6 | P1 | Set `.glossary-term span { display: block }` |
| 7 | P1 | Set `.verdict-detail .type { display: block }` |
| 8 | P2 | Add Google Fonts `<link>` for Inter + JetBrains Mono |
| 9 | P2 | Add OG / Twitter Card meta tags |
| 10 | P3 | Disable or explain placeholder download buttons |
| 11 | P3 | Add hover transform to contact cards |
| 12 | P3 | Keep metric source label visible on mobile |
| 13 | P3 | Reduce mobile section padding to ~52px |
| 14 | P3 | Differentiate Glossary vs Evidence section content |
| 15 | P3 | Use `lang="en-CA"` |
