/**
 * A backdrop of coloured silk, rather than a flat gradient: the homepage hero
 * and the contact screens, rendered through GradientSheet.astro.
 *
 * A finely divided plane, tilted away from the camera, is lifted by simplex
 * noise into soft folds. Its colour is five noise fields stacked in palette
 * order (`gradientSheet` in tokens.mjs), each one laying its colour over the
 * ones before, so bands of colour drift through each other while the folds
 * and the perspective stretch them. The technique behind the gradient on
 * theartmarket.artbasel.com, in plain WebGL so the homepage carries no 3D
 * library, and with one change for a dark palette: light colours add their
 * light rather than cover, so blue and orange never mix to mud.
 *
 * The pointer turns the sheet a little toward itself. The loop only runs while
 * its section is on screen and the tab is visible; with reduced motion it paints
 * a single still frame.
 */
import { gradientSheet } from "../styles/tokens.mjs";

/** Vertices per side: 256² is the most a 16-bit index buffer can address. */
const GRID = 256;
/** Camera: field of view (degrees) and distance from the sheet. */
const FOV = 50;
const DISTANCE = 5;
/** Where the sheet sits: raised, and tipped back so the top recedes. */
const LIFT = 1.5;
const PITCH = -0.4;
/** How far the pointer turns the sheet, in radians. */
const TURN = { x: 0.08, y: 0.05 };
/** Time units per second: Art Basel's pace at 60fps. The noise travels at 3–10× this. */
const SPEED = 0.012;
/** The still frame (reduced motion) and the first animated one, unless the caller picks another. */
const START = 8;

