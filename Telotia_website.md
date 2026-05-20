TELOTIA WEBSITE — CONTENT SCAFFOLD (MEMO)

Date: 2026-05-20
For: Zhuo (site build), Kecheng & Keying (brand voice / visual), Mohan (approvals)
Purpose: A scaffold we can build against now — sitemap, section-by-section draft copy, and the guardrails that keep the copy honest. Draft copy is marked [DRAFT] and is meant to be rewritten, not shipped verbatim.

────────────────────────────────────────

0. THE ONE RULE THAT GOVERNS THIS ENTIRE SITE

We sell claim-to-evidence validation. So the website cannot contain a claim that wouldn't survive our own product.

Practically, every assertion on the site must be one of three things:
1. Self-evident — a plain description of what the product does ("it breaks a document into its claims").
2. Demonstrated — provable on the spot by the live showcase.
3. Cited — attributed to a source a reader could check.

If a sentence is none of those three, it gets cut or rewritten. No accuracy percentages before the benchmark exists. No "trusted by," no "industry-leading," no adjectives we can't back. This constraint is also our best marketing: the restraint IS the brand.

────────────────────────────────────────

1. WHAT THE SITE NEEDS TO DO AT THIS STAGE

We are pre-incorporation and pre-launch. The site is not a sales funnel yet. Its job, in priority order:
- Show, don't tell. The live showcase is the hero asset. A visitor should be able to watch the product work within ~30 seconds of landing.
- Earn credibility with the people who matter right now: potential design partners / early users in evidence-heavy fields, grant and incubator evaluators (Gina Cody, Centech), prospective collaborators and advisors, and the research community (who the showcase speaks to directly).
- Open a channel. One clear way to reach us. Nothing more elaborate.

What it does NOT need yet: pricing, login, multi-product navigation, blog, or a customer-logo wall.

────────────────────────────────────────

2. GUARDRAILS — NAMING AND THINGS WE MUST NOT SAY

These exist because our context still has open decisions, and because over-claiming would directly contradict the product.
- Public name is "Telotia" only. "Norma" is an internal/working name and is NOT a finalized product brand. On the site, refer to "our first product" or a neutral working label until the name is decided. Do not present "Norma" as a launched brand.
- Keep the internal mission off-site entirely. The "teleology of epistemic lives" framing is internal. The public mission line is the only one that appears.
- No claims we can't currently back: no incorporation/funding implications, no customers, no logos, no metrics, no "first in Canada"-type superlatives. (We believe some of these are true; we can't yet cite them, so they wait.)
- Treat unlocked differentiators as described behaviors, not guarantees. "Bring your own model" and "sub-sentence claim granularity" are candidates under definition, not committed positioning. Describe what the product does ("you can point it at the model you trust"), not that it's uniquely better. Avoid moat language.
- Don't name specific regulators or verticals as customers ("we serve OSFI-regulated banks"). It's fine to say the product is built for high-stakes, evidence-heavy work; it's not fine to imply we already operate in a regulated market.
- Absence of evidence is not falsehood. When the product finds no support for a claim, the copy and UI must say "no support found in this corpus" — never "false." This is both more honest and a genuine differentiator.

────────────────────────────────────────

3. SITEMAP

Start as a single-scroll homepage plus two light stubs. Resist adding pages.
- / (Home) — one scroll: Hero → What it does → Live showcase → How it works → Where it matters → About → Contact
- /showcase — the full interactive demo (the homepage embeds a teaser that links here)
- /about — short team + origin (optional at launch; can live as a homepage section first)
- /evidence — stub for later: where the SPOT / PaperBench results will go once they exist

────────────────────────────────────────

4. HOMEPAGE — SECTION-BY-SECTION SCAFFOLD

HERO
- Headline [DRAFT]: Every important artifact makes claims. We validate which claims survive evidence.
- Subhead [DRAFT]: Give Telotia a document and a body of evidence you trust. It breaks the document into its individual claims and shows you, claim by claim, what the evidence supports — and what it doesn't.
- Primary CTA: "See it run" → scrolls to / links to the showcase.
- Secondary CTA: "Get in touch."
- Visual note: the hero should resolve into the showcase quickly. Avoid an abstract illustration that delays the proof.

WHAT IT DOES (the positioning paragraph)
[DRAFT] Most "AI fact-checking" tools grade a system against its own output — they tell you whether a chatbot's answer matches the text it just retrieved. Telotia does the opposite-facing job: it takes a document and checks its claims against an external evidence base that YOU choose and trust. Drop in a report, a paper, a vendor's pitch, a model card — and see each claim traced to the evidence that supports it, or flagged where that support is missing.
Note: adapted from our internal positioning line ("cited-answer vendors validate their own outputs; we validate the document you just received against the evidence base you trust"). Keep the contrast; soften the named-competitor edge for public copy.

LIVE SHOWCASE (the centerpiece — see section 5 for the full spec)
[DRAFT] section intro: See it on real research. We loaded the published work of the Concordia Design Lab, then dropped in an unrelated outside paper and asked: which of this paper's claims does the lab's body of research actually support? Watch Telotia decompose the paper and answer, claim by claim, with citations.
- Embed a short auto-playing or one-click run here; full interaction lives on /showcase.

