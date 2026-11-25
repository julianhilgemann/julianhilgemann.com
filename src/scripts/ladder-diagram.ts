/**
 * Motion for LadderDiagram.astro (homepage "Now building").
 *
 * On scroll-in the axis, the six deposits, the planned balance and the flag
 * build in. After that the plan plays through: a marker travels the months,
 * the bars fill as far as it has come and the balance behind it turns solid.
 * Where a deposit starts, a blue packet leaves the account for it; where one
 * ends, the marker waits while an amber packet falls back, and the balance
 * jumps. On the last covered month the flag answers, the figure rests, and
 * the plan starts over. Everything pauses while the figure is off screen.
 *
 * One number drives a frame: how far along the balance curve the marker is
 * (`state.L`, in path length). `render()` derives the rest from it, so the
 * curve, the dot, the marker, its month and every bar can never disagree.
 * The geometry comes from the component (`data-plan` on each svg); nothing
 * about the plan is repeated here.
 *
 * Only the layout that is actually displayed (wide ≥ lg, narrow below) is
 * animated; crossing the breakpoint tears one down and starts the other.
 * Callers skip this entirely under reduced motion: the markup is the
 * finished, static figure.
 */
import { gsap, ScrollTrigger, finePointer } from "./motion";
import { color, rgba } from "../styles/tokens.mjs";

// Token colours; the resting values match LadderDiagram.astro's styles.
const AMBER = color.primary.DEFAULT;
const BLUE = color.info.DEFAULT;
const TRACK_STROKE = rgba(color.contrast, 0.16);
const FILL = rgba(BLUE, 0.15);
const FILL_STROKE = rgba(BLUE, 0.6);
const TIE_STROKE = rgba(BLUE, 0.32);

/** Seconds: the marker crossing one month, a payout falling, the balance jumping, the rest at the end. */
const MONTH = 0.3;
const DROP = 0.42;
const RISE = 0.36;
const HOLD = 2.8;

interface Plan {
    x0: number;
    mw: number;
    months: string[];
    /** x, y, and the bar whose payout the segment ending here draws (-1: an ordinary month). */
    pts: [number, number, number][];
    bars: { x: number; w: number; cy: number; bottom: number; start: number }[];
    pill: [number, number];
}
type Point = { x: number; y: number };

export function initLadderDiagram() {
    const root = document.querySelector<HTMLElement>("[data-ladder]");
    if (!root) return;
    gsap.matchMedia().add({ wide: "(min-width: 1024px)", narrow: "(max-width: 1023.98px)" }, (context) => {
        const wide = Boolean(context.conditions?.wide);
        const svg = root.querySelector<SVGSVGElement>(`[data-layout="${wide ? "wide" : "narrow"}"]`);
        if (!svg) return;
        return run(svg);
    });
}

