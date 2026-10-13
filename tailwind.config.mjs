import plugin from "tailwindcss/plugin";
import { cssVariables, type } from "./src/styles/tokens.mjs";

// Every value comes from src/styles/tokens.mjs. The plugin writes the tokens
// to :root as CSS custom properties, and the theme below points utilities at
// those properties, so a class like `rounded-card` and a rule like
// `var(--radius-card)` can never disagree.

/** A colour utility that keeps Tailwind's opacity modifier (`text-ink-muted/60`). */
const c = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** A fluid type step: size, line height, letter spacing and weight in one class. */
const step = (name) => [
    `var(--text-${name})`,
    { lineHeight: `var(--leading-${name})`, letterSpacing: `var(--tracking-${name})`, fontWeight: type[name].weight },
];

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        // The palette is replaced, not extended: only token colours exist, so
        // an off-system class like `text-gray-300` simply does not compile.
        colors: {
            transparent: "transparent",
            current: "currentColor",
            inherit: "inherit",
            background: c("background"),
            surface: { DEFAULT: c("surface"), raised: c("surface-raised") },
            contrast: c("contrast"),
            ink: {
                strong: c("ink-strong"),
                DEFAULT: c("ink"),
                muted: c("ink-muted"),
                faint: c("ink-faint"),
            },
            primary: { DEFAULT: c("primary"), strong: c("primary-strong"), glow: c("primary-glow") },
            info: c("info"),
            warn: c("warn"),
            // Fixed steps of the overlay scale; no opacity modifier on purpose.
            line: { subtle: "var(--line-subtle)", DEFAULT: "var(--line)", strong: "var(--line-strong)" },
            wash: { subtle: "var(--wash-subtle)", DEFAULT: "var(--wash)", strong: "var(--wash-strong)" },
        },
        extend: {
            fontFamily: {
                sans: "var(--font-sans)",
                mono: "var(--font-mono)",
            },
            fontSize: {
                display: step("display"),
                h1: step("h1"),
                h2: step("h2"),
                h3: step("h3"),
                lead: step("lead"),
                stat: step("stat"),
            },
            spacing: {
                gutter: "var(--space-gutter)",
                section: "var(--space-section)",
                head: "var(--space-head)",
                card: "var(--space-card)",
                grid: "var(--space-grid)",
                nav: "var(--space-nav)",
            },
            maxWidth: {
                page: "var(--container-max)",
                measure: "var(--measure)",
            },
            borderRadius: {
                chip: "var(--radius-chip)",
                control: "var(--radius-control)",
                card: "var(--radius-card)",
                panel: "var(--radius-panel)",
                pill: "var(--radius-pill)",
            },
            boxShadow: {
                panel: "var(--shadow-panel)",
                sheet: "var(--shadow-sheet)",
            },
            transitionDuration: {
                DEFAULT: "var(--dur-base)",
                fast: "var(--dur-fast)",
                base: "var(--dur-base)",
                slow: "var(--dur-slow)",
                enter: "var(--dur-enter)",
                exit: "var(--dur-exit)",
            },
            transitionTimingFunction: {
                DEFAULT: "var(--ease-out)",
                out: "var(--ease-out)",
                in: "var(--ease-in)",
                "in-out": "var(--ease-in-out)",
            },
        },
    },
    plugins: [plugin(({ addBase }) => addBase(cssVariables()))],
};
