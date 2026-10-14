/**
 * Homepage motion (EN + DE). Shared hooks (reveals, spotlight cards) come
 * from motion.ts; this file owns the homepage pieces.
 *
 * Hooks:
 *   [data-hero]            hero section (pointer target, exit trigger)
 *   [data-gradient-sheet]  gradient sheet behind everything; started by GradientSheet.astro, faded in here
 *   [data-hero-title]      headline; lines rise out of masks on load
 *   [data-cycle]           the headline's last words; its [data-cycle-item]s take turns
 *   [data-hero-fade]       fades up after the headline
 *   [data-hero-content]    drifts out as the hero scrolls away
 *   [data-scroll-cue]      appears last
 *   [data-pipeline]        current-project architecture diagram (pipeline-diagram.ts)
 */
import {
    gsap,
    ScrollTrigger,
    SplitText,
    finePointer,
    riseLines,
    introPending,
    releaseIntro,
    initPageMotion,
} from "./motion";
import { initPipelineDiagram } from "./pipeline-diagram";

/** How long each of the headline's last words holds before the next. */
const CYCLE_HOLD = 2.4;

const hero = document.querySelector<HTMLElement>("[data-hero]");
const gradient = hero?.querySelector<HTMLCanvasElement>("[data-gradient-sheet]");

if (initPageMotion()) {
    heroIntro();
    heroExit();
    initPipelineDiagram();
}

function heroIntro() {
    // If the pre-paint class is already gone, the safety timeout beat this
    // bundle and the hero is visible — animating it now would make it flash.
    if (!hero || !introPending()) {
        releaseIntro();
        cycleOutcomes();
        return;
    }

    const title = hero.querySelector<HTMLElement>("[data-hero-title]");
    const fades = hero.querySelectorAll<HTMLElement>("[data-hero-fade]");
    const cue = hero.querySelector<HTMLElement>("[data-scroll-cue]");
    const tl = gsap.timeline({ delay: 0.1 });

    let split: SplitText | null = null;
    if (title) {
        // The cycling words stay whole and ride in on the last line.
        const lines = riseLines(title, {}, { ignore: "[data-cycle]" });
        split = lines.split;
        tl.add(lines.tween, 0);
    }

    if (gradient) tl.from(gradient, { autoAlpha: 0, duration: 2, ease: "power2.out" }, 0);
    if (fades.length) {
        tl.from(fades, { autoAlpha: 0, y: 24, duration: 1, stagger: 0.12, ease: "power3.out" }, 0.45);
    }
    if (cue) tl.from(cue, { autoAlpha: 0, y: -8, duration: 1, ease: "power2.out" }, 1.3);
    // Unlike other headlines, this one goes back to plain markup once it has
    // landed: the cycling words rise and fall, and a line mask would clip them.
    tl.eventCallback("onComplete", () => {
        split?.revert();
        cycleOutcomes();
    });

    // Every intro element now holds its hidden state inline, so the
    // stylesheet-level hide can go.
    releaseIntro();
}

/**
 * The headline's last words take turns: everything a measurement can end in,
 * not only a decision. Each phrase fades up into the slot as the last one
 * lifts away; the slot is sized to the widest (Hero.astro), so nothing
 * around it moves. Queried fresh, because reverting the split rebuilt the
 * headline's nodes.
 */
function cycleOutcomes() {
    const slot = hero?.querySelector<HTMLElement>("[data-cycle]");
    const items = slot ? gsap.utils.toArray<HTMLElement>("[data-cycle-item]", slot) : [];
    if (!slot || items.length < 2) return;

    let current = 0;
    let visible = true;
    ScrollTrigger.create({
        trigger: slot,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (visible = self.isActive),
    });

    const next = () => {
        if (visible) {
            const out = items[current];
            current = (current + 1) % items.length;
            gsap.to(out, { autoAlpha: 0, yPercent: -30, duration: 0.4, ease: "power2.in" });
            gsap.fromTo(
                items[current],
                { autoAlpha: 0, yPercent: 30 },
                { autoAlpha: 1, yPercent: 0, duration: 0.7, delay: 0.25, ease: "power3.out" },
            );
        }
        gsap.delayedCall(CYCLE_HOLD, next);
    };
    gsap.delayedCall(CYCLE_HOLD, next);
}

function heroExit() {
    const content = hero?.querySelector<HTMLElement>("[data-hero-content]");
    if (!hero || !content) return;
    // With a mouse the content drifts up as it fades, eased by the scrub. On
    // a touch screen that drift, outrunning the finger and then catching up,
    // reads as the page slipping, so there it only fades, locked to the scroll.
    gsap.to(content, {
        y: finePointer ? -60 : 0,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom 25%", scrub: finePointer ? 0.5 : true },
    });
}
