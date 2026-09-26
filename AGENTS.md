# julianhilgemann.com — agent reference

Personal consulting site for Julian Hilgemann (Power BI / Microsoft Fabric decision systems). Static Astro 4 + Tailwind 3 site, bilingual (EN at `/`, DE at `/de/`), deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Site map

| Route | Page file(s) | What it is |
| --- | --- | --- |
| `/`, `/de` | `src/pages/index.astro`, `src/pages/de/index.astro` | Hero, the current project (`CurrentProject` + animated `PipelineDiagram`), contact CTA. GSAP motion. |
| `/projects`, `/de/projects` | `projects.astro` | Full project list (`Projects` → `ProjectCard`). GSAP motion via `page.ts`. |
| `/services`, `/de/services` | `services.astro` | Interactive pricing calculator + CTA. |
| `/about`, `/de/about` | `about.astro` | Copy inline in the page file, plus the `NumberAnatomy` figure and a timeline, then the contact CTA. GSAP motion. |
| `/page-engine` (+ DE) | `page-engine.astro` | Architecture explainer; data array in frontmatter. |
| `/hub` (+ DE), `/start` | `hub.astro`, `start.astro` | "Gateway" pages: link hub and language picker (`/start` → `/hub` or `/de/hub`), mostly reached on phones. No nav; `start` also has no footer or analytics. EN-only `start`. GSAP motion. |
| legal | `impressum`, `datenschutz`, `cookie-einstellungen` (+ DE) | Legal pages. |

Layouts: `src/layouts/Layout.astro` (EN) and `LayoutDE.astro` (DE) own `<head>`, GA4 consent defaults, the Klaro cookie banner config, Nav, Footer and the contact/language modals. `LayoutDE` lacks the `noFooter` / `noAnalytics` props that `Layout` has.

## The bilingual rule

EN and DE are **parallel trees**, not i18n: most components exist twice (`src/components/X.astro` and `src/components/de/X.astro`) with the copy hard-coded in each. Every copy or markup change lands in both files, or the languages drift.

Components that are shared across languages (one file serves both):

- `Nav.astro` — takes `lang`.
- `PricingCalculator.astro` — takes `lang`; `de/PricingCalculator.astro` is a thin wrapper. All calculator copy lives in `src/lib/pricing-strings.ts`, typed by `LocaleStrings`, so a new string needs the interface field plus both locale entries.
- `ProjectCard.astro`, `Section.astro`, `LanguageModal.astro`, `MotionIntro.astro`, `NetworkBackdrop.astro`, `PageBackdrop.astro`.
- `NumberAnatomy.astro` (About) and `PipelineDiagram.astro` (homepage) — figures whose text arrives as props.

`Projects.astro` / `de/Projects.astro` hold the project data and render only the card list; the Projects pages supply the heading. The homepage's current project lives in `CurrentProject.astro` / `de/CurrentProject.astro` — to feature a different project, swap that section and its diagram props.

Dead components — imported nowhere, safe to ignore or delete: `CredibilityBar`, `DecisionScope`, `Header`, `SpotlightButton` (and their `de/` copies).

## Pricing calculator

- Prices, tiers, thresholds: `src/data/pricing-config.json`. Maths: `src/lib/pricing.ts` (`calculate()` is the single entry point; rounding is reconciled so the legend always sums to the total).
- Keys starting with `_` are **internal** (day rate, risk buffer, lead thresholds). They must never reach the browser or a published file. The client bundle currently tree-shakes them out and `scripts/generate-llms.mjs` strips them explicitly; after touching how the JSON is imported, grep `dist/_astro/` for `_anchor` to confirm.
- The calculator's bar segments and legend rows are built in JS, so they never receive Astro's scope attribute. Their styles use `:global()` nested under `#pricing-calculator` / `[data-sticky]`. The same applies to any component that creates DOM at runtime.
- The mobile sticky bar (`[data-sticky]`) sits outside `#pricing-calculator` so it can span the viewport. It redeclares the `--seg-*` colour tokens for its miniature bar.

## llms.txt / docs generation

`npm run build` = `astro build && node scripts/generate-llms.mjs`. The generator flattens each page's `.astro` source (plus the components that page imports) into Markdown and writes `public/llms.txt`, `public/llms-full.txt`, and `public/docs/**.md`.

