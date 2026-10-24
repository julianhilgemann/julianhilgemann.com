/**
 * The site's design tokens: the light theme of the shared design system.
 *
 * Every value lives in the design-system submodule (design-system/tokens.mjs),
 * which hyperadapted.com and the ecosystem graph read too; those two are dark,
 * this site is light. This file only picks the theme, under the names the
 * rest of the code has always imported from here, so `tailwind.config.mjs`,
 * the component styles and every canvas or SVG figure follow it unchanged.
 *
 * To pick up a change made in design-system:
 *   git submodule update --remote design-system
 *
 * The names are re-exported one by one rather than with `export *`: the
 * Tailwind config is loaded through a CommonJS transform, where a star export
 * and a local export of the same name do not reliably resolve to the local one.
 */
import * as ds from "../../design-system/tokens.mjs";

// Shared by both themes.
export const { font, type, space, layout, radius, glass, motion, button, channels, mixHex, rgba } = ds;

// This site's theme.
export const { color, alpha, viz, gradientSheet, shadow, scrim, focus, cssVariables } = ds.theme("light");
