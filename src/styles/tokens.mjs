/**
 * Design tokens: the one place the site's look is decided.
 *
 * Every visual value starts here and reaches the page three ways:
 *   1. tailwind.config.mjs writes each token to a CSS custom property on
 *      :root (`cssVariables()` below) and points the utilities at those
 *      properties: `text-ink-muted`, `rounded-card`, `py-section`, `text-h2`.
 *   2. The component layer (src/styles/components.css) and the page styles
 *      read the properties directly: `var(--radius-card)`.
 *   3. Canvas and SVG code imports the values from this module (hero network,
 *      Story figures, pipeline diagram), because canvas fills and SVG
 *      presentation attributes cannot read CSS variables.
 *
 * Change a value here and every one of those follows on the next build. The
 * rendered catalogue of tokens and components lives at /design-system.
 *
 * Plain .mjs rather than .ts so the Tailwind config can import it as is.
 */

/* ── Colour ────────────────────────────────────────────────────────────────
   Two accents carry the story: blue is system and structure, orange is the
   number, the decision and every call to action. Everything else is a
   neutral. Text runs on one four-step `ink` scale; lines and washes are the
   `contrast` colour at fixed opacities, so a hairline is the same hairline
   everywhere. */
export const color = {
    background: "#0B1220", // the page
    surface: "#111827", // opaque raised layers: dialog, mobile menu, figure boxes
    surfaceRaised: "#141E30", // a layer lifted off a surface (the KPI plane, a highlighted sheet)
    contrast: "#FFFFFF", // what lines, washes and figure strokes are mixed from
    ink: {
        strong: "#FFFFFF", // headings, titles, figures
        DEFAULT: "#F3F4F6", // emphasised body text, leads
        muted: "#9CA3AF", // body copy, secondary text
        faint: "#808794", // labels and markers; still 5:1 on the background
    },
    primary: {
        DEFAULT: "#F59E0B", // orange: the number, the decision, every CTA
        strong: "#D97706", // pressed / hovered solid orange
        glow: "#FDE047", // far end of the accent gradient
    },
    info: {
        DEFAULT: "#38BDF8", // blue: system, structure, signal
        glow: "#67E8F9", // far end of the blue gradient (the hero's cycling words)
    },
    warn: "#FBBF24", // pricing warnings
};

/** Opacities of `contrast` that make the overlay scale. */
export const alpha = {
    line: { subtle: 0.06, DEFAULT: 0.1, strong: 0.18 },
    wash: { subtle: 0.03, DEFAULT: 0.05, strong: 0.08 },
};

/** The frosted panel: background at this opacity, blurred, with a `line` border. */
export const glass = { alpha: 0.7, blur: "20px" };

/* Categorical palette for the pricing chart. OKLCH-generated and validated
   against the background: adjacent CVD ΔE 12.9 (target 8), normal-vision
   ΔE 21.4 (floor 15), every hue >= 3:1. Not interchangeable with the accents;
   re-run the validator before changing one. */
export const viz = {
    foundation: "#EB635E",
    sources: "#08A2AF",
    pages: "#BB8D07",
    dataLayer: "#5B89F6",
    extras: "#42AF4D",
    uplift: "#C165C7",
};

/* The gradient sheet behind the homepage hero and the contact screens
   (gradient-sheet.ts). Five colours in
   layer order: the first is the ground, each later one a noise field laid
   over everything before it, so the last reads strongest. Blue leads, the
   orange runs through it as the rarer ribbon, and the background returns as
   a break that carves dark folds between them. The accents are mixed down
   toward the background so white text stays readable over any of them. */
export const gradientSheet = [
    color.background,
    mixHex(color.background, color.info.DEFAULT, 0.17), // deep blue
    mixHex(color.background, color.primary.DEFAULT, 0.78), // ember
    color.background,
    mixHex(color.background, color.info.DEFAULT, 0.65), // signal blue
];

/* ── Type ──────────────────────────────────────────────────────────────────
   System fonts only. Sizes are fluid between a 375px phone and a 1280px
   desktop, so a heading never jumps at a breakpoint. */
