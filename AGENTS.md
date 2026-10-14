# julianhilgemann.com — agent reference

Personal site for Julian Hilgemann (data platform engineer: the systems between a measurement and a decision). Static Astro 4 + Tailwind 3 site, English-only, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

The site tells one story: reality arrives as dense signal, data work compresses it down to a number, and expressive work opens that number back up. `/story` is that narrative in full; every other page is a doorway into part of it. The source of that framing is the "Website Storyboard: Signal to Number and Back" doc, which also holds the copy variants and the slogan bank.

## Site map

| Route | Page file(s) | What it is |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Hero (positioning line + sub-line; the name lives in the nav), "Now building" (`CurrentProject` + animated `PipelineDiagram`), "What I do" and "Selected work" (`SelectedWork`), contact CTA. GSAP motion. |
| `/story` | `story.astro` | The narrative: seven chapters and a coda, each one a full-height section holding a card, with one `StoryField` figure each and `NumberAnatomy` in chapter 6. Motion via `story.ts` + `story-field.ts`. |
| `/projects` | `projects.astro` | Full project list (`Projects` → `ProjectCard`). GSAP motion via `page.ts`. |
| `/timeline` | `timeline.astro` | The CV, newest first: "The path so far" runs from the current role back to school in Berlin, then "How I work". The two roles carry the `#platform` / `#bi` anchors that the homepage and Story chapters 4 and 6 deep-link into; everything earlier is quieter (neutral marker, no chips). Each marker after "Now" is a place, so the timeline reads as the route back. Was `/work`, which now redirects. Motion via `timeline.ts`. |
| `/services` | `services.astro` | Interactive pricing calculator + CTA. The consulting offer, kept alongside the portfolio. |
| `/page-engine` | `page-engine.astro` | Architecture explainer; data array in frontmatter. Linked from nowhere; its CTA opens the contact dialog. |
| `/design-system` | `design-system.astro` | Catalogue of every token and component, rendered live. Unlinked, `noindex`, skipped by the llms generator. |
| `/hub` | `hub.astro` | "Gateway" page: a link hub, mostly reached on phones. No nav. GSAP motion via `gateway.ts`. |
| legal | `impressum`, `datenschutz`, `cookie-einstellungen`, and the same three under `de/` | Legal pages. The German copies are the only German pages left. |

Layouts: `src/layouts/Layout.astro` (the whole site) and `LayoutDE.astro` (the three German legal pages only) own `<head>`, GA4 consent defaults, the Klaro cookie banner config, Nav, Footer and the contact modal. `LayoutDE` lacks the `noFooter` / `noAnalytics` props that `Layout` has.

## One language

The site was bilingual and is not any more. What that leaves behind:

- `Nav.astro` renders one English item list. Its `lang` prop survives only to label the contact button on the German legal pages.
- German legal pages stay German, because that is the form German law expects. They keep `LayoutDE`, which keeps `src/components/de/Footer.astro` and `de/ContactModal.astro` alive. Those three files are the entire `de/` tree now. The English footer links `/de/impressum`, which is the one way in.
- Every removed route redirects through the `redirects` map in `astro.config.mjs`: `/about` → `/story`, `/start` → `/hub`, `/work` → `/timeline`, and each `/de/*` content route to its English page. GitHub Pages serves no server redirects, so Astro emits these as static pages that meta-refresh and carry a canonical link. Deleting a route means adding it there.
- `german_homepage_copy.md` at the repo root is a leftover draft of copy that no longer ships.

## Pricing calculator

- Prices, tiers, thresholds: `src/data/pricing-config.json`. Maths: `src/lib/pricing.ts` (`calculate()` is the single entry point; rounding is reconciled so the legend always sums to the total).
- Keys starting with `_` are **internal** (day rate, risk buffer, lead thresholds). They must never reach the browser or a published file. The client bundle currently tree-shakes them out and `scripts/generate-llms.mjs` strips them explicitly; after touching how the JSON is imported, grep `dist/_astro/` for `_anchor` to confirm.
- `PricingCalculator.astro` still takes a `lang` prop and all its copy still lives in `src/lib/pricing-strings.ts` typed by `LocaleStrings`, with both locale entries. Only the English one is reachable now; the German strings are dead but harmless, and the thin `de/PricingCalculator.astro` wrapper is gone.
- The calculator's bar segments and legend rows are built in JS, so they never receive Astro's scope attribute. Their styles use `:global()` nested under `#pricing-calculator` / `[data-sticky]`. The same applies to any component that creates DOM at runtime.
- The mobile sticky bar (`[data-sticky]`) sits outside `#pricing-calculator` so it can span the viewport. Its miniature bar reads the same `--seg-*` chart palette, which `tokens.mjs` (`viz`) sets on `:root`.

