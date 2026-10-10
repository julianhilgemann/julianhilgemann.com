/**
 * Work page motion. Shared hooks (reveals, magnetic CTA, spotlight cards)
 * come from motion.ts; this file owns the two pieces the CV adds.
 *
 * Hooks:
 *   (load intro: [data-page-title], [data-intro-fade] via playIntro)
 *   [data-timeline]        rail fills and dots light as entries are reached
 *   (the stat figures use the shared [data-count] hook in motion.ts)
 */
import { gsap, ScrollTrigger, playIntro, initPageMotion } from "./motion";

if (initPageMotion()) {
    playIntro();
    timeline();
}

function timeline() {
    const el = document.querySelector<HTMLElement>("[data-timeline]");
    if (!el) return;
    const fill = el.querySelector("[data-timeline-fill]");
    if (fill) {
        gsap.fromTo(
            fill,
            { scaleY: 0 },
            {
                scaleY: 1,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top 65%", end: "bottom 65%", scrub: 0.4 },
            },
        );
    }
    // Markup ships the dots lit (the no-JS / reduced-motion state).
    el.querySelectorAll<HTMLElement>("[data-timeline-dot]").forEach((dot) => {
        dot.classList.remove("is-lit");
        ScrollTrigger.create({
            trigger: dot,
            start: "top 65%",
            onEnter: () => dot.classList.add("is-lit"),
            onLeaveBack: () => dot.classList.remove("is-lit"),
        });
    });
}