function run(svg: SVGSVGElement) {
    const all = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel));
    const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)!;

    const plan = JSON.parse(svg.dataset.plan!) as Plan;
    const { pts, months, x0, mw } = plan;
    const bars = all<SVGGElement>("[data-bar]").map((el, i) => ({
        el,
        track: el.querySelector<SVGRectElement>("[data-bar-track]")!,
        fill: el.querySelector<SVGRectElement>("[data-bar-fill]")!,
        ...plan.bars[i],
    }));
    const ties = all<SVGLineElement>("[data-tie]");
    const base = one<SVGPathElement>("[data-liq-base]");
    const line = one<SVGPathElement>("[data-liq-line]");
    const clip = one<SVGRectElement>("[data-liq-clip]");
    const elapsed = one<SVGGElement>("[data-elapsed]");
    const playhead = one<SVGGElement>("[data-playhead]");
    const pill = one<SVGGElement>("[data-pill]");
    const pillText = one<SVGTextElement>("[data-pill-text]");
    const dot = one<SVGGElement>("[data-dot]");
    const dotGlow = one<SVGCircleElement>("[data-dot-glow]");
    const ring = one<SVGCircleElement>("[data-ring]");
    const flag = one<SVGGElement>("[data-flag]");
    const flagLine = one<SVGLineElement>("[data-flag-line]");
    const flagRing = one<SVGCircleElement>("[data-flag-ring]");
    const packets = all<SVGGElement>("[data-packet]");

    // Length of the balance curve up to each of its points.
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    const total = cum[cum.length - 1];
    const fullClip = clip.getAttribute("width")!;
    const clamp = gsap.utils.clamp;

    // ── one frame ──
    const state = { L: 0 };
    let month = -1;
    function render() {
        const L = state.L;
        let i = 1;
        while (i < pts.length - 1 && cum[i] < L) i++;
        const f = clamp(0, 1, (L - cum[i - 1]) / (cum[i] - cum[i - 1] || 1));
        const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f;
        const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;

        line.style.strokeDashoffset = String(total - L);
        clip.setAttribute("width", String(Math.max(0, x - x0)));
        dot.setAttribute("transform", `translate(${x} ${y})`);
        playhead.setAttribute("transform", `translate(${x} 0)`);
        // The month label stays inside the drawing at either end.
        pill.setAttribute("transform", `translate(${clamp(plan.pill[0], plan.pill[1], x) - x} 0)`);
        const m = clamp(0, months.length - 1, Math.round((x - x0) / mw));
        if (m !== month) {
            month = m;
            pillText.textContent = months[m];
        }
        for (const b of bars) b.fill.setAttribute("width", String(clamp(0, b.w, x - b.x)));
    }

    // The starting state: nothing lived yet. (The markup is the finished plan.)
    line.style.strokeDasharray = String(total);
    render();

    let visible = false;
    let started = false;
    const sync = () => (visible && started ? loop.play() : loop.pause());

    // ── build-in ──
    const build = gsap.timeline({
        paused: true,
        onComplete: () => {
            started = true;
            sync();
        },
    });
    build
        .from([one("[data-titles]"), one("[data-axis]"), one("[data-zone]")], { autoAlpha: 0, duration: 0.6, ease: "power2.out" })
        // Bottom row first: the shortest deposit is the first rung.
        .from(bars.map((b) => b.el).reverse(), { autoAlpha: 0, x: -16, duration: 0.6, stagger: 0.09, ease: "power3.out" }, 0.15)
        .fromTo(base, { strokeDasharray: total, strokeDashoffset: total }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 0.3)
        .from(ties, { autoAlpha: 0, duration: 0.4, stagger: 0.07 }, 0.8)
        .from(flag, { autoAlpha: 0, y: 10, duration: 0.6, ease: "power3.out" }, 1.1);
    ScrollTrigger.create({ trigger: svg, start: "top 80%", once: true, onEnter: () => build.play() });

    // ── the plan, played through ──
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    let used = 0;
    /** Send a packet from one point to another, starting at `at` on the loop. */
    const fly = (from: Point, to: Point, duration: number, ease: string, hue: string, at: number) => {
        const packet = packets[used++ % packets.length];
        loop.set(packet.querySelectorAll("circle"), { fill: hue }, at)
            .set(packet, { x: from.x, y: from.y }, at)
            .to(packet, { opacity: 1, duration: 0.12 }, at)
            .to(packet, { x: to.x, y: to.y, duration, ease }, at)
            .to(packet, { opacity: 0, duration: 0.14 }, at + duration - 0.04);
    };
    /** Snap a colour property to `hot`, then ease it back to `rest`. */
    const flash = (el: Element, vars: gsap.TweenVars, rest: gsap.TweenVars, duration: number, at: number) =>
        loop.fromTo(el, vars, { ...rest, duration, ease: "power2.out", immediateRender: false }, at);
    const pulse = (el: Element, to: number, duration: number, at: number) =>
        loop.fromTo(el, { attr: { r: 5 }, opacity: 0.85 }, { attr: { r: to }, opacity: 0, duration, ease: "power2.out", immediateRender: false }, at);
    const point = (i: number): Point => ({ x: pts[i][0], y: pts[i][1] });
    const arrive = (b: (typeof bars)[number], at: number) => flash(b.track, { stroke: BLUE }, { stroke: TRACK_STROKE }, 1, at);

    let T = 0;
    loop.to([dot, playhead], { opacity: 1, duration: 0.4, ease: "power2.out" }, T);
    T += 0.35;
    // The deposits that open the plan are placed before the first month ends.
    bars.filter((b) => b.start === 0).forEach((b, n) => {
        fly(point(0), { x: b.x, y: b.cy }, 0.5, "power2.out", BLUE, T + n * 0.1);
        arrive(b, T + n * 0.1 + 0.5);
    });
    T += 0.9;

    for (let i = 1; i < pts.length; i++) {
        const paying = pts[i][2];
        if (paying >= 0) {
            // A deposit comes back: the marker waits, the payout falls from the
            // bar's end to the account, and the balance jumps.
            const b = bars[paying];
            flash(b.fill, { stroke: AMBER, fill: rgba(AMBER, 0.2) }, { stroke: FILL_STROKE, fill: FILL }, 1.3, T);
            flash(ties[paying], { stroke: AMBER }, { stroke: TIE_STROKE }, 1.3, T);
            fly({ x: pts[i][0], y: b.bottom }, point(i - 1), DROP, "power2.in", AMBER, T);
            T += DROP;
            loop.to(state, { L: cum[i], duration: RISE, ease: "power3.out", onUpdate: render }, T);
            loop.fromTo(
                dotGlow,
                { attr: { r: 17 }, opacity: 0.5 },
                { attr: { r: 9 }, opacity: 0.25, duration: 0.9, ease: "power2.out", immediateRender: false },
                T,
            );
            loop.set(ring, { x: pts[i][0], y: pts[i][1] }, T + RISE * 0.5);
            pulse(ring, 22, 0.8, T + RISE * 0.5);
            T += RISE + 0.06;
        } else {
            // An ordinary month. If deposits start at its end, the money for
            // them leaves the account now and reaches them as the marker does.
            const position = Math.round((pts[i][0] - x0) / mw);
            bars.filter((b) => b.start === position).forEach((b, n) => {
                fly(point(i - 1), { x: b.x, y: b.cy }, MONTH, "power1.inOut", BLUE, T + n * 0.05);
                arrive(b, T + n * 0.05 + MONTH);
            });
            loop.to(state, { L: cum[i], duration: MONTH, ease: "none", onUpdate: render }, T);
            T += MONTH;
        }
    }

    // The last covered month: the flag answers, twice.
    flash(flagLine, { strokeWidth: 3.5 }, { strokeWidth: 1.5 }, 1.4, T);
    pulse(flagRing, 26, 1.1, T);
    loop.set(ring, { x: pts[pts.length - 1][0], y: pts[pts.length - 1][1] }, T + 0.5);
    pulse(ring, 26, 1.1, T + 0.5);
    T += HOLD;

    // Clear the stage. Once nothing shows, the frame is put back to the
    // start: the loop's rewind restores every opacity at once, and the curve
    // must already be undrawn by then.
    loop.to([elapsed, dot, playhead, ...bars.map((b) => b.fill)], { opacity: 0, duration: 0.6, ease: "power1.in" }, T);
    T += 0.65;
    loop.call(
        () => {
            state.L = 0;
            render();
        },
        [],
        T,
    );
    loop.to({}, { duration: 0.3 }, T);

    ScrollTrigger.create({
        trigger: svg,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
            visible = self.isActive;
            sync();
        },
    });

    // ── hover: focus one deposit, the others step back ──
    if (finePointer) {
        bars.forEach((b, i) => {
            b.el.addEventListener("pointerenter", () =>
                gsap.to([...bars.filter((o) => o !== b).map((o) => o.el), ...ties.filter((_, n) => n !== i)], {
                    opacity: 0.35,
                    duration: 0.3,
                }),
            );
            b.el.addEventListener("pointerleave", () => gsap.to([...bars.map((o) => o.el), ...ties], { opacity: 1, duration: 0.3 }));
        });
    }

    // Leaving this layout: hand the markup back as the finished plan.
    return () => {
        loop.kill();
        build.kill();
        line.style.strokeDasharray = "";
        line.style.strokeDashoffset = "";
        clip.setAttribute("width", fullClip);
        for (const b of bars) b.fill.setAttribute("width", String(b.w));
        dot.removeAttribute("transform");
        playhead.removeAttribute("transform");
        pill.removeAttribute("transform");
        pillText.textContent = months[0];
    };
}