- It runs **after** `astro build`, so its output reaches `dist/` only on the *next* build. CI runs the same script, so what ships is whatever is committed in `public/`. After changing page copy, run `npm run build` locally and commit the regenerated `public/` files.
- It reads source, not rendered HTML: text produced by `{array.map(...)}` expressions or client-side JS is invisible to it. The services docs are rebuilt from the pricing JSON for exactly this reason. The project cards have the same blind spot: their data array never reaches `docs/projects.md`.
- It keeps link targets only for `<a>` inside `<p>`, `<li>` or headings, and only when `href` is a literal string (not `{expr}`).
- The About page uses this on purpose: figure labels, stats and tags that only restate the prose live in a frontmatter `ui` object, so the generated docs carry the prose once. Keep real copy as literal markup, and route decorative restatements through expressions.
- A new page needs an entry in `PAGE_META` / `PAGE_ORDER` in the script or it gets a generic title.
- `public/docs/llmcntxt.md` is hand-written and preserved; every other `.md` in `public/docs/` is regenerated.
- To verify a change without touching tracked files, run `npx astro build` alone.

## Design language

Tokens live in `tailwind.config.mjs`: `background` #0B1220, `primary` #F59E0B (orange = action / CTA), `info` #38BDF8 (blue = system / structure), `text-primary`, `text-secondary`. Surfaces use the `.glass` utility from `src/styles/global.css`. Tone is calm, high-trust, glass-over-dark, with generous whitespace. Motion is micro-interactions and fade + rise reveals, never loud gradients or kinetic gimmicks.

The fuller brief (`cntxt/design.md`, `cntxt/specs.md`, …) and `pricing-calculator-context/` are gitignored and exist only on the owner's machine. Read them when present.

## Motion (homepage, About)

- `src/scripts/motion.ts` is the shared toolkit: plugin registration, `riseLines`, and the generic **hooks** (`data-reveal`, `data-reveal-lines`, `data-reveal-stagger`, `data-reveal-batch`, `data-magnetic`, `.spotlight-card`). Page entry points call `initPageMotion()` (and usually `playIntro()`, the shared load intro) and then add their own pieces: `home.ts` (both index pages; also starts `pipeline-diagram.ts`), `about.ts` (both About pages), `gateway.ts` (`/start`, both hubs) and `page.ts` (pages that need only the shared hooks, e.g. Projects). Each file lists its hooks at the top. To animate something new, add a hook and handle it in the matching script, keeping the markup free of logic. A page with no script import gets no motion, so hooks on shared components (e.g. `SecondaryCTA` on About) are inert elsewhere.
- Hero network canvas: `src/scripts/hero-network.ts`. It pauses off-screen or in a hidden tab, and paints a static frame under reduced motion. The gateway pages reuse it through `NetworkBackdrop.astro`, so the network is the site's one signature background: prefer it over inventing a new one.
- Reuse before adding: new pages should compose the existing vocabulary (masked-line intro, fade + rise, `.glass` + `.spotlight-card`, `.link-card`, magnetic buttons, the network backdrop) so motion stays aligned across the site.
- GSAP 3 from npm: `ScrollTrigger` and `SplitText` are registered in `motion.ts`, `ScrambleTextPlugin` in `home.ts`. All plugins are free in the public package, and GSAP loads only on the pages that import a motion script.
- Animated figures (`NumberAnatomy`, `PipelineDiagram`) ship their **end state** in markup — what reduced-motion and no-JS visitors see — and the script sets up the starting state.
- Figures that must read on phones render two layouts (`PipelineDiagram`: wide from `lg`, tall below) and animate only the visible one via `gsap.matchMedia()`; a single wide SVG scaled down to a phone makes its labels unreadable.
- Everything honours `prefers-reduced-motion` and is skipped when it is set. If nothing animates while you test, check that OS setting before debugging code.
- Elements GSAP tweens must use `transition-colors` (or no transition), never Tailwind's `transition-all`: a CSS transition on `transform` / `opacity` fights every tween frame and makes the motion lag.
- `SplitText` line splits are reverted once their reveal finishes, because frozen line breaks clip inside their masks after a resize. Keep that pattern (`riseLines` in `home.ts`).
- Pre-paint hide for load intros: `MotionIntro.astro` (rendered before the `[data-intro]` elements) adds `html.motion-intro`, CSS in `global.css` hides `[data-intro]`, and the page script calls `releaseIntro()` once GSAP holds the state. A 2.5 s timeout removes the class anyway, so a failed bundle never blanks the page. Above-the-fold elements need this; `data-reveal` alone flashes them.
- Sticky figures inside a CSS grid are bounded by their own grid cell, not the grid's padding: to give a sticky element more range, add height to the rows it spans (see the quote row on About).
- No Astro view transitions are enabled. The `astro:page-load` listeners in several components are future-proofing, and every script runs once per full page load.

## Cookie banner

Klaro loads from jsDelivr and is configured inline in both layouts (theme `top`, `wide`). `global.css` restyles it as a bottom glass banner and must keep `top: auto`, or the notice stretches over the whole viewport.

## Root-level strays

`hero-playground.html` (standalone hero prototype) and `german_homepage_copy.md` (a copy draft) are not part of the build. The `.astro` files are the source of truth for copy.
