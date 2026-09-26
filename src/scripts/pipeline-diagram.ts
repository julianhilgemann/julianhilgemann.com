/**
 * Motion for PipelineDiagram.astro (homepage "Current project").
 *
 * On scroll-in the stages, flows and orchestration rail build in; after that
 * data packets travel the pipeline and each arrival does something at its
 * stage — an API light blinks, the raw store's vintage counter ticks, the
 * gears speed up and a warehouse row lights, a dashboard bar and a data point
 * update. The orchestrator pulse runs along its rail, tapping each stage it
 * drives. Everything pauses while the diagram is off screen.
 *
 * Only the layout that is actually displayed (wide ≥ lg, tall below) is
 * animated; crossing the breakpoint tears one down and starts the other.
 * Callers skip this entirely under reduced motion — the markup is the
 * finished, static diagram.
 */
import { gsap, ScrollTrigger, finePointer } from "./motion";

const AMBER = "#F59E0B";
const BLUE = "#38BDF8";
const BOX_STROKE = "rgba(255, 255, 255, 0.12)";

export function initPipelineDiagram() {
    const root = document.querySelector<HTMLElement>("[data-pipeline]");
    if (!root) return;
    gsap.matchMedia().add(
        { wide: "(min-width: 1024px)", tall: "(max-width: 1023.98px)" },
        (context) => {
            const wide = Boolean(context.conditions?.wide);
            const svg = root.querySelector<SVGSVGElement>(`[data-layout="${wide ? "wide" : "tall"}"]`);
            if (!svg) return;
            const stop = run(svg, wide);
            return stop;
        },
    );
}

