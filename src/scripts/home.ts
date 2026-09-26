/**
 * Homepage motion (EN + DE). Shared hooks (reveals, magnetic buttons,
 * spotlight cards) come from motion.ts; this file owns the homepage pieces.
 *
 * Hooks:
 *   [data-hero]            hero section (pointer target, exit trigger)
 *   [data-hero-canvas]     node network canvas
 *   [data-hero-title]      headline; lines rise out of masks on load
 *   [data-accent]          word inside the headline that resolves from digits
 *   [data-hero-fade]       fades up after the headline
 *   [data-hero-content]    drifts out as the hero scrolls away
 *   [data-depth]           blob layer following the pointer at this ratio
 *   [data-scroll-cue]      appears last
 *   [data-pipeline]        current-project architecture diagram (pipeline-diagram.ts)
 */
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import {
    gsap,
    SplitText,
    finePointer,
    reducedMotion,
    riseLines,
    introPending,
    releaseIntro,
    initPageMotion,
} from "./motion";
import { initHeroNetwork } from "./hero-network";
import { initPipelineDiagram } from "./pipeline-diagram";

gsap.registerPlugin(ScrambleTextPlugin);

const hero = document.querySelector<HTMLElement>("[data-hero]");
const canvas = document.querySelector<HTMLCanvasElement>("[data-hero-canvas]");

if (hero && canvas) initHeroNetwork(hero, canvas, reducedMotion);

if (initPageMotion()) {
    heroIntro();
    heroExit();
    heroBlobs();
    initPipelineDiagram();
}

function heroIntro() {
    // If the pre-paint class is already gone, the safety timeout beat this
    // bundle and the hero is visible — animating it now would make it flash.
    if (!hero || !introPending()) {
        releaseIntro();
        return;
    }

    const title = hero.querySelector<HTMLElement>("[data-hero-title]");
    const fades = hero.querySelectorAll<HTMLElement>("[data-hero-fade]");
    const cue = hero.querySelector<HTMLElement>("[data-scroll-cue]");
    const tl = gsap.timeline({ delay: 0.1 });

    let split: SplitText | null = null;
    if (title) {
        const lines = riseLines(title);
        split = lines.split;
        tl.add(lines.tween, 0);

        // Queried after splitting: SplitText rebuilds the headline's nodes.
        const accent = title.querySelector<HTMLElement>("[data-accent]");
        const word = accent?.textContent?.trim();
        if (accent && word) {
            // Lock the width before swapping in digits (which run wider than
            // letters), or the line re-wraps inside its mask.
            gsap.set(accent, {
                width: accent.getBoundingClientRect().width,
                whiteSpace: "nowrap",
                clipPath: "inset(-0.25em 0 -0.35em 0)",
            });
            accent.textContent = Array.from(word, () => Math.floor(Math.random() * 10)).join("");
            tl.to(
                accent,
                {
                    duration: 1.5,
                    ease: "none",
                    scrambleText: { text: word, chars: "0123456789", revealDelay: 0.45, speed: 0.45 },
                    onComplete: () => gsap.set(accent, { clearProps: "width,whiteSpace,clipPath" }),
                },
                0.2,
            );
        }
    }

    if (canvas) tl.from(canvas, { autoAlpha: 0, duration: 2.4, ease: "power2.out" }, 0);
    if (fades.length) {
        tl.from(fades, { autoAlpha: 0, y: 24, duration: 1, stagger: 0.12, ease: "power3.out" }, 0.45);
    }
    if (cue) tl.from(cue, { autoAlpha: 0, y: -8, duration: 1, ease: "power2.out" }, 1.3);
    tl.eventCallback("onComplete", () => split?.revert());

    // Every intro element now holds its hidden state inline, so the
    // stylesheet-level hide can go.
    releaseIntro();
}

function heroExit() {
    const content = hero?.querySelector<HTMLElement>("[data-hero-content]");
    if (!hero || !content) return;
    gsap.to(content, {
        y: -60,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom 25%", scrub: 0.5 },
    });
}

function heroBlobs() {
    if (!hero || !finePointer) return;
    const layers = Array.from(hero.querySelectorAll<HTMLElement>("[data-depth]")).map((el) => ({
        depth: Number(el.dataset.depth) || 0.05,
        x: gsap.quickTo(el, "x", { duration: 2.2, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 2.2, ease: "power3.out" }),
    }));
    hero.addEventListener("pointermove", (e) => {
        const rect = hero.getBoundingClientRect();
        const dx = e.clientX - rect.left - rect.width / 2;
        const dy = e.clientY - rect.top - rect.height / 2;
        layers.forEach((l) => {
            l.x(dx * l.depth * 2);
            l.y(dy * l.depth * 2);
        });
    });
    hero.addEventListener("pointerleave", () =>
        layers.forEach((l) => {
            l.x(0);
            l.y(0);
        }),
    );
}