// Simplex noise: Ian McEwan, Ashima Arts (MIT). github.com/ashima/webgl-noise
const SNOISE = /* glsl */ `
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// Colour is worked out per vertex and interpolated across each triangle: on a
// grid this fine that is indistinguishable from per-pixel, at a fraction of it.
const VERTEX = /* glsl */ `
attribute vec2 a_uv;
uniform mat4 u_matrix;
uniform vec2 u_size;
uniform float u_time;
uniform vec3 u_color[5];
varying vec3 v_color;
${SNOISE}
void main() {
    // Three noise units across a 16:10 screen, scaled with the aspect ratio
    // so a phone sees a slice of the same wide ribbons, not narrow upright ones.
    vec2 coord = a_uv * vec2(1.875 * u_size.x / u_size.y, 4.0);

    // The top edge leans further back, the right edge slightly forward.
    float tilt = -0.8 * a_uv.y;
    float incline = a_uv.x * 0.1;
    float offset = incline * mix(-0.25, 0.25, a_uv.y);
    float fold = max(0.0, snoise(vec3(coord.x + u_time * 3.0, coord.y, u_time * 10.0)));
    vec3 pos = vec3((a_uv - 0.5) * u_size, fold * 0.3 + tilt + incline + offset);

    v_color = u_color[0];
    for (int i = 1; i < 5; i++) {
        float f = float(i);
        float n = snoise(vec3(
            coord.x * 0.4 + u_time * (5.0 + f * 0.3),
            coord.y * 0.56,
            u_time * (10.0 + f * 0.3) + 1.0 + f * 10.0
        ));
        // A dark colour covers what lies under it; a light one adds its light
        // to it (screen), so where blue and orange cross they catch a sheen
        // instead of mixing to mud, as complementary colours do.
        vec3 c = u_color[i];
        float light = smoothstep(0.08, 0.12, dot(c, vec3(0.2126, 0.7152, 0.0722)));
        c = mix(c, 1.0 - (1.0 - v_color) * (1.0 - c), light);
        v_color = mix(v_color, c, smoothstep(0.1, 0.6 + f * 0.07, n));
    }

    gl_Position = u_matrix * vec4(pos, 1.0);
}
`;

// A dark gradient in 8 bits bands visibly; half a step of noise dissolves it.
const FRAGMENT = /* glsl */ `
precision mediump float;
varying vec3 v_color;
void main() {
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    gl_FragColor = vec4(v_color + (grain - 0.5) / 255.0, 1.0);
}
`;

const hexToRgb = (hex: string) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// ── 4×4 matrices, column-major as WebGL expects ──
type Mat4 = Float32Array;

function multiply(a: Mat4, b: Mat4): Mat4 {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k];
            out[c * 4 + r] = sum;
        }
    }
    return out;
}

function perspective(fovDeg: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
    const nf = 1 / (near - far);
    // prettier-ignore
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0,
    ]);
}

const translate = (x: number, y: number, z: number): Mat4 =>
    new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);

function rotateX(a: number): Mat4 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function rotateY(a: number): Mat4 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

/** One uv per vertex; position is derived from it in the shader. */
function buildGrid() {
    const uv = new Float32Array(GRID * GRID * 2);
    for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
            const i = (y * GRID + x) * 2;
            uv[i] = x / (GRID - 1);
            uv[i + 1] = y / (GRID - 1);
        }
    }
    const cells = GRID - 1;
    const index = new Uint16Array(cells * cells * 6);
    let k = 0;
    for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
            const a = y * GRID + x;
            const b = a + GRID;
            index.set([a, b, a + 1, b, b + 1, a + 1], k);
            k += 6;
        }
    }
    return { uv, index };
}

/**
 * `section` sizes the canvas and receives the pointer. `start` is the moment
 * the animation opens on, so two sheets on one page need not match.
 */
export function initGradientSheet(section: HTMLElement, canvas: HTMLCanvasElement, reducedMotion: boolean, start = START) {
    const attrs: WebGLContextAttributes = { alpha: false, antialias: false, powerPreference: "low-power" };
    const gl = canvas.getContext("webgl", attrs) as WebGLRenderingContext | null;
    if (!gl) return;

    const palette = new Float32Array(gradientSheet.flatMap(hexToRgb));
    const grid = buildGrid();
    let uniforms: Record<"matrix" | "size" | "time" | "color", WebGLUniformLocation | null>;
    let ready = false;

    function compile(type: number, source: string) {
        const shader = gl!.createShader(type)!;
        gl!.shaderSource(shader, source);
        gl!.compileShader(shader);
        return shader;
    }

    // Separate from init so a lost context can be rebuilt in place.
    function setup() {
        const program = gl!.createProgram()!;
        gl!.attachShader(program, compile(gl!.VERTEX_SHADER, VERTEX));
        gl!.attachShader(program, compile(gl!.FRAGMENT_SHADER, FRAGMENT));
        gl!.linkProgram(program);
        if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) return false;
        gl!.useProgram(program);

        gl!.bindBuffer(gl!.ARRAY_BUFFER, gl!.createBuffer());
        gl!.bufferData(gl!.ARRAY_BUFFER, grid.uv, gl!.STATIC_DRAW);
        const loc = gl!.getAttribLocation(program, "a_uv");
        gl!.enableVertexAttribArray(loc);
        gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);

        gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, gl!.createBuffer());
        gl!.bufferData(gl!.ELEMENT_ARRAY_BUFFER, grid.index, gl!.STATIC_DRAW);

        uniforms = {
            matrix: gl!.getUniformLocation(program, "u_matrix"),
            size: gl!.getUniformLocation(program, "u_size"),
            time: gl!.getUniformLocation(program, "u_time"),
            color: gl!.getUniformLocation(program, "u_color"),
        };
        gl!.uniform3fv(uniforms.color, palette);
        // Where a fold rises toward the camera it may cover the sheet behind it.
        gl!.enable(gl!.DEPTH_TEST);
        return true;
    }

    // ── size ──
    // The colour is smooth and the glass layer above blurs it, so extra
    // device pixels would cost fill rate and show nothing.
    let aspect = 1;
    let sheet = [1, 1];

    function resize() {
        const w = Math.max(1, Math.round(section.offsetWidth));
        const h = Math.max(1, Math.round(section.offsetHeight));
        if (w === canvas.width && h === canvas.height) return;
        canvas.width = w;
        canvas.height = h;
        aspect = w / h;
        // The sheet is twice the visible area at the sheet's own depth, so
        // neither the tilt nor the pointer's turn ever shows an edge.
        const visible = 2 * DISTANCE * Math.tan((FOV * Math.PI) / 360);
        sheet = [2 * visible * aspect, 2 * visible];
        if (!running) draw();
    }

    // ── draw ──
    let time = start;
    const turn = { x: 0, y: 0, tx: 0, ty: 0 };

    function draw() {
        if (!ready) return;
        const model = multiply(
            translate(0, LIFT, 0),
            multiply(rotateX(PITCH + turn.y), rotateY(turn.x)),
        );
        const view = translate(0, 0, -DISTANCE);
        const matrix = multiply(perspective(FOV, aspect, 0.1, 100), multiply(view, model));

        gl!.viewport(0, 0, canvas.width, canvas.height);
        gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
        gl!.uniformMatrix4fv(uniforms.matrix, false, matrix);
        gl!.uniform2f(uniforms.size, sheet[0], sheet[1]);
        gl!.uniform1f(uniforms.time, time);
        gl!.drawElements(gl!.TRIANGLES, grid.index.length, gl!.UNSIGNED_SHORT, 0);
    }

    // ── loop control ──
    let running = false;
    let frame = 0;
    let last = 0;
    let onScreen = true;

    const loop = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        time += dt * SPEED;
        // Ease toward the pointer; framerate-independent.
        const k = 1 - Math.exp(-dt * 2.5);
        turn.x += (turn.tx - turn.x) * k;
        turn.y += (turn.ty - turn.y) * k;
        draw();
        frame = requestAnimationFrame(loop);
    };

    function sync() {
        const shouldRun = ready && !reducedMotion && onScreen && !document.hidden;
        if (shouldRun === running) return;
        running = shouldRun;
        if (running) {
            last = performance.now();
            frame = requestAnimationFrame(loop);
        } else {
            cancelAnimationFrame(frame);
        }
    }

    canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        ready = false;
        sync();
    });
    canvas.addEventListener("webglcontextrestored", () => {
        ready = setup();
        draw();
        sync();
    });

    ready = setup();
    if (!ready) return;

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
    section.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const rect = section.getBoundingClientRect();
        turn.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * TURN.x;
        turn.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2 * TURN.y;
    });
    section.addEventListener("pointerleave", () => {
        turn.tx = 0;
        turn.ty = 0;
    });
}