export const font = {
    sans: ["ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "Helvetica", "Arial", "sans-serif"],
    mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
};

export const type = {
    display: { size: "clamp(3rem, 2.38rem + 2.65vw, 4.5rem)", leading: "1.08", tracking: "-0.025em", weight: "700" }, // hero, Story opening
    h1: { size: "clamp(3rem, 2.69rem + 1.33vw, 3.75rem)", leading: "1.1", tracking: "-0.025em", weight: "700" }, // page titles
    h2: { size: "clamp(1.875rem, 1.41rem + 1.99vw, 3rem)", leading: "1.15", tracking: "-0.02em", weight: "700" }, // section headings
    h3: { size: "clamp(1.25rem, 1.15rem + 0.44vw, 1.5rem)", leading: "1.3", tracking: "-0.01em", weight: "700" }, // card titles
    lead: { size: "clamp(1.25rem, 1.15rem + 0.44vw, 1.5rem)", leading: "1.55", tracking: "0", weight: "400" }, // the first paragraph of a page
    stat: { size: "clamp(1.75rem, 1.5rem + 0.6vw, 2rem)", leading: "1.1", tracking: "-0.01em", weight: "700" }, // counted figures
    eyebrow: { size: "0.75rem", leading: "1.4", tracking: "0.2em", weight: "500" }, // mono labels above a title
};

/* ── Space and layout ──────────────────────────────────────────────────── */
export const space = {
    gutter: { base: "2rem", sm: "3rem", lg: "4rem" }, // page side padding, stepped at the sm / lg breakpoints
    section: "clamp(5rem, 3.6rem + 4vw, 7rem)", // vertical padding of a section
    head: "clamp(2.5rem, 2rem + 1.5vw, 3.5rem)", // section heading to its content
    card: "clamp(1.5rem, 1.25rem + 0.5vw, 1.75rem)", // card padding
    grid: "clamp(1.25rem, 1rem + 0.5vw, 1.5rem)", // gap between cards
    nav: "8rem", // clearance under the fixed nav: where every page's first line starts
};

export const layout = {
    container: "1200px", // content width, gutters included
    measure: "42rem", // longest comfortable line of body copy
};

/* ── Shape ─────────────────────────────────────────────────────────────── */
export const radius = {
    chip: "0.375rem", // tags, stack chips
    control: "0.75rem", // option tiles, icon tiles, images inside a card
    card: "1rem", // every card
    panel: "1.5rem", // large containers: dialog, menu, diagram, Story chapter
    pill: "9999px", // buttons, badges, the nav bar
};

export const shadow = {
    panel: "0 8px 32px rgb(0 0 0 / 0.5)",
    sheet: "0 -12px 32px rgb(0 0 0 / 0.45)",
};

/** What dims the page behind a dialog (contact, cookie settings). */
export const scrim = { color: "rgb(0 0 0 / 0.6)", blur: "4px" };

/* ── Interaction ─────────────────────────────────────────────────────────
   One timing for every hover, one lift for every card, one press for every
   button. GSAP values sit here too, so scroll reveals share the CSS rhythm. */
export const motion = {
    duration: {
        fast: "180ms",
        base: "300ms",
        slow: "600ms",
        // Overlays (the mobile menu): things arrive slower than they leave.
        enter: "420ms",
        exit: "260ms",
        // One lap of the technology tape on /about: slow enough to read.
        tape: "23s",
    },
    ease: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)", // arrivals and every hover
        in: "cubic-bezier(0.4, 0, 1, 1)", // departures: start soft, leave quickly
        inOut: "cubic-bezier(0.65, 0, 0.35, 1)", // loops and morphs
    },
    lift: "-4px", // card hover
    press: "0.97", // button :active scale
    reveal: { y: 28, yLarge: 48, duration: 1, stagger: 0.1, ease: "power3.out" },
};

export const button = {
    padY: "0.75rem",
    padX: "1.75rem",
    sm: { padY: "0.5rem", padX: "1.125rem" },
    lg: { padY: "1rem", padX: "2.25rem" },
    radius: radius.pill,
    weight: "500",
};

export const focus = { width: "2px", offset: "3px", color: color.info.DEFAULT };

/* ── Helpers ───────────────────────────────────────────────────────────── */

