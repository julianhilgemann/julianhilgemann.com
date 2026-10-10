/**
 * The Story page's field, one state per chapter (StoryField.astro).
 *
 * Two phases, because a chapter now fills the viewport and arrives as a card:
 *
 *   fieldEnter(fig, tl, at)  tweens added to the chapter's own timeline, so
 *                            the field starts while the card is still sliding
 *                            in and has finished by the time it settles.
 *                            Nothing is scrubbed: the reader should not have
 *                            to keep scrolling to see a chapter complete.
 *   fieldIdle(fig)           what keeps moving afterwards. Small, slow, and
 *                            never finished — the page stays alive without
 *                            asking for attention. Paused while off-screen.
 *
 * Each figure ships its END state in markup, so these only ever supply the
 * starting state; under reduced motion neither phase runs and the markup is
 * what you see.
 *
 * Hooks, all inside [data-field="<state>"]:
 *   signal       [data-f=noise] [data-f=band]
 *   belief       [data-f=blur] [data-f=ray] [data-f=lens] [data-f=sharp]
 *                [data-f=prior] [data-f=posterior]
 *   measurement  [data-f=haze] [data-f=sweep] [data-f=sample]
 *   structure    [data-f=edge] [data-f=node][data-layer] [data-f=layer-tag]
 *   inference    [data-f=history-line] [data-f=history] [data-f=last]
 *                [data-f=fan] [data-f=trend]
 *   expansion    [data-f=core] [data-f=rays] [data-f=motes]
 *   coda         [data-f=cloud] [data-f=orbit]
 */
import { gsap, ScrollTrigger } from "./motion";

const EASE = "power2.out";

const all = <T extends Element>(fig: Element, sel: string) => gsap.utils.toArray<T>(sel, fig);
const first = <T extends Element>(fig: Element, sel: string) => fig.querySelector<T>(sel);

/**
 * Draw a solid path or line on from nothing. Dashed strokes are left alone —
 * a dash array set here would fight the one in the markup.
 */
function drawOn(tl: gsap.core.Timeline, el: SVGGeometryElement, at: number, duration: number) {
    if (typeof el.getTotalLength !== "function") return;
    const len = el.getTotalLength();
    if (!len) return;
    tl.fromTo(
        el,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration, ease: "none" },
        at,
    );
}

/** Keep an endless animation off the compositor while nobody can see it. */
function whileVisible(fig: Element, make: () => gsap.core.Animation | gsap.core.Animation[]) {
    const made = make();
    const anims = Array.isArray(made) ? made : [made];
    ScrollTrigger.create({
        trigger: fig,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => anims.forEach((a) => (self.isActive ? a.play() : a.pause())),
    });
}

/** A loop that fires every `min`–`max` seconds for as long as the figure lives. */
function everyFewSeconds(fn: () => void, min: number, max: number) {
    const tick = () => {
        fn();
        call = gsap.delayedCall(gsap.utils.random(min, max), tick);
    };
    let call = gsap.delayedCall(gsap.utils.random(min, max), tick);
    return call;
}

// ─────────────────────────────────────────────────────────── entrance ──

