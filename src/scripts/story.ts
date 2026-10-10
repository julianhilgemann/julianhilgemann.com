/**
 * Story page motion.
 *
 * Each chapter fills the viewport and arrives as a card. One timeline per
 * chapter drives the whole arrival: the card slides up, the text follows, and
 * the figure animates alongside it — starting while the card is still moving
 * and finishing as it settles. It runs `once`, on entry, so a chapter never
 * waits on further scrolling to complete.
 *
 * When that timeline finishes the figure starts its idle loop, so a finished
 * chapter still looks alive. The loop stops when the chapter leaves the
 * viewport. (The travelling light lives on the contact buttons now — see
 * `.orbit-ring` in global.css — not on the cards.)
 *
 * Hooks:
 *   (load intro: [data-page-title], [data-intro-fade] via playIntro)
 *   [data-chapter]         a full-height chapter section
 *   [data-card]            the card inside it that slides in
 *   [data-ch-marker]       the chapter number and name
 *   [data-ch-title]        headline, split into rising lines
 *   [data-ch-body]         paragraphs, staggered
 *   [data-ch-link]         the one quiet link
 *   [data-field]           the chapter's field state (story-field.ts)
 *   [data-anatomy]         chapter 6's layer stack (NumberAnatomy.astro)
 */
import { gsap, ScrollTrigger, finePointer, riseLines, playIntro, initPageMotion } from "./motion";
import { fieldEnter, fieldIdle } from "./story-field";

if (initPageMotion()) {
    playIntro();
    chapters();
}

function chapters() {
    document.querySelectorAll<HTMLElement>("[data-chapter]").forEach((section) => {
        const card = section.querySelector<HTMLElement>("[data-card]");
        const marker = section.querySelector<HTMLElement>("[data-ch-marker]");
        const title = section.querySelector<HTMLElement>("[data-ch-title]");
        const body = section.querySelector<HTMLElement>("[data-ch-body]");
        const link = section.querySelector<HTMLElement>("[data-ch-link]");
        const field = section.querySelector<HTMLElement>("[data-field]");
        const figure = section.querySelector<SVGSVGElement>("[data-anatomy]");

        // Once a chapter has arrived its figure keeps moving, so a finished
        // chapter still looks like something you can touch.
        const goLive = () => {
            if (field) fieldIdle(field);
            if (figure) anatomyIdle(figure);
        };

        // Built paused, so every `from` claims its hidden state now and no
        // chapter flashes before the reader gets to it.
        const tl = gsap.timeline({ paused: true, onComplete: goLive });

        // The card arrives first, and everything else rides in on top of it.
        if (card) tl.from(card, { y: 56, scale: 0.985, autoAlpha: 0, duration: 0.8, ease: "power3.out" }, 0);
        if (marker) tl.from(marker, { autoAlpha: 0, x: -14, duration: 0.5, ease: "power2.out" }, 0.12);
        if (title) gsap.set(title, { autoAlpha: 0 });
        if (body) {
            tl.from(body.children, { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 0.38);
        }
        if (link) tl.from(link, { autoAlpha: 0, y: 10, duration: 0.45, ease: "power2.out" }, 0.6);

        // The figure starts while the card is still sliding and is done just
        // after it settles.
        if (field) fieldEnter(field, tl, 0.22);
        if (figure) anatomyEnter(figure, tl, 0.22);

        let started = false;
        const play = () => {
            if (started) return;
            started = true;
            // Split at entry, not at load: a split made up front goes stale
            // (and clips inside its mask) if the viewport changed on the way
            // down. Reverted again once the lines have landed.
            if (title) {
                const { split, tween } = riseLines(title, { duration: 0.95, stagger: 0.07 });
                tl.add(tween, 0.18);
                tween.eventCallback("onComplete", () => split.revert());
            }
            tl.play();
        };

        ScrollTrigger.create({ trigger: section, start: "top 68%", once: true, onEnter: play });

        // A deep link (/story#structure) or a restored scroll position can
        // land past the trigger, which then never fires. Anything already at
        // or above the start line plays straight away.
        if (section.getBoundingClientRect().top < window.innerHeight * 0.68) play();
    });
}

/**
 * Chapter 6's stack: collapsed it reads as a single number, and opening it is
 * the paragraph's point made visible.
 */
function anatomyEnter(fig: SVGSVGElement, tl: gsap.core.Timeline, at: number) {
    const layers = gsap.utils.toArray<SVGGElement>("[data-layer]", fig);
    const labels = gsap.utils.toArray<SVGGElement>("[data-layer-label], [data-anatomy-guide]", fig);

    layers.forEach((layer, i) =>
        tl.fromTo(
            layer,
            { y: Number(layer.dataset.collapsed) },
            { y: Number(layer.dataset.exploded), duration: 0.9, ease: "power2.inOut" },
            at + i * 0.06,
        ),
    );
    tl.fromTo(
        labels,
        { autoAlpha: 0, x: -10 },
        { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" },
        at + 0.7,
    );

    if (!finePointer) return;

    // Hover a layer to lift it out of the stack; the others step back.
    layers.forEach((layer) => {
        const lift = layer.querySelector("[data-layer-lift]");
        layer.addEventListener("pointerenter", () => {
            layer.classList.add("is-focus");
            gsap.to(lift, { y: -10, duration: 0.35, ease: "power2.out" });
            gsap.to(
                layers.filter((l) => l !== layer),
                { opacity: 0.4, duration: 0.3 },
            );
        });
        layer.addEventListener("pointerleave", () => {
            layer.classList.remove("is-focus");
            gsap.to(lift, { y: 0, duration: 0.45, ease: "power2.out" });
            gsap.to(layers, { opacity: 1, duration: 0.3 });
        });
    });

    // The whole figure tilts a few degrees toward the cursor.
    const host = fig.parentElement ?? fig;
    gsap.set(fig, { transformPerspective: 1100 });
    const rotX = gsap.quickTo(fig, "rotationX", { duration: 0.9, ease: "power3.out" });
    const rotY = gsap.quickTo(fig, "rotationY", { duration: 0.9, ease: "power3.out" });
    host.addEventListener("pointermove", (e) => {
        const rect = host.getBoundingClientRect();
        rotY(((e.clientX - rect.left) / rect.width - 0.5) * 12);
        rotX(-((e.clientY - rect.top) / rect.height - 0.5) * 8);
    });
    host.addEventListener("pointerleave", () => {
        rotX(0);
        rotY(0);
    });
}

/**
 * The choices layer keeps choosing: a kept dot is dropped and another picked
 * up, because the selection behind a number is never finished. This is the
 * idle the chapter figures borrow.
 */
function anatomyIdle(fig: SVGSVGElement) {
    const dots = gsap.utils.toArray<SVGCircleElement>("[data-dot]", fig);
    if (!dots.length) return;

    let visible = true;
    ScrollTrigger.create({
        trigger: fig,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (visible = self.isActive),
    });

    const reshuffle = () => {
        if (visible) {
            const lit = dots.filter((d) => d.classList.contains("is-lit"));
            const dim = dots.filter((d) => !d.classList.contains("is-lit"));
            gsap.utils.random(lit)?.classList.remove("is-lit");
            gsap.utils.random(dim)?.classList.add("is-lit");
        }
        gsap.delayedCall(gsap.utils.random(1, 2), reshuffle);
    };
    reshuffle();
}
