/**
 * Gateway page (/hub). Same vocabulary as the homepage: the hero's node
 * network behind glass, a masked-line intro, spotlight cards.
 *
 * Hooks:
 *   [data-network]         wrapper that sizes the canvas and takes the pointer
 *   [data-network-canvas]  node network (NetworkBackdrop.astro)
 *   (load intro: [data-page-title], [data-intro-fade], [data-intro-stagger] via playIntro)
 */
import { reducedMotion, initPageMotion, playIntro } from "./motion";
import { initHeroNetwork } from "./hero-network";

const wrap = document.querySelector<HTMLElement>("[data-network]");
const canvas = wrap?.querySelector<HTMLCanvasElement>("[data-network-canvas]");
if (wrap && canvas) initHeroNetwork(wrap, canvas, reducedMotion);

if (initPageMotion()) playIntro();