export function fieldEnter(fig: HTMLElement, tl: gsap.core.Timeline, at: number) {
    switch (fig.dataset.field) {
        // Dense noise, arriving as a drift rather than a fade.
        case "signal": {
            all<SVGPathElement>(fig, '[data-f="band"]').forEach((band, i) => {
                tl.from(band, { x: -34 - i * 16, autoAlpha: 0, duration: 1, ease: EASE }, at);
            });
            tl.from(first(fig, '[data-f="noise"]'), { autoAlpha: 0.2, duration: 0.9, ease: EASE }, at);
            break;
        }

        // Evidence arrives: the rays find the lens, the object resolves on the
        // far side, and the curve narrows from the prior onto the posterior.
        case "belief": {
            const lens = first<SVGPathElement>(fig, '[data-f="lens"]');
            if (lens) drawOn(tl, lens, at, 0.5);
            all<SVGLineElement>(fig, '[data-f="ray"]').forEach((ray, i) =>
                drawOn(tl, ray, at + 0.1 + i * 0.05, 0.3),
            );
            tl.from(
                first(fig, '[data-f="sharp"]'),
                { autoAlpha: 0.08, scale: 0.4, svgOrigin: "392 112", duration: 0.55, ease: "back.out(1.6)" },
                at + 0.35,
            );
            tl.from(first(fig, '[data-f="prior"]'), { opacity: 0.5, duration: 0.7 }, at);
            tl.from(
                first(fig, '[data-f="posterior"]'),
                // Three times as wide is roughly the prior's spread, so the
                // posterior starts life on top of it and contracts onto its
                // own peak. svgOrigin is the mean, on the baseline.
                { scaleX: 3.2, opacity: 0.25, svgOrigin: "240 266", duration: 0.85, ease: "power2.inOut" },
                at + 0.05,
            );
            break;
        }

        // The grid sweeps across and the samples light as it reaches them.
        case "measurement": {
            const sweep = first<SVGLineElement>(fig, '[data-f="sweep"]');
            const samples = all<SVGCircleElement>(fig, '[data-f="sample"]').sort(
                (a, b) => Number(a.getAttribute("cx")) - Number(b.getAttribute("cx")),
            );
            if (sweep) {
                tl.from(sweep, { x: -Number(sweep.getAttribute("x1")) + 18, duration: 0.95, ease: "power1.inOut" }, at);
            }
            tl.from(
                samples,
                {
                    opacity: 0,
                    scale: 0.4,
                    transformOrigin: "center",
                    duration: 0.3,
                    ease: EASE,
                    stagger: 0.7 / Math.max(samples.length, 1),
                },
                at,
            );
            break;
        }

        // Points link up and settle into layers, raw at the bottom.
        case "structure": {
            const nodes = all<SVGGElement>(fig, '[data-f="node"]').sort(
                (a, b) => Number(a.dataset.layer) - Number(b.dataset.layer),
            );
            tl.from(
                nodes,
                {
                    autoAlpha: 0,
                    scale: 0.3,
                    transformOrigin: "center",
                    duration: 0.4,
                    ease: "back.out(1.4)",
                    stagger: 0.45 / Math.max(nodes.length, 1),
                },
                at,
            );
            all<SVGLineElement>(fig, '[data-f="edge"]').forEach((edge, i) =>
                drawOn(tl, edge, at + 0.2 + i * 0.012, 0.5),
            );
            tl.from(
                all(fig, '[data-f="layer-tag"]'),
                { autoAlpha: 0, x: -8, duration: 0.35, stagger: 0.1, ease: EASE },
                at + 0.6,
            );
            break;
        }

        // The line runs past its last point and the fan opens with it.
        case "inference": {
            const line = first<SVGPathElement>(fig, '[data-f="history-line"]');
            const lastDot = first<SVGCircleElement>(fig, '[data-f="last"]');
            // viewBox coordinates: the fan and the trend both hinge on the last
            // point, which is nowhere near either bounding box's centre.
            const origin = lastDot
                ? `${lastDot.getAttribute("cx")} ${lastDot.getAttribute("cy")}`
                : "240 150";
            if (line) drawOn(tl, line, at, 0.55);
            tl.from(
                all(fig, '[data-f="history"] circle'),
                { autoAlpha: 0, duration: 0.2, stagger: 0.025 },
                at,
            );
            tl.from(first(fig, '[data-f="trend"]'), { scaleX: 0, svgOrigin: origin, duration: 0.5, ease: EASE }, at + 0.45);
            tl.from(
                first(fig, '[data-f="fan"]'),
                { scaleY: 0.04, scaleX: 0, autoAlpha: 0.2, svgOrigin: origin, duration: 0.55, ease: EASE },
                at + 0.5,
            );
            break;
        }

        // The number bursts, and both accents arrive at once.
        case "expansion": {
            const origin = "240 150";
            tl.from(first(fig, '[data-f="rays"]'), { scale: 0.2, autoAlpha: 0, svgOrigin: origin, duration: 0.8, ease: EASE }, at);
            tl.from(first(fig, '[data-f="motes"]'), { scale: 0.45, autoAlpha: 0, svgOrigin: origin, duration: 1, ease: EASE }, at + 0.05);
            tl.from(first(fig, '[data-f="core"]'), { scale: 0.85, svgOrigin: origin, duration: 0.5, ease: "back.out(1.5)" }, at);
            break;
        }

        case "coda": {
            tl.from(first(fig, '[data-f="cloud"]'), { autoAlpha: 0, rotate: -10, svgOrigin: "240 150", duration: 1.1, ease: EASE }, at);
            tl.from(all(fig, '[data-f="orbit"]'), { autoAlpha: 0, scale: 0.85, svgOrigin: "240 150", duration: 0.9, stagger: 0.12, ease: EASE }, at);
            break;
        }
    }
}

// ─────────────────────────────────────────────────────────────── idle ──