## Components

Shared and in use: `Nav.astro` (takes `lang`), `ProjectCard.astro`, `Section.astro`, `MotionIntro.astro`, `NetworkBackdrop.astro`, `GradientSheet.astro` (the moving gradient, see Motion), `SecondaryCTA.astro` ("Questions? I reply fast." over a gradient sheet; closes the homepage, Projects and Timeline), `LetsDesignCTA.astro` (the closing screen of `/services`), `ContactModal.astro`.

Figures take their text as props, never as literal markup — see the llms section for why: `NumberAnatomy.astro` (Story chapter 6), `PipelineDiagram.astro` (homepage), `StoryField.astro` (one still frame per Story chapter, seeded so the field is the same cloud in every build).

`Projects.astro` holds the project data and renders only the card list; the Projects page supplies the heading. The homepage's current project lives in `CurrentProject.astro` — to feature a different project, swap that section and its diagram props. `SelectedWork.astro` holds both of the homepage's lower screens. "What I do" is the chain in three stages — foundation, structure, surface — one card each, carrying the prose, the stack chips and a link to the proof on `/timeline` or `/story`. Each stage carries a tone (`.tone-info` for the two system stages, `.tone-primary` for the number) that colours its marker, icon tile and chips; hovering a card dims the other two. Below it, the four "Selected work" tiles, each tagged with the Story chapter it belongs to and drawn in that chapter's tone (the `tone` field). The card prose is literal markup; markers and chips travel as expressions, so the docs carry the prose once. Neither the cards nor the Timeline page show counted figures (customers, tables, measures): the copy describes the work, not its size.

## llms.txt / docs generation

`npm run build` = `astro build && node scripts/generate-llms.mjs`. The generator flattens each page's `.astro` source (plus the components that page imports) into Markdown and writes `public/llms.txt`, `public/llms-full.txt`, and `public/docs/**.md`.

- It runs **after** `astro build`, so its output reaches `dist/` only on the *next* build. CI runs the same script, so what ships is whatever is committed in `public/`. After changing page copy, run `npm run build` locally and commit the regenerated `public/` files.
- It reads source, not rendered HTML: text produced by `{array.map(...)}` expressions or client-side JS is invisible to it. The services docs are rebuilt from the pricing JSON for exactly this reason. The project cards have the same blind spot: their data array never reaches `docs/projects.md`, and neither do the homepage's "Selected work" tiles.
- It keeps link targets only for `<a>` inside `<p>`, `<li>` or headings, and only when `href` is a literal string (not `{expr}`). The Story page's cross-site links read from a constant, so they do not reach the docs.
- Story and Timeline use this on purpose: figure labels, chapter numbers, stats and tags that only restate the prose live in a frontmatter `ui` object, so the generated docs carry the prose once. Keep real copy as literal markup — the chapter text is deliberately eight literal sections rather than a `.map()` — and route decorative restatements through expressions.
- A new page needs an entry in `PAGE_META` / `PAGE_ORDER` in the script or it gets a generic title. `SKIP_PAGES` keeps a page out entirely (`404`, `design-system`).
- `public/docs/llmcntxt.md` is hand-written and preserved; every other `.md` in `public/docs/` is regenerated.
- To verify a change without touching tracked files, run `npx astro build` alone.

## Design system

`src/styles/tokens.mjs` is the single source of truth for every visual value: colour, type, space, shape, motion. `tailwind.config.mjs` writes each token to `:root` as a CSS custom property and points the utilities at those properties; `src/styles/components.css` builds the shared components on them; canvas, WebGL and SVG code (`hero-network.ts`, `gradient-sheet.ts`, `pipeline-diagram.ts`, `StoryField`, `NumberAnatomy`) imports the values from the module, because canvas fills and SVG presentation attributes cannot read CSS variables. Change a value in the token file, never at the call site. `/design-system` renders all of it, and is the page to check after touching a token or a component.