function run(svg: SVGSVGElement, wide: boolean) {
    const all = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel));
    const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel);

    const stages = all<SVGGElement>("[data-stage]");
    const inners = stages.map((s) => s.querySelector<SVGGElement>("[data-stage-inner]")!);
    const boxes = stages.map((s) => s.querySelector<SVGRectElement>("[data-stage-box]")!);
    const flows = all<SVGGElement>("[data-flow]").map((el) => {
        const [x1, y1] = el.dataset.from!.split(",").map(Number);
        const [x2, y2] = el.dataset.to!.split(",").map(Number);
        return { el, x1, y1, x2, y2 };
    });
    const rail = one<SVGLineElement>("[data-rail]")!;
    const ties = all<SVGLineElement>("[data-tie]");
    const pulse = one<SVGCircleElement>("[data-rail-pulse]")!;
    const packets = all<SVGGElement>("[data-packet]");
    const leds = all<SVGCircleElement>("[data-api-led]");
    const sheet = one<SVGRectElement>("[data-sheet-front]");
    const vintage = one<SVGTextElement>("[data-vintage]");
    const bigGear = one<SVGPathElement>('[data-gear="big"]');
    const smallGear = one<SVGPathElement>('[data-gear="small"]');
    const rows = all<SVGRectElement>("[data-db-row]");
    const liveBar = one<SVGRectElement>('[data-bar="live"]');
    const dots = all<SVGCircleElement>("[data-dot]");

    let dead = false;
    let visible = false;
    let started = false;

    // ── build-in ──
    const along = wide ? { scaleX: 0, transformOrigin: "0% 50%" } : { scaleY: 0, transformOrigin: "50% 0%" };
    const build = gsap.timeline({ paused: true, onComplete: () => (started = true) });
    build
        .from(inners, { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.18, ease: "power3.out" })
        .from(flows.map((f) => f.el), { autoAlpha: 0, ...along, duration: 0.5, stagger: 0.18, ease: "power2.out" }, 0.35)
        .from(rail, { ...along, duration: 0.9, ease: "power2.inOut" }, 0.2)
        .from(ties, { autoAlpha: 0, duration: 0.4, stagger: 0.12 }, 0.7);
    ScrollTrigger.create({ trigger: svg, start: "top 80%", once: true, onEnter: () => build.play() });

    // ── ambient loops ──
    const spinBig = bigGear
        ? gsap.to(bigGear, { rotation: 360, transformOrigin: "50% 50%", duration: 14, ease: "none", repeat: -1, paused: true })
        : null;
    // 10 : 7 teeth, turning the other way.
    const spinSmall = smallGear
        ? gsap.to(smallGear, { rotation: -360, transformOrigin: "50% 50%", duration: 9.8, ease: "none", repeat: -1, paused: true })
        : null;
    const spins = [spinBig, spinSmall].filter(Boolean) as gsap.core.Tween[];

    const railDx = Number(rail.getAttribute("x2")) - Number(rail.getAttribute("x1"));
    const railDy = Number(rail.getAttribute("y2")) - Number(rail.getAttribute("y1"));
    const RAIL_TIME = 2.6;
    const railLoop = gsap.timeline({ repeat: -1, repeatDelay: 1.4, paused: true });
    railLoop
        .set(pulse, { x: 0, y: 0, opacity: 1 })
        .to(pulse, { x: railDx, y: railDy, duration: RAIL_TIME, ease: "none" })
        .to(pulse, { opacity: 0, duration: 0.3 });
    // Ties sit at the start, middle and end of the rail.
    ties.forEach((tie, i) => {
        railLoop.call(() => flash(tie, "stroke", BLUE, "rgba(56, 189, 248, 0.3)", 0.9), [], (i / Math.max(1, ties.length - 1)) * RAIL_TIME);
    });

    const setAmbient = (on: boolean) => {
        spins.forEach((t) => (on ? t.play() : t.pause()));
        on ? railLoop.play() : railLoop.pause();
    };

    // ── data journeys ──
    let packetIndex = 0;
    let vintageNo = Number(vintage?.textContent?.replace(/\D/g, "")) || 1284;
    let rowIndex = 0;
    const legTime = wide ? 1 : 0.75;

    const flashBox = (i: number) => flash(boxes[i], "stroke", "rgba(245, 158, 11, 0.75)", BOX_STROKE, 1.1);

    function journey() {
        const packet = packets[packetIndex++ % packets.length];
        const cores = packet.querySelectorAll("circle");
        const tl = gsap.timeline();
        const leg = (f: (typeof flows)[number], color: string) => {
            tl.set(packet, { x: f.x1, y: f.y1 })
                .set(cores, { fill: color })
                .to(packet, { opacity: 1, duration: 0.15 })
                .to(packet, { x: f.x2, y: f.y2, duration: legTime, ease: "power1.inOut" }, "<")
                .to(packet, { opacity: 0, duration: 0.15 }, `>-0.1`);
        };

        tl.call(() => {
            flashBox(0);
            const led = gsap.utils.random(leds);
            if (led) flash(led, "fill", AMBER, "rgba(56, 189, 248, 0.55)", 0.8);
        });
        leg(flows[0], AMBER);
        tl.call(() => {
            flashBox(1);
            if (sheet) flash(sheet, "stroke", AMBER, "rgba(245, 158, 11, 0.55)", 0.9);
            if (vintage) vintage.textContent = `v${++vintageNo}`;
        });
        tl.to({}, { duration: 0.35 });
        leg(flows[1], AMBER);
        tl.call(() => {
            flashBox(2);
            spins.forEach((t) => gsap.fromTo(t, { timeScale: 4 }, { timeScale: 1, duration: 1.6, ease: "power2.out" }));
            const row = rows[rowIndex++ % rows.length];
            if (row) flash(row, "fill", "rgba(245, 158, 11, 0.7)", "rgba(255, 255, 255, 0.07)", 1);
        });
        tl.to({}, { duration: 0.45 });
        // Modelled data leaves the warehouse in the "system" colour.
        leg(flows[2], BLUE);
        tl.call(() => {
            flashBox(3);
            if (liveBar) {
                const h = gsap.utils.random(16, 46, 1);
                gsap.to(liveBar, { attr: { height: h, y: 78 - h }, duration: 0.6, ease: "power2.out" });
            }
            const dot = gsap.utils.random(dots);
            if (dot) {
                gsap.fromTo(
                    dot,
                    { fill: AMBER, attr: { r: 3.8 } },
                    { fill: "rgba(255, 255, 255, 0.55)", attr: { r: 2.2 }, duration: 1.2, ease: "power2.out" },
                );
            }
        });
    }

    const launch = () => {
        if (dead) return;
        if (visible && started) journey();
        gsap.delayedCall(1.6, launch);
    };
    launch();

    ScrollTrigger.create({
        trigger: svg,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
            visible = self.isActive;
            setAmbient(visible);
        },
    });

    // ── hover: focus one stage, the others step back ──
    if (finePointer) {
        stages.forEach((stage) => {
            stage.addEventListener("pointerenter", () =>
                gsap.to(
                    stages.filter((s) => s !== stage),
                    { opacity: 0.4, duration: 0.3 },
                ),
            );
            stage.addEventListener("pointerleave", () => gsap.to(stages, { opacity: 1, duration: 0.3 }));
        });
    }

    return () => {
        dead = true;
        setAmbient(false);
    };
}

/** Snap a colour property to `hot`, then ease it back to `rest`. */
function flash(el: Element, prop: "fill" | "stroke", hot: string, rest: string, duration: number) {
    gsap.fromTo(el, { [prop]: hot }, { [prop]: rest, duration, ease: "power2.out", overwrite: "auto" });
}