export function fieldIdle(fig: HTMLElement) {
    switch (fig.dataset.field) {
        // The signal never stops arriving.
        case "signal":
            whileVisible(fig, () =>
                all<SVGPathElement>(fig, '[data-f="band"]').map((band, i) =>
                    gsap.to(band, {
                        x: `+=${10 + i * 6}`,
                        duration: 7 + i * 2.5,
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: -1,
                    }),
                ),
            );
            break;

        // The guess is never finished either: the rays keep flickering and the
        // belief breathes around its own edge.
        case "belief":
            whileVisible(fig, () => [
                ...all<SVGLineElement>(fig, '[data-f="ray"]').map((ray) =>
                    gsap.to(ray, {
                        opacity: 0.08,
                        duration: gsap.utils.random(1.4, 2.8),
                        delay: gsap.utils.random(0, 1.6),
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: -1,
                    }),
                ),
                gsap.to(first(fig, '[data-f="sharp"]'), {
                    scale: 1.035,
                    svgOrigin: "392 112",
                    duration: 2.6,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                }),
                gsap.to(first(fig, '[data-f="blur"]'), {
                    rotate: 4,
                    svgOrigin: "96 112",
                    duration: 12,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                }),
            ]);
            break;

        // The one the chapter is about: what gets sampled keeps changing. A
        // point goes out, another comes in, and the grid stays put — the same
        // idea as the choices layer under the number.
        case "measurement": {
            const samples = all<SVGCircleElement>(fig, '[data-f="sample"]');
            const lit = (el: SVGCircleElement) => Number(gsap.getProperty(el, "opacity")) > 0.05;
            whileVisible(fig, () =>
                everyFewSeconds(
                    () => {
                        const on = samples.filter(lit);
                        const off = samples.filter((el) => !lit(el));
                        const drop = gsap.utils.random(on);
                        const take = gsap.utils.random(off);
                        if (drop) gsap.to(drop, { opacity: 0, duration: 0.7, ease: "power1.in" });
                        if (take) gsap.to(take, { opacity: gsap.utils.random(0.35, 0.8), duration: 0.7 });
                    },
                    1.1,
                    2.4,
                ),
            );
            break;
        }

        // A pulse travels the lineage: something is always running.
        case "structure": {
            const edges = all<SVGLineElement>(fig, '[data-f="edge"]');
            whileVisible(fig, () =>
                everyFewSeconds(
                    () => {
                        const edge = gsap.utils.random(edges);
                        if (!edge) return;
                        const base = edge.getAttribute("opacity") ?? "0.2";
                        gsap.fromTo(
                            edge,
                            { opacity: Number(base) },
                            { opacity: 0.9, duration: 0.45, yoyo: true, repeat: 1, ease: "sine.inOut" },
                        );
                    },
                    0.7,
                    1.6,
                ),
            );
            break;
        }

        // The forecast keeps running: the dashes march out along the trend and
        // the fan breathes, because the uncertainty is not resolved.
        case "inference":
            whileVisible(fig, () => [
                gsap.to(first(fig, '[data-f="trend"] path'), {
                    strokeDashoffset: -44,
                    duration: 2.4,
                    ease: "none",
                    repeat: -1,
                }),
                gsap.to(first(fig, '[data-f="fan"]'), {
                    scaleY: 1.045,
                    svgOrigin: `${first<SVGCircleElement>(fig, '[data-f="last"]')?.getAttribute("cx") ?? 240} ${
                        first<SVGCircleElement>(fig, '[data-f="last"]')?.getAttribute("cy") ?? 150
                    }`,
                    duration: 3.4,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                }),
            ]);
            break;

        // It is still ringing.
        case "expansion": {
            const rays = all<SVGLineElement>(fig, '[data-f="ray-line"]');
            whileVisible(fig, () => [
                gsap.to(first(fig, '[data-f="motes"]'), {
                    rotate: 6,
                    svgOrigin: "240 150",
                    duration: 18,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                }),
                gsap.to(first(fig, '[data-f="core"]'), {
                    scale: 1.025,
                    svgOrigin: "240 150",
                    duration: 2.2,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                }),
                ...rays.slice(0, 10).map((ray) =>
                    gsap.to(ray, {
                        opacity: 0.12,
                        duration: gsap.utils.random(1.2, 2.6),
                        delay: gsap.utils.random(0, 2),
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: -1,
                    }),
                ),
            ]);
            break;
        }

        // The slow, quiet loop the whole page settles into.
        case "coda":
            whileVisible(fig, () => [
                gsap.to(first(fig, '[data-f="cloud"]'), {
                    rotate: 360,
                    svgOrigin: "240 150",
                    duration: 180,
                    ease: "none",
                    repeat: -1,
                }),
                ...all<SVGEllipseElement>(fig, '[data-f="orbit"]').map((orbit, i) =>
                    gsap.to(orbit, {
                        rotate: i ? -6 : 6,
                        svgOrigin: "240 150",
                        duration: 14 + i * 5,
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: -1,
                    }),
                ),
            ]);
            break;
    }
}
