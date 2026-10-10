# julianhilgemann.com — agent reference

Personal site for Julian Hilgemann (data platform engineer: the systems between a measurement and a decision). Static Astro 4 + Tailwind 3 site, English-only, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

The site tells one story: reality arrives as dense signal, data work compresses it down to a number, and expressive work opens that number back up. `/story` is that narrative in full; every other page is a doorway into part of it. The source of that framing is the "Website Storyboard: Signal to Number and Back" doc, which also holds the copy variants and the slogan bank.

## Site map

| Route | Page file(s) | What it is |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Hero (positioning line + sub-line; the name lives in the nav), "Now building" (`CurrentProject` + animated `PipelineDiagram`), "What I do" and "Selected work" (`SelectedWork`), contact CTA. GSAP motion. |
| `/story` | `story.astro` | The narrative: seven chapters and a coda, each one a full-height section holding a card, with one `StoryField` figure each and `NumberAnatomy` in chapter 6. Motion via `story.ts` + `story-field.ts`. |
| `/projects` | `projects.astro` | Full project list (`Projects` → `ProjectCard`). GSAP motion via `page.ts`. |
| `/work` | `work.astro` | Short CV: the two roles with `#platform` / `#bi` anchors that Story chapters 4 and 6 deep-link into, then "How I work". Motion via `work.ts`. |
| `/services` | `services.astro` | Interactive pricing calculator + CTA. The consulting offer, kept alongside the portfolio. |
| `/page-engine` | `page-engine.astro` | Architecture explainer; data array in frontmatter. Linked from nowhere, and its CTA still points at a non-existent `/contact`. |
| `/hub` | `hub.astro` | "Gateway" page: a link hub, mostly reached on phones. No nav. GSAP motion via `gateway.ts`. |
| legal | `impressum`, `datenschutz`, `cookie-einstellungen`, and the same three under `de/` | Legal pages. The German copies are the only German pages left. |

Layouts: `src/layouts/Layout.astro` (the whole site) and `LayoutDE.astro` (the three German legal pages only) own `<head>`, GA4 consent defaults, the Klaro cookie banner config, Nav, Footer and the contact modal. `LayoutDE` lacks the `noFooter` / `noAnalytics` props that `Layout` has.

## One language

The site was bilingual and is not any more. What that leaves behind:

- `Nav.astro` renders one English item list. Its `lang` prop survives only to label the contact button on the German legal pages.
- German legal pages stay German, because that is the form German law expects. They keep `LayoutDE`, which keeps `src/components/de/Footer.astro` and `de/ContactModal.astro` alive. Those three files are the entire `de/` tree now. The English footer links `/de/impressum`, which is the one way in.
- Every removed route redirects through the `redirects` map in `astro.config.mjs`: `/about` → `/story`, `/start` → `/hub`, and each `/de/*` content route to its English page. GitHub Pages serves no server redirects, so Astro emits these as static pages that meta-refresh and carry a canonical link. Deleting a route means adding it there.
- `german_homepage_copy.md` at the repo root is a leftover draft of copy that no longer ships.

## Pricing calculator

- Prices, tiers, thresholds: `src/data/pricing-config.json`. Maths: `src/lib/pricing.ts` (`calculate()` is the single entry point; rounding is reconciled so the legend always sums to the total).
- Keys starting with `_` are **internal** (day rate, risk buffer, lead thresholds). They must never reach the browser or a published file. The client bundle currently tree-shakes them out and `scripts/generate-llms.mjs` strips them explicitly; after touching how the JSON is imported, grep `dist/_astro/` for `_anchor` to confirm.
- `PricingCalculator.astro` still takes a `lang` prop and all its copy still lives in `src/lib/pricing-strings.ts` typed by `LocaleStrings`, with both locale entries. Only the English one is reachable now; the German strings are dead but harmless, and the thin `de/PricingCalculator.astro` wrapper is gone.
- The calculator's bar segments and legend rows are built in JS, so they never receive Astro's scope attribute. Their styles use `:global()` nested under `#pricing-calculator` / `[data-sticky]`. The same applies to any component that creates DOM at runtime.
- The mobile sticky bar (`[data-sticky]`) sits outside `#pricing-calculator` so it can span the viewport. It redeclares the `--seg-*` colour tokens for its miniature bar.

## Components

Shared and in use: `Nav.astro` (takes `lang`), `ProjectCard.astro`, `Section.astro`, `MotionIntro.astro`, `NetworkBackdrop.astro`, `PageBackdrop.astro`, `SecondaryCTA.astro`, `ContactModal.astro`.

Figures take their text as props, never as literal markup — see the llms section for why: `NumberAnatomy.astro` (Story chapter 6), `PipelineDiagram.astro` (homepage), `StoryField.astro` (one still frame per Story chapter, seeded so the field is the same cloud in every build).

