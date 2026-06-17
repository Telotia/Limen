# Limen / Telotia — Design Context Pack (hand this to the Cowork design Claude)

Self-contained brief for designing the Telotia public site (`dev.telotia.com`, repo "Limen", Astro + Cloudflare). Paste/upload this whole file into the Cowork session. Source: Kecheng-Claude, 2026-06-17.

## 0. Your job
Polish the Telotia public site to a premium, refined standard (the team loves ranger.net's "设计细化"), while staying inside the brand's honesty rules and design system below. It's a paid-pilot, pre-launch site — credibility + restraint over marketing.

## 1. Product & first vertical
Telotia = **claim-to-evidence validation**: decompose a document into individual claims → search each against a trusted evidence corpus → assign a graded verdict (**Supported / Partial / Unsupported**) with **source citations**. For high-stakes, evidence-heavy regulatory work.
- **First product direction = healthcare-regulatory / credentialing** (anchor partner: **CAPA** — Canadian Association of Physician Assistants / PACCC certification, capa-acam.ca). Adjacent demo: health-equipment import compliance / medical-device regulatory submissions (claims need cited clinical evidence). Don't name specific regulators as customers.

## 2. Audience (who must believe it)
Centech evaluators, design partners in evidence-heavy/regulatory fields, prospective collaborators/advisors, research community. Sober, credible, technical — not consumer-flashy.

## 3. THE brand rule (governs all copy) + guardrails
- **Every assertion must be self-evident, demonstrated (live), or cited.** If a sentence is none of those → cut it. **No metrics we can't cite, no "trusted by", no superlatives.** *The restraint IS the brand.*
- **Show, don't tell:** the live showcase is the hero (visitor watches it work in ~30s).
- Public name is **"Telotia" only** ("Norma"/the "epistemic lives" mission = internal, off-site).
- No claims of incorporation/funding/customers/"first in Canada". Describe what it *does*, not that it's uniquely better (avoid moat language).

## 4. Content decisions already made (apply these)
- **REMOVE the stats block** ("12,480 atomic claims… 7,326 citations") — no real data yet, and fake metrics violate rule #3. Replace that hero space with the **live showcase**.
- **"Download" → "Request a pilot"** (paid pilot, no software to download). It opens a **short form** (name · work email · org · one line: what evidence you're validating), NOT a raw mailto. Anti-abuse/DDoS via **Cloudflare Turnstile** + a Worker endpoint + rate-limit (the site is already on Cloudflare). Keep a tiny `hello@telotia.com` text link as secondary.
- One clear channel only. No pricing/login/blog/logo-wall yet.

## 5. Design system — "Principia Design System" (use these tokens; file: Limen/Principia Design System/colors_and_type.css)
- **Light surface (lead with this — sober/institutional, suits healthcare-regulatory):** paper `#F6F7FB`, raised `#EEF1F7`, ink `#10182F` (deep navy, primary text), ink-2 `#27324F`, muted `#5C6680`, hairline `#C8D0E0`.
- **Brand accents:** brand-blue `#102A6B` (mark), current-blue `#5990C0` (active), sand-gold `#CCA273` (Partial highlight).
- **Verdict colors (core to the product):** Supported = blue family (`#5990C0`→`#102A6B`); Partial = navy→sand-gold; Unsupported/Falsified = navy→rose `#DEA193`.
- **Cosmic/constellation layer** (ocean radial, rose-gold, nebula-violet/magenta) EXISTS — **keep it SUBTLE / accent only.** For the healthcare-regulatory read it must not dominate (too poetic for a compliance buyer). Lead sober navy-on-paper.
- **Type:** Display = **Newsreader** (humanist serif — use only for big headlines/gravitas); Body/UI = **IBM Plex Sans**; Mono = **IBM Plex Mono**. (If serif feels too "literary" for the clinical read, keep headlines tighter / lean more on Plex Sans.)

## 6. Reference to emulate — ranger.net ("premium minimalism")
What to borrow: **generous whitespace + steady vertical rhythm** (8/16px base), **restrained 2-tier CTA** (one bold primary + a quiet secondary), **calm scroll motion** (subtle fade/transition, nothing flashy), high-contrast **navy/white**, **"invitation, not marketing"** copy tone, clean centered demo/screenshots. This is the SAME DNA Telotia already has — so it's *polishing*, not redirecting.

## 7. Skills to use (install in your session — both vetted clean by us)
- **ui-ux-pro-max** → `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` — design intelligence: 161 color palettes, 57 font pairings, 99 UX guidelines, styles, per-product reasoning. *(We use only its SKILL.md + data as reference; its Node/Python CLI is optional — safe but not required.)*
- **taste-skill** → `https://github.com/Leonxlnx/taste-skill` — anti-slop premium frontend, audit-first redesigns, minimalist/soft/brutalist variants. Use **minimalist/soft** for Telotia (not brutalist).
- Apply them to: a redesign audit of the current page, font-pairing + palette refinement within the tokens above, spacing/rhythm, and the CTA/form polish.

## 8. Tech context
Astro site, deploys as a **Cloudflare Worker** (`wrangler`). There's an existing **canvas particle animation** (`src/lib/dianoetica/…` — the "claims resolving" visual) — that can be the showcase/hero motion. The pilot form needs a Cloudflare Worker endpoint + Turnstile.

## 9. Suggested first deliverables
1. Redesign-audit the current page (taste-skill audit-first).
2. Hero: showcase-forward (drop stats), ranger-grade whitespace + type.
3. "Request a pilot" form (Turnstile + Worker), replacing Download.
4. A light pass tightening palette/type/spacing to the tokens, cosmic-subtle.
Keep everything inside rule #3 (honesty) — copy must be self-evident, demonstrated, or cited.