- **Vocabulary.** Text runs on one `ink` scale: `text-ink-strong` (headings), `text-ink` (emphasis, leads), `text-ink-muted` (copy), `text-ink-faint` (labels). Hairlines and translucent fills are fixed steps: `border-line-subtle | line | line-strong`, `bg-wash-subtle | wash | wash-strong`. Type steps are one class each, carrying size, leading, tracking and weight, fluid between phone and desktop: `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-lead`. Space: `.page-container` (the content column, gutter included), `.section` / `py-section`, `mb-head`, `p-card`, `gap-grid`, `pt-nav`. Radii: `rounded-chip | control | card | panel | pill`.
- **The colour palette is replaced, not extended.** Only token colours exist, so `text-white`, `text-gray-400` or `bg-white/10` compile to nothing, silently. Tailwind's base type sizes and spacing scale remain for in-between values.
- **Components** live in the `components` layer, so a utility on the same element wins (`card p-0` for an image tile): `.btn` (+ `.btn-primary`, the orange edge of the main action; `.btn-solid`, the one transactional step; `.btn-sm` / `.btn-lg`), `.arrow-link`, `.text-link`, `.card` (+ `.card-hover`, usually with `.spotlight-card`), `.panel`, `.glass`, `.eyebrow` (+ `.eyebrow-num`, `.eyebrow-rule`, `.eyebrow-tone`), `.chip` in a `.chip-list`, `.badge` (+ `.badge-solid`, `.badge-dot`), `.icon-tile`, `.icon-btn`, `.stat-value` / `.stat-label`. Compose new UI from these first. Buttons stay plain `<a class="btn">` rather than an Astro component, because the llms generator keeps link targets only from literal `<a>` tags.
- **Tone.** Components with an accent draw in `--tone`: orange by default, blue under `.tone-info` on the element or any ancestor, faint under `.tone-neutral`. Set it once on the container (a Story chapter, a "What I do" stage, a Selected-work tile) and everything inside follows.
- **Hover motion** uses the individual `translate` / `scale` properties (`--lift`, `--press`), because GSAP owns `transform` on anything it reveals. Transitions default to `--dur-base` and `--ease-out`, so `transition-colors` needs no duration or easing class. Overlays arrive slower than they leave: `--dur-enter` with `--ease-out` in, `--dur-exit` with `--ease-in` out (the mobile menu in `Nav.astro`, a clip-path blind toggled by `[data-open]` on the header).
- One focus ring covers everything a keyboard reaches (base styles in `global.css`, `--focus-*` tokens).

Tone is calm, high-trust, glass-over-dark, with generous whitespace.

The site reads as a sequence of screens: the hero, each Story chapter, "What I do", "Selected work" and both contact CTAs are `.section-screen` sections with their content centred. Every page starts its first line at the same point: the same left edge, because all content sits in `.page-container`, and the same height, the layout's own `pt-nav` below the fixed nav. A page whose opening screen is full-height (`/story`) subtracts that offset from its own height (`calc(100svh - var(--space-nav))`) and adds no top padding of its own, rather than pushing its title down a second time. Figures that must share a screen with text are sized by **height** below `lg` (`max-height` in `svh` plus `width: auto`), because a width-driven drawing pushes everything else off a phone — that is why the tall `PipelineDiagram`, `StoryField` and `NumberAnatomy` all carry `svh` caps, with a second, tighter step under `(max-height: 760px)` for short phones like an SE. If you add a figure to a full-height section, give it the same treatment and check it at 375x667. Motion is micro-interactions and fade + rise reveals, never loud gradients or kinetic gimmicks. The one moving gradient is the gradient sheet behind the homepage hero and the contact screens, and its palette is mixed down toward the background so white text reads over any part of it.

Every page has a faint blueprint dot grid behind it: `body::before` in `global.css`, fixed to the viewport so content scrolls over it, fading toward the bottom corners. It sits under all content because `body` is `isolation: isolate` (the body paints its own background, which would otherwise cover it). A section that paints its own backdrop, like the homepage hero, covers it; there is no per-page grid to add.

The two accents now carry the story, not just a UI role: blue is system and structure (Story chapters 3 to 5, the "Selected work" chapter tags), orange is belief, the number and the burst (chapters 2, 6 and 7, every CTA). Each Story chapter section carries the matching tone class. Chapter 7 is the one place both appear at once, so the expansion is felt rather than read.

Typography on `/story` compresses with the narrative: measure and letter-spacing tighten from chapter 1 to 6, weight rises toward the number, which is set in monospace, and chapter 7 opens up again. The steps are in the page's own `<style>` block as `.ch-1` … `.ch-7`, small enough to feel rather than see.

The fuller brief (`cntxt/design.md`, `cntxt/specs.md`, …) and `pricing-calculator-context/` are gitignored and exist only on the owner's machine. Read them when present.

## Motion (homepage, Story, Work)

