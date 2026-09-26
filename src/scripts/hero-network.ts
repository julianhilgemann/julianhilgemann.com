/**
 * Hero background: a drifting node network the visitor can take part in.
 *
 * The pointer acts as one more node — points inside its radius lean toward it
 * and link to it in the accent colour — and a click or tap sends a pulse
 * through the field. The loop only runs while the hero is on screen and the
 * tab is visible; with reduced motion it paints a single static frame.
 */

interface Point {
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** Resting drift. Velocity relaxes back to this after any disturbance. */
    bvx: number;
    bvy: number;
    radius: number;
    /** 0..1 proximity to the pointer, eased so colour changes never pop. */
    glow: number;
}

interface Pulse {
    x: number;
    y: number;
    start: number;
}

const LINK_DIST = 180;
const POINTER_RADIUS = 220;
/** Inside this distance the pointer pushes instead of pulls, so points orbit rather than clump. */
const POINTER_CORE = 70;
const PULSE_DURATION = 1200;
const PULSE_REACH = 460;
const ACCENT = [245, 158, 11];

const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const tint = (t: number, alpha: number) =>
    `rgba(${mix(255, ACCENT[0], t)}, ${mix(255, ACCENT[1], t)}, ${mix(255, ACCENT[2], t)}, ${alpha})`;

