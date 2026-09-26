/**
 * Entry for pages that only use the shared hooks from motion.ts (e.g. the
 * Projects pages): load intro, scroll reveals, magnetic CTA, spotlight cards.
 */
import { initPageMotion, playIntro } from "./motion";

if (initPageMotion()) playIntro();