HOW IT WORKS (three honest steps)
1. Decompose [DRAFT] — We break the document into atomic claims, down to the level where each one can be checked on its own.
2. Search the evidence [DRAFT] — Each claim is matched against your evidence base — the corpus you supplied, not the open web.
3. Grade and cite [DRAFT] — Every claim gets a graded verdict — supported, partially supported, or no support found — each linked to the exact source behind it.
- Keep this plain-language. No architecture diagram on the homepage (Principia/internals stay internal).

WHERE IT MATTERS (optional, low-commitment)
[DRAFT] This matters most where claims carry weight: research that builds on prior work, and high-stakes documents where someone has to verify what they've been handed before acting on it. We're starting with the research showcase above; we're building toward the evidence-heavy work where getting a claim wrong is expensive.
- Deliberately vague on verticals per the guardrails. Do not list regulators by name yet.

ABOUT / TEAM
[DRAFT] Telotia is a Montreal-based team building tools to tell apart what's claimed from what's shown. The showcase runs on research from the Concordia Design Lab, led by Prof. Yong Zeng.
- ACTION ITEM before publishing: get Prof. Zeng's explicit sign-off to (a) name the lab and him, and (b) use the corpus publicly. Until then, this line and the showcase credit are held.
- Keep team bios minimal at this stage; a list of first names + roles is enough, or omit until incorporation.

CONTACT
- One line + hello@telotia.com. No long form. A single text field + email is plenty.

────────────────────────────────────────

5. THE SHOWCASE — NARRATIVE SPEC (most important asset)

Setup copy [DRAFT]: We indexed the published papers of the Concordia Design Lab — a fixed, trusted body of research. Then we picked a paper from outside that body of work (here, a recent high-profile external paper — e.g., Google's work on AI co-mathematicians) and asked Telotia a single question: which of this paper's claims are backed by the lab's research?

The run (UX):
- Show the external paper on one side, the lab corpus represented on the other.
- Stream the decomposition: the paper's prose resolving into a list of discrete claims.
- For each claim, show a graded verdict and the specific lab paper(s) cited as evidence.

Verdict vocabulary (use this, not true/false):
- Supported — evidence in the corpus backs the claim.
- Partially supported — some of the claim is backed; part is not, or only under conditions. (Graded, non-binary support is the point — don't collapse it.)
- No support found — the corpus doesn't speak to this claim. NOT "false."

Honest caveats (small, on-page, not buried) [DRAFT]: Telotia checks claims against the corpus you give it. "No support found" means this corpus is silent on the claim — not that the claim is wrong. Results are a starting point for a human reviewer, not a verdict on the work.

Why this corpus, framed as a feature: the showcase demonstrates the general capability (any document, any trusted corpus) using one we have rights to and can stand behind. Make that explicit — it pre-empts "why research papers?" and reinforces the "evidence base you choose" message.

────────────────────────────────────────

6. BENCHMARKS / EVIDENCE PAGE (future — SPOT / PaperBench)

Right now we have a demonstration, not a measurement. The /evidence page is where that changes, and it's the most on-brand page we'll ever build: a claims-validation company publishing its own claims with the evidence attached.

How to handle it before numbers exist:
- Either leave /evidence unlinked, or use a one-line honest placeholder [DRAFT]: We're building an open benchmark to measure how well Telotia separates supported claims from unsupported ones. We'll publish the method and the results here — including where we fall short.
- When results exist, publish method first, numbers second: what the benchmark tests, how it's scored, what the limitations are, then the score. Never a number without its method.
- OPEN DECISION: whether the public benchmark is our internal SPOT benchmark, the external PaperBench, or both (one as our own measure, one as an independent reference point). Describe whichever we use in plain terms; don't assert it's the standard unless it is.

────────────────────────────────────────

7. VOICE AND VISUAL NOTES

- Sentence case everywhere. No Title Case headings, no ALL CAPS.
- Concrete over grand. "It breaks the document into claims" beats "revolutionary AI validation platform."
- Evidence-first tone. When in doubt, state what happens, then let the showcase prove it.
- Banned-word starter list: revolutionary, cutting-edge, seamless, powerful, trusted by, industry-leading, unparalleled, game-changing. (They're all claims we can't cite.)
- Bilingual: we're Montreal-based; consider a French version (or at least FR-ready structure) before any public/Quebec-facing push. Flag for Mohan given Law-25-adjacent audiences and Quebec language norms.

────────────────────────────────────────

8. OPEN DECISIONS TO RESOLVE BEFORE THIS GOES PUBLIC

1. Public product name — "Norma" is internal. Decide the launch name or keep everything under "Telotia / our first product."
2. Concordia / Prof. Zeng permission — explicit sign-off to name the lab + him and to use the corpus publicly. Blocks the showcase credit and About line.
3. Which differentiators we commit to publicly — bring-your-own-model and sub-sentence granularity are not locked; decide before we describe them as features.
4. Whether to mention high-stakes/regulated use at all at launch, and how vaguely.
5. Benchmark choice and naming — SPOT vs PaperBench vs both, and how we describe each.
6. French version — yes/no for launch.

────────────────────────────────────────

This memo is a scaffold, not final copy. Everything marked [DRAFT] is a starting point for Kecheng's voice pass and Mohan's approval.

