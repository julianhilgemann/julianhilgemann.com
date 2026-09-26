/**
 * Shared motion toolkit for the pages that opt in (homepage, About). Page
 * entry points (home.ts, about.ts) call initPageMotion() and then add their
 * own pieces; components only carry data-* hooks.
 *
 * Hooks handled here:
 *   [data-intro]           hidden pre-paint by `html.motion-intro` (MotionIntro.astro)
 *   [data-page-title]      load intro: lines rise out of masks       ┐
 *   [data-intro-fade]      load intro: fade + rise after the title   │ playIntro()
 *   [data-intro-stagger]   load intro: children arrive in sequence   │
 *   [data-intro-visual]    load intro: a figure fades up             │
 *   [data-intro-backdrop]  load intro: slow fade (network canvas)    ┘
 *   [data-reveal-lines]    heading, line-masked reveal on scroll
 *   [data-reveal]          fade + rise on scroll
 *   [data-reveal-stagger]  children fade + rise in sequence on scroll
 *   [data-reveal-batch]    children rise one by one as each scrolls into view (tall items)
 *   [data-magnetic]        pulls toward the cursor (fine pointers only)
 *   .spotlight-card        cursor-following light (see global.css); runs even
 *                          under reduced motion, since nothing moves
 *
 * Tone follows cntxt/design.md: micro-interactions, fade + translateY
 * reveals, nothing that competes with the content.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

const root = document.documentElement;
export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * False once the pre-paint class is gone — either never set (reduced motion)
 * or dropped by its safety timeout because this bundle arrived late. An
 * intro animated after that point would make visible content flash.
 */
export const introPending = () => root.classList.contains("motion-intro");
/** Call once every intro element holds its hidden state inline. */
export const releaseIntro = () => root.classList.remove("motion-intro");

/** Split into masked lines, rise them in, then restore the original markup. */
export function riseLines(el: HTMLElement, vars: gsap.TweenVars = {}) {
    const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line" });
    gsap.set(el, { autoAlpha: 1 });
    // Reverting afterwards matters: frozen line breaks would clip the text
    // inside its masks as soon as the viewport is resized.
    const tween = gsap.from(split.lines, {
        yPercent: 110,
        duration: 1.15,
        stagger: 0.09,
        ease: "expo.out",
        ...vars,
    });
    return { split, tween };
}

/**
 * The shared load intro. `extra` adds page-specific steps to the same
 * timeline before the pre-paint hide is released, so they can claim their
 * own hidden states first.
 */
export function playIntro(extra?: (tl: gsap.core.Timeline) => void) {
    if (!introPending()) return releaseIntro();

    const tl = gsap.timeline({ delay: 0.1 });
    const title = document.querySelector<HTMLElement>("[data-page-title]");
    if (title) {
        const { split, tween } = riseLines(title);
        tl.add(tween, 0);
        tl.eventCallback("onComplete", () => split.revert());
    }
    document.querySelectorAll<HTMLElement>("[data-intro-backdrop]").forEach((el) => {
        tl.from(el, { autoAlpha: 0, duration: 2.4, ease: "power2.out" }, 0);
    });
    const fades = document.querySelectorAll<HTMLElement>("[data-intro-fade]");
    if (fades.length) {
        tl.from(fades, { autoAlpha: 0, y: 24, duration: 1, stagger: 0.1, ease: "power3.out" }, 0.3);
    }
    document.querySelectorAll<HTMLElement>("[data-intro-stagger]").forEach((group) => {
        tl.from(
            group.children,
            {
                autoAlpha: 0,
                y: 24,
                duration: 0.9,
                stagger: 0.08,
                ease: "power3.out",
                // Hand the children back to CSS so their hover transitions work.
                clearProps: "transform,opacity,visibility",
            },
            0.4,
        );
    });
    const visual = document.querySelector<HTMLElement>("[data-intro-visual]");
    if (visual) tl.from(visual, { autoAlpha: 0, y: 32, duration: 1.4, ease: "power3.out" }, 0.35);

    extra?.(tl);
    releaseIntro();
}

/**
 * Wires the shared hooks. Returns whether motion is allowed, so the caller
 * knows whether to set up its own animations.
 */
export function initPageMotion(): boolean {
    initSpotlights();
    if (reducedMotion) {
        releaseIntro();
        return false;
    }
    initReveals();
    initMagnetic();
    return true;
}

function initSpotlights() {
    document.querySelectorAll<HTMLElement>(".spotlight-card").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
            card.style.setProperty("--my", `${e.clientY - rect.top}px`);
        });
    });
}

function initReveals() {
    document.querySelectorAll<HTMLElement>("[data-reveal-lines]").forEach((el) => {
        gsap.set(el, { autoAlpha: 0 });
        // Split on entry, not up front — a split made at load would be stale
        // (and clip) if the viewport changed before the reader got here.
        ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () => {
                const { split } = riseLines(el, { onComplete: () => split.revert() });
            },
        });
    });

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
            autoAlpha: 0,
            y: 28,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
    });

    document.querySelectorAll<HTMLElement>("[data-reveal-batch]").forEach((el) => {
        const items = Array.from(el.children) as HTMLElement[];
        gsap.set(items, { autoAlpha: 0, y: 48 });
        ScrollTrigger.batch(items, {
            start: "top 90%",
            once: true,
            onEnter: (batch) =>
                gsap.to(batch, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1,
                    stagger: 0.12,
                    ease: "power3.out",
                    clearProps: "transform,opacity,visibility",
                }),
        });
    });

    document.querySelectorAll<HTMLElement>("[data-reveal-stagger]").forEach((el) => {
        gsap.from(el.children, {
            autoAlpha: 0,
            y: 36,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            // Hand the children back to CSS so their hover transitions work.
            clearProps: "transform,opacity,visibility",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
    });
}

function initMagnetic() {
    if (!finePointer) return;
    const clamp = gsap.utils.clamp(-10, 10);
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
        el.addEventListener("pointermove", (e) => {
            const rect = el.getBoundingClientRect();
            xTo(clamp((e.clientX - rect.left - rect.width / 2) * 0.3));
            yTo(clamp((e.clientY - rect.top - rect.height / 2) * 0.3));
        });
        el.addEventListener("pointerenter", () => gsap.to(el, { scale: 1.03, duration: 0.3, ease: "power2.out" }));
        el.addEventListener("pointerleave", () => {
            xTo(0);
            yTo(0);
            gsap.to(el, { scale: 1, duration: 0.4, ease: "power2.out" });
        });
    });
}