/** "#F59E0B" -> "245 158 11", the form `rgb(var(--x) / a)` needs. */
export function channels(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join("") : h, 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** The hex colour `t` of the way from `a` to `b`: mixHex(color.background, color.info.DEFAULT, 0.2). */
export function mixHex(a, b, t) {
    const [ca, cb] = [a, b].map((hex) => channels(hex).split(" ").map(Number));
    return "#" + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** A token colour at an opacity, for canvas and SVG: rgba(color.info.DEFAULT, 0.4). */
export function rgba(hex, a) {
    return `rgba(${channels(hex).split(" ").join(", ")}, ${a})`;
}

/**
 * Every token as a CSS custom property. Tailwind's config adds the result as
 * base styles, so the properties exist on every page that loads global.css.
 */
export function cssVariables() {
    const root = {
        "--color-background": channels(color.background),
        "--color-surface": channels(color.surface),
        "--color-surface-raised": channels(color.surfaceRaised),
        "--color-contrast": channels(color.contrast),
        "--color-ink-strong": channels(color.ink.strong),
        "--color-ink": channels(color.ink.DEFAULT),
        "--color-ink-muted": channels(color.ink.muted),
        "--color-ink-faint": channels(color.ink.faint),
        "--color-primary": channels(color.primary.DEFAULT),
        "--color-primary-strong": channels(color.primary.strong),
        "--color-primary-glow": channels(color.primary.glow),
        "--color-info": channels(color.info.DEFAULT),
        "--color-info-glow": channels(color.info.glow),
        "--color-warn": channels(color.warn),

        "--line-subtle": `rgb(var(--color-contrast) / ${alpha.line.subtle})`,
        "--line": `rgb(var(--color-contrast) / ${alpha.line.DEFAULT})`,
        "--line-strong": `rgb(var(--color-contrast) / ${alpha.line.strong})`,
        "--wash-subtle": `rgb(var(--color-contrast) / ${alpha.wash.subtle})`,
        "--wash": `rgb(var(--color-contrast) / ${alpha.wash.DEFAULT})`,
        "--wash-strong": `rgb(var(--color-contrast) / ${alpha.wash.strong})`,

        "--glass-bg": `rgb(var(--color-background) / ${glass.alpha})`,
        "--glass-blur": glass.blur,
        "--glass-border": "var(--line)",

        "--font-sans": font.sans.join(", "),
        "--font-mono": font.mono.join(", "),

        "--space-gutter": space.gutter.base,
        "--space-section": space.section,
        "--space-head": space.head,
        "--space-card": space.card,
        "--space-grid": space.grid,
        "--space-nav": space.nav,
        "--container-max": layout.container,
        "--measure": layout.measure,

        "--shadow-panel": shadow.panel,
        "--shadow-sheet": shadow.sheet,
        "--scrim": scrim.color,
        "--scrim-blur": scrim.blur,

        "--dur-fast": motion.duration.fast,
        "--dur-base": motion.duration.base,
        "--dur-slow": motion.duration.slow,
        "--dur-enter": motion.duration.enter,
        "--dur-exit": motion.duration.exit,
        "--dur-tape": motion.duration.tape,
        "--ease-out": motion.ease.out,
        "--ease-in": motion.ease.in,
        "--ease-in-out": motion.ease.inOut,
        "--lift": motion.lift,
        "--press": motion.press,

        "--btn-pad-y": button.padY,
        "--btn-pad-x": button.padX,
        "--btn-sm-pad-y": button.sm.padY,
        "--btn-sm-pad-x": button.sm.padX,
        "--btn-lg-pad-y": button.lg.padY,
        "--btn-lg-pad-x": button.lg.padX,
        "--btn-radius": button.radius,
        "--btn-weight": button.weight,

        // The accent a component draws in. Orange unless an ancestor sets
        // `.tone-info` (see components.css): blue is system, orange the number.
        "--tone": "var(--color-primary)",

        "--focus-width": focus.width,
        "--focus-offset": focus.offset,
        "--focus-color": channels(focus.color),
    };
    for (const [name, t] of Object.entries(type)) {
        root[`--text-${name}`] = t.size;
        root[`--leading-${name}`] = t.leading;
        root[`--tracking-${name}`] = t.tracking;
        root[`--weight-${name}`] = t.weight;
    }
    for (const [name, value] of Object.entries(radius)) root[`--radius-${name}`] = value;
    for (const [name, value] of Object.entries(viz)) root[`--seg-${name}`] = value;

    return {
        ":root": root,
        "@media (min-width: 640px)": { ":root": { "--space-gutter": space.gutter.sm } },
        "@media (min-width: 1024px)": { ":root": { "--space-gutter": space.gutter.lg } },
    };
}