`Projects.astro` holds the project data and renders only the card list; the Projects page supplies the heading. The homepage's current project lives in `CurrentProject.astro` — to feature a different project, swap that section and its diagram props. `SelectedWork.astro` holds the homepage's "What I do" lines and the four tiles, each tagged with the Story chapter it belongs to.

Dead components — imported nowhere, safe to ignore or delete: `CredibilityBar`, `DecisionScope`, `Header`, `SpotlightButton`. (`Hero.astro` is live: the homepage uses it.)

## llms.txt / docs generation

`npm run build` = `astro build && node scripts/generate-llms.mjs`. The generator flattens each page's `.astro` source (plus the components that page imports) into Markdown and writes `public/llms.txt`, `public/llms-full.txt`, and `public/docs/**.md`.

- It runs **after** `astro build`, so its output reaches `dist/` only on the *next* build. CI runs the same script, so what ships is whatever is committed in `public/`. After changing page copy, run `npm run build` locally and commit the regenerated `public/` files.
- It reads source, not rendered HTML: text produced by `{array.map(...)}` expressions or client-side JS is invisible to it. The services docs are rebuilt from the pricing JSON for exactly this reason. The project cards have the same blind spot: their data array never reaches `docs/projects.md`, and neither do the homepage's "Selected work" tiles.
- It keeps link targets only for `<a>` inside `<p>`, `<li>` or headings, and only when `href` is a literal string (not `{expr}`). The Story page's cross-site links read from a constant, so they do not reach the docs.
- Story and Work use this on purpose: figure labels, chapter numbers, stats and tags that only restate the prose live in a frontmatter `ui` object, so the generated docs carry the prose once. Keep real copy as literal markup — the chapter text is deliberately eight literal sections rather than a `.map()` — and route decorative restatements through expressions.
- A new page needs an entry in `PAGE_META` / `PAGE_ORDER` in the script or it gets a generic title.
- `public/docs/llmcntxt.md` is hand-written and preserved; every other `.md` in `public/docs/` is regenerated.
- To verify a change without touching tracked files, run `npx astro build` alone.

## Design language

Tokens live in `tailwind.config.mjs`: `background` #0B1220, `primary` #F59E0B (orange), `info` #38BDF8 (blue), `text-primary`, `text-secondary`. Surfaces use the `.glass` utility from `src/styles/global.css`. Tone is calm, high-trust, glass-over-dark, with generous whitespace. Motion is micro-interactions and fade + rise reveals, never loud gradients or kinetic gimmicks.

The two accents now carry the story, not just a UI role: blue is system and structure (Story chapters 3 to 5, the "Selected work" chapter tags), orange is belief, the number and the burst (chapters 2, 6 and 7, every CTA). Chapter 7 is the one place both appear at once, so the expansion is felt rather than read.

Typography on `/story` compresses with the narrative: measure and letter-spacing tighten from chapter 1 to 6, weight rises toward the number, which is set in monospace, and chapter 7 opens up again. The steps are in the page's own `<style>` block as `.ch-1` … `.ch-7`, small enough to feel rather than see.

The fuller brief (`cntxt/design.md`, `cntxt/specs.md`, …) and `pricing-calculator-context/` are gitignored and exist only on the owner's machine. Read them when present.

## Motion (homepage, Story, Work)

