/**
 * About page motion (EN + DE). Shared hooks (reveals, magnetic CTA,
 * spotlight cards) come from motion.ts; this file owns the page's pieces.
 *
 * Hooks:
 *   (load intro: [data-page-title], [data-intro-fade], [data-intro-visual] via playIntro)
 *   [data-anatomy]         layer stack (NumberAnatomy.astro) that opens on scroll
 *   [data-quote]           words brighten as the reader passes
 *   [data-timeline]        rail fills and dots light as entries are reached
 *   [data-count]           figures count up once (data-prefix is kept)
 */
import {
    gsap,
    ScrollTrigger,
    SplitText,
    finePointer,
    playIntro,
    initPageMotion,
} from "./motion";

if (initPageMotion()) {
    playIntro();
    anatomy();
    quote();
    timeline();
    counters();
}

function anatomy() {
    const fig = document.querySelector<SVGSVGElement>("[data-anatomy]");
    if (!fig) return;
    const layers = gsap.utils.toArray<SVGGElement>("[data-layer]", fig);
    const labels = gsap.utils.toArray<SVGGElement>("[data-layer-label], [data-anatomy-guide]", fig);

    // Collapsed, the stack reads as a single number; opening it is the
    // paragraph's point made visible. On desktop the whole intro is on screen
    // at load, so the stack opens over the first stretch of scrolling while
    // the figure is still in full view; on mobile it opens as it scrolls in.
    gsap.matchMedia().add(
        { wide: "(min-width: 1024px)", narrow: "(max-width: 1023.98px)" },
        (context) => {
            const wide = Boolean(context.conditions?.wide);
            const tl = gsap.timeline({
                defaults: { ease: "power2.inOut" },
                scrollTrigger: wide
                    ? { start: 0, end: "+=280", scrub: 0.6 }
                    : { trigger: fig, start: "top 85%", end: "center 45%", scrub: 0.6 },
            });
            layers.forEach((layer) =>
                tl.fromTo(
                    layer,
                    { y: Number(layer.dataset.collapsed) },
                    { y: Number(layer.dataset.exploded), duration: 1 },
                    0,
                ),
            );
            tl.fromTo(labels, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.08 }, 0.6);
        },
    );

    // Choices layer: now and then one kept dot is dropped and another picked
    // up — the selection is never finished. Only while the figure is visible.
    const dots = gsap.utils.toArray<SVGCircleElement>("[data-dot]", fig);
    let visible = false;
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

function quote() {
    const el = document.querySelector<HTMLElement>("[data-quote]");
    if (!el) return;
    // Words (not lines) and no mask, so the split survives resizes as-is.
    const split = SplitText.create(el, { type: "words" });
    gsap.fromTo(
        split.words,
        { opacity: 0.2 },
        {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true },
        },
    );
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

function counters() {
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        const prefix = el.dataset.prefix ?? "";
        const state = { value: 0 };
        el.textContent = `${prefix}0`;
        gsap.to(state, {
            value: target,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: () => (el.textContent = `${prefix}${Math.round(state.value)}`),
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
    });
}