export function initHeroNetwork(section: HTMLElement, canvas: HTMLCanvasElement, reducedMotion: boolean) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points: Point[] = [];
    const pulses: Pulse[] = [];
    const pointer = { x: 0, y: 0, active: false, strength: 0 };
    let width = 0;
    let height = 0;

    const targetCount = () => (window.innerWidth < 768 ? 60 : 130);

    function spawn(): Point {
        const vx = (Math.random() - 0.5) * 2;
        const vy = (Math.random() - 0.5) * 2;
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx,
            vy,
            bvx: vx,
            bvy: vy,
            radius: Math.random() * 4 + 1,
            glow: 0,
        };
    }

    function resize() {
        const w = section.offsetWidth;
        const h = section.offsetHeight;
        if (w === width && h === height) return;
        // Rescale rather than respawn, so a resize doesn't visibly reshuffle the field.
        if (width && height) {
            for (const p of points) {
                p.x *= w / width;
                p.y *= h / height;
            }
        }
        width = canvas.width = w;
        height = canvas.height = h;
        const n = targetCount();
        while (points.length < n) points.push(spawn());
        points.length = n;
        if (!running) draw(performance.now());
    }

    function step(dt: number, now: number) {
        pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * Math.min(1, 0.08 * dt);

        for (const p of points) {
            p.vx += (p.bvx - p.vx) * 0.02 * dt;
            p.vy += (p.bvy - p.vy) * 0.02 * dt;

            let near = 0;
            if (pointer.strength > 0.01) {
                const dx = pointer.x - p.x;
                const dy = pointer.y - p.y;
                const d = Math.hypot(dx, dy);
                if (d < POINTER_RADIUS && d > 0.5) {
                    near = (1 - d / POINTER_RADIUS) * pointer.strength;
                    const force = d < POINTER_CORE ? -0.1 : 0.03;
                    p.vx += (dx / d) * near * force * dt;
                    p.vy += (dy / d) * near * force * dt;
                }
            }
            p.glow += (near - p.glow) * Math.min(1, 0.15 * dt);

            for (const pulse of pulses) {
                const age = (now - pulse.start) / PULSE_DURATION;
                const front = (1 - Math.pow(1 - age, 3)) * PULSE_REACH;
                const dx = p.x - pulse.x;
                const dy = p.y - pulse.y;
                const d = Math.hypot(dx, dy);
                if (d > 0.5 && Math.abs(d - front) < 28) {
                    const kick = 0.35 * (1 - age) * dt;
                    p.vx += (dx / d) * kick;
                    p.vy += (dy / d) * kick;
                }
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Bounce the resting drift too, or relaxation steers it straight back out.
            if (p.x < 0 || p.x > width) {
                p.x = Math.max(0, Math.min(width, p.x));
                const dir = p.x <= 0 ? 1 : -1;
                p.vx = Math.abs(p.vx) * dir;
                p.bvx = Math.abs(p.bvx) * dir;
            }
            if (p.y < 0 || p.y > height) {
                p.y = Math.max(0, Math.min(height, p.y));
                const dir = p.y <= 0 ? 1 : -1;
                p.vy = Math.abs(p.vy) * dir;
                p.bvy = Math.abs(p.bvy) * dir;
            }
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
            if (now - pulses[i].start > PULSE_DURATION) pulses.splice(i, 1);
        }
    }

    function draw(now: number) {
        ctx!.clearRect(0, 0, width, height);

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            for (let j = i + 1; j < points.length; j++) {
                const p2 = points[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < LINK_DIST) {
                    const g = Math.max(p1.glow, p2.glow);
                    ctx!.strokeStyle = tint(g, (1 - d / LINK_DIST) * (0.5 + g * 0.35));
                    ctx!.lineWidth = 1;
                    ctx!.beginPath();
                    ctx!.moveTo(p1.x, p1.y);
                    ctx!.lineTo(p2.x, p2.y);
                    ctx!.stroke();
                }
            }
        }

        if (pointer.strength > 0.01) {
            for (const p of points) {
                const d = Math.hypot(pointer.x - p.x, pointer.y - p.y);
                if (d < POINTER_RADIUS) {
                    ctx!.strokeStyle = tint(1, (1 - d / POINTER_RADIUS) * 0.95 * pointer.strength);
                    ctx!.lineWidth = 1.5;
                    ctx!.beginPath();
                    ctx!.moveTo(pointer.x, pointer.y);
                    ctx!.lineTo(p.x, p.y);
                    ctx!.stroke();
                }
            }
            ctx!.fillStyle = tint(1, 0.9 * pointer.strength);
            ctx!.beginPath();
            ctx!.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.strokeStyle = tint(1, 0.35 * pointer.strength);
            ctx!.lineWidth = 1.5;
            ctx!.beginPath();
            ctx!.arc(pointer.x, pointer.y, 11, 0, Math.PI * 2);
            ctx!.stroke();
        }

        for (const p of points) {
            if (p.glow > 0.02) {
                ctx!.fillStyle = tint(1, p.glow * 0.55);
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx!.fill();
            }
            ctx!.strokeStyle = tint(p.glow, 0.4 + p.glow * 0.5);
            ctx!.lineWidth = 1.5;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx!.stroke();
        }

        for (const pulse of pulses) {
            const age = (now - pulse.start) / PULSE_DURATION;
            const r = (1 - Math.pow(1 - age, 3)) * PULSE_REACH;
            ctx!.strokeStyle = tint(1, 0.45 * (1 - age));
            ctx!.lineWidth = 1.5;
            ctx!.beginPath();
            ctx!.arc(pulse.x, pulse.y, r, 0, Math.PI * 2);
            ctx!.stroke();
        }
    }

    // ── loop control ──
    let running = false;
    let frame = 0;
    let last = 0;
    let onScreen = true;

    const loop = (now: number) => {
        // Normalise to 60fps steps so motion speed is the same on 120Hz screens.
        const dt = Math.min(3, (now - last) / 16.667);
        last = now;
        step(dt, now);
        draw(now);
        frame = requestAnimationFrame(loop);
    };

    function sync() {
        const shouldRun = !reducedMotion && onScreen && !document.hidden;
        if (shouldRun === running) return;
        running = shouldRun;
        if (running) {
            last = performance.now();
            frame = requestAnimationFrame(loop);
        } else {
            cancelAnimationFrame(frame);
        }
    }

    new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
    }).observe(section);
    document.addEventListener("visibilitychange", sync);
    new ResizeObserver(resize).observe(section);
    resize();
    sync();

    if (reducedMotion) return;

    // ── pointer ──
    const locate = (e: PointerEvent | MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    section.addEventListener("pointermove", (e) => {
        const { x, y } = locate(e);
        pointer.x = x;
        pointer.y = y;
        pointer.active = true;
    });
    const release = () => (pointer.active = false);
    section.addEventListener("pointerleave", release);
    section.addEventListener("pointercancel", release);
    section.addEventListener("pointerup", (e) => {
        if (e.pointerType !== "mouse") release();
    });

    // `click` rather than `pointerdown`: on touch it only fires for a tap, so
    // starting a scroll gesture over the hero doesn't set off a pulse.
    section.addEventListener("click", (e) => {
        if ((e.target as Element).closest("a, button")) return;
        const { x, y } = locate(e);
        pulses.push({ x, y, start: performance.now() });
        if (pulses.length > 4) pulses.shift();
    });
}