- `src/scripts/motion.ts` is the shared toolkit: plugin registration, `riseLines`, `whileVisible` (pauses an endless animation off-screen), and the generic **hooks** (`data-reveal`, `data-reveal-lines`, `data-reveal-stagger`, `data-reveal-batch`, `data-count`, `.spotlight-card`). Page entry points call `initPageMotion()` (and usually `playIntro()`, the shared load intro) and then add their own pieces: `home.ts` (homepage; also starts `pipeline-diagram.ts`), `story.ts` (the Story page, with `story-field.ts`), `timeline.ts` (the CV timeline), `gateway.ts` (`/hub`) and `page.ts` (pages that need only the shared hooks, e.g. Projects). Each file lists its hooks at the top. To animate something new, add a hook and handle it in the matching script, keeping the markup free of logic. A page with no script import gets no motion, so hooks on shared components (e.g. `SecondaryCTA`) are inert elsewhere.
- Node network canvas: `src/scripts/hero-network.ts`, placed through `NetworkBackdrop.astro` on `/hub`. It pauses off-screen or in a hidden tab, and paints a static frame under reduced motion. The homepage hero used to layer it over the gradient sheet and no longer does; the hero is the sheet alone under a tinted glass layer.
- Gradient sheet: `src/scripts/gradient-sheet.ts`, plain WebGL with no library, placed through `GradientSheet.astro`: behind the homepage hero and behind `SecondaryCTA`. It ports the technique behind theartmarket.artbasel.com: a finely divided plane tipped away from the camera and folded by simplex noise, coloured per vertex by five stacked noise layers. Its palette is `gradientSheet` in `tokens.mjs`, in layer order. A colour dark enough to read as ground covers what lies under it, and anything lighter is screened on, because blue and orange mixed directly turn olive. The pointer turns the sheet slightly, and it pauses and handles reduced motion the same way the network does.
  - The component carries its own `<script>`, so a sheet starts on any page regardless of which motion script that page imports. Its parent section sizes it and receives the pointer.
  - `fade` melts the top and bottom edges into the page, for a sheet mid-page. `intro` hides it before first paint for `home.ts` to fade in.
  - `start` is the frame it opens on and the reduced-motion still. Phones see the middle third of the desktop frame, so pick a start with colour in the centre, and check it at 1440x900 and 375x667 after changing the palette. The hero opens on 8, the CTA on 22.
  - Each sheet is a WebGL context and Chrome keeps only 16 alive, so keep it to a couple per page.
- Reuse before adding: new pages should compose the existing vocabulary (masked-line intro, fade + rise, `.card` + `.spotlight-card`, `.link-card`, the network backdrop) so motion stays aligned across the site. Reveal distance, pace and stagger come from `motion` in `tokens.mjs`. Buttons do not follow the cursor: a magnetic pull was tried and removed as too much.
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
- When the timeline completes the figure starts its idle loop, which is the answer to "the chapter is finished, but the page should not look dead". The cards keep a plain border; the travelling conic light lives on the contact buttons instead, as the `.orbit-ring` utility in `global.css` (`@property --orbit-angle`), so the one action on a page is the thing that keeps moving.

`StoryField` figures have two phases in `story-field.ts`: `fieldEnter(fig, tl, at)` adds tweens to the chapter's timeline, and `fieldIdle(fig)` is what keeps moving afterwards — bands drifting, rays flickering, a lineage edge pulsing, the forecast's dashes marching, the coda turning. The measurement figure borrows the choices-layer idiom from `NumberAnatomy`: every second or two one sample goes out and another lights, because the selection behind a number is never finished. Every idle is wrapped in `whileVisible`, which pauses it off-screen — eight chapters of endless animation would otherwise all run at once.

Figure geometry is in viewBox units. Anything pivoting on a point *in the drawing* (the inference fan on its last data point, the burst on its core) must use GSAP's `svgOrigin`, not `transformOrigin`, which measures from the element's own bounding box. And each figure's markup is its animated END state, so reduced-motion and no-JS visitors see exactly where the entrance lands.

## Still to build on /story

The page ships as text and still frames, which is also the reduced-motion version and can never be blocked by the animation work. Not built yet: the one persistent particle field whose state blends per chapter (Three.js or regl behind an Astro island, driven by ScrollTrigger), the held beat at the number, chapter 7's opt-in audio with the Web Audio analyser and its **Expand** button, and the homepage hero's 10–12 second loop of the whole arc. The storyboard's plan is to prototype the field states in TouchDesigner and port them to GLSL.

## Cookie banner

Klaro loads from jsDelivr and is configured inline in both layouts (theme `top`, `wide`). `src/styles/klaro.css` (imported by `global.css`) restyles it on the tokens as a bottom glass banner, and must keep `top: auto`, or the notice stretches over the whole viewport.

## Root-level strays

`hero-playground.html` (standalone hero prototype) and `german_homepage_copy.md` (a copy draft for a German homepage that no longer exists) are not part of the build. The `.astro` files are the source of truth for copy.