- `src/scripts/motion.ts` is the shared toolkit: plugin registration, `riseLines`, and the generic **hooks** (`data-reveal`, `data-reveal-lines`, `data-reveal-stagger`, `data-reveal-batch`, `data-magnetic`, `.spotlight-card`). Page entry points call `initPageMotion()` (and usually `playIntro()`, the shared load intro) and then add their own pieces: `home.ts` (homepage; also starts `pipeline-diagram.ts`), `story.ts` (the Story page, with `story-field.ts`), `work.ts` (the CV timeline and counters), `gateway.ts` (`/hub`) and `page.ts` (pages that need only the shared hooks, e.g. Projects). Each file lists its hooks at the top. To animate something new, add a hook and handle it in the matching script, keeping the markup free of logic. A page with no script import gets no motion, so hooks on shared components (e.g. `SecondaryCTA`) are inert elsewhere.
- Hero network canvas: `src/scripts/hero-network.ts`. It pauses off-screen or in a hidden tab, and paints a static frame under reduced motion. `/hub` reuses it through `NetworkBackdrop.astro`, so the network is the site's one signature background: prefer it over inventing a new one.
- Reuse before adding: new pages should compose the existing vocabulary (masked-line intro, fade + rise, `.glass` + `.spotlight-card`, `.link-card`, magnetic buttons, the network backdrop) so motion stays aligned across the site.
- GSAP 3 from npm: `ScrollTrigger` and `SplitText` are registered in `motion.ts`, `ScrambleTextPlugin` in `home.ts`. All plugins are free in the public package, and GSAP loads only on the pages that import a motion script.
- Animated figures (`NumberAnatomy`, `PipelineDiagram`) ship their **end state** in markup — what reduced-motion and no-JS visitors see — and the script sets up the starting state. `StoryField` is only ever a still frame, which is what the animated field will fall back to.
- Figures that must read on phones render two layouts (`PipelineDiagram`: wide from `lg`, tall below) and animate only the visible one via `gsap.matchMedia()`; a single wide SVG scaled down to a phone makes its labels unreadable.
- Everything honours `prefers-reduced-motion` and is skipped when it is set. If nothing animates while you test, check that OS setting before debugging code.
- Elements GSAP tweens must use `transition-colors` (or no transition), never Tailwind's `transition-all`: a CSS transition on `transform` / `opacity` fights every tween frame and makes the motion lag.
- `SplitText` line splits are reverted once their reveal finishes, because frozen line breaks clip inside their masks after a resize. Keep that pattern (`riseLines` in `home.ts`).
- Pre-paint hide for load intros: `MotionIntro.astro` (rendered before the `[data-intro]` elements) adds `html.motion-intro`, CSS in `global.css` hides `[data-intro]`, and the page script calls `releaseIntro()` once GSAP holds the state. A 2.5 s timeout removes the class anyway, so a failed bundle never blanks the page. Above-the-fold elements need this; `data-reveal` alone flashes them.
- Sticky figures inside a CSS grid are bounded by their own grid cell, not the grid's padding: to give a sticky element more range, add height to the rows it spans.
- No Astro view transitions are enabled. The `astro:page-load` listeners in several components are future-proofing, and every script runs once per full page load.

## How a Story chapter behaves

Each chapter is a full-height section (`100svh`) holding one card, and `story.ts` gives every chapter a single paused timeline that runs **once, on entry**. Nothing on this page is scrubbed: a reader should never have to keep scrolling to see a chapter finish.

- The card slides up and fades in first; the marker, the masked headline lines, the paragraphs and the quiet link follow on the same timeline, so a chapter is never half-arrived. The figure starts at 0.22s — while the card is still moving — and lands just after it settles.
- Because the timelines are built paused at load, every `from` claims its hidden state immediately and nothing flashes before the reader gets there. The headline is split at entry rather than at load, so a resize on the way down cannot leave stale line breaks clipping inside their masks.
- A trigger that the page loads *past* never fires, which would leave a deep link (`/story#structure`, linked from the homepage) staring at an invisible card. Each chapter therefore also checks its own position once at setup and plays immediately if it is already at or above the start line. Keep that check if you touch the entrance.
- When the timeline completes the chapter goes live: the card gets `.is-live`, which runs a slow conic-gradient border (`@property --story-angle`), and the figure starts its idle loop. Both are the answer to "the chapter is finished, but the page should not look dead".

`StoryField` figures have two phases in `story-field.ts`: `fieldEnter(fig, tl, at)` adds tweens to the chapter's timeline, and `fieldIdle(fig)` is what keeps moving afterwards — bands drifting, rays flickering, a lineage edge pulsing, the forecast's dashes marching, the coda turning. The measurement figure borrows the choices-layer idiom from `NumberAnatomy`: every second or two one sample goes out and another lights, because the selection behind a number is never finished. Every idle is wrapped in `whileVisible`, which pauses it off-screen — eight chapters of endless animation would otherwise all run at once.

Figure geometry is in viewBox units. Anything pivoting on a point *in the drawing* (the inference fan on its last data point, the burst on its core) must use GSAP's `svgOrigin`, not `transformOrigin`, which measures from the element's own bounding box. And each figure's markup is its animated END state, so reduced-motion and no-JS visitors see exactly where the entrance lands.

## Still to build on /story

The page ships as text and still frames, which is also the reduced-motion version and can never be blocked by the animation work. Not built yet: the one persistent particle field whose state blends per chapter (Three.js or regl behind an Astro island, driven by ScrollTrigger), the held beat at the number, chapter 7's opt-in audio with the Web Audio analyser and its **Expand** button, and the homepage hero's 10–12 second loop of the whole arc. The storyboard's plan is to prototype the field states in TouchDesigner and port them to GLSL.

## Cookie banner

Klaro loads from jsDelivr and is configured inline in both layouts (theme `top`, `wide`). `global.css` restyles it as a bottom glass banner and must keep `top: auto`, or the notice stretches over the whole viewport.

## Root-level strays

`hero-playground.html` (standalone hero prototype) and `german_homepage_copy.md` (a copy draft for a German homepage that no longer exists) are not part of the build. The `.astro` files are the source of truth for copy.
