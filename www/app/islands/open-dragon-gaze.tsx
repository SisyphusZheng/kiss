/** @jsxImportSource @openelement/element */
/**
 * The WWW hero mascot: a single-texture soft-body rig that behaves like a
 * desktop pet. One transparent portrait is texture-mapped onto a 45×45
 * vertex grid; the vertex shader runs ~10 Gaussian weight fields — head,
 * horns, ears, eyes, whiskers, chest, tail — each driven by its own spring
 * with its own time constant, so motion has follow-through: the eyes dart
 * first (saccade), the head follows, horns and whiskers swing a beat late.
 *
 * Alive layer: breathing, random blinks, ear flicks, tail sway, curiosity
 * head-tilts, idle glances — and after ~24s of stillness it dozes: eyes
 * close, breath slows and deepens, the head sinks, with an occasional
 * half-startle. Any cursor movement wakes it with a small upward kick.
 *
 * Degradation: SSR ships the plain <img> (the LCP); the canvas takes over
 * only after the texture is up and the first frame is drawn. No WebGL,
 * reduced motion, or texture failure → the still. Never a texture swap.
 */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';

export const tagName = 'open-dragon-gaze';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const TEXTURE_URL = '/assets/dragon-center.webp';
const GRID = 44;
const DOZE_AFTER_MS = 24000;
const GLANCE_EVERY_MS = 7000;
const STARTLE_EVERY_MS = 8000;

const VERTEX_SHADER = `
attribute vec2 aUV;
uniform float uGaze;
uniform float uGazeSlow;
uniform float uGazeLazy;
uniform float uEye;
uniform float uLift;
uniform float uBlink;
uniform float uEar;
uniform float uBreath;
uniform float uDroop;
uniform float uTail;
uniform float uTilt;
uniform float uTime;
varying vec2 vUV;

float g(vec2 p, vec2 c, vec2 s, float k) {
  vec2 d = (p - c) / s;
  return exp(-dot(d, d) * k);
}

void main() {
  vec2 p = aUV;
  const vec2 pivot = vec2(0.412, 0.608);
  const vec2 head = vec2(0.412, 0.327);
  const vec2 chest = vec2(0.385, 0.732);
  float w = g(p, head, vec2(0.36, 0.40), 1.5);
  float wHorn = g(p, vec2(0.38, 0.12), vec2(0.28, 0.15), 1.8);
  float wEye = g(p, vec2(0.372, 0.343), vec2(0.13, 0.08), 2.0);
  float wEyeL = g(p, vec2(0.286, 0.342), vec2(0.055, 0.048), 2.2);
  float wEyeR = g(p, vec2(0.457, 0.345), vec2(0.055, 0.048), 2.2);
  float wWhiskL = g(p, vec2(0.16, 0.44), vec2(0.17, 0.055), 1.6);
  float wWhiskR = g(p, vec2(0.60, 0.44), vec2(0.17, 0.055), 1.6);
  float wEarL = g(p, vec2(0.13, 0.24), vec2(0.09, 0.10), 1.8);
  float wEarR = g(p, vec2(0.63, 0.235), vec2(0.09, 0.10), 1.8);
  float wTail = g(p, vec2(0.87, 0.70), vec2(0.13, 0.16), 1.6);
  float wChest = g(p, chest, vec2(0.30, 0.34), 1.8);

  // Head turn: weighted bend around the neck pivot (no hinge), drift,
  // foreshortening toward the turn side, and a small mid-turn dip.
  float th = uGaze * 0.23 * w + uTilt * w;
  vec2 q = p - pivot;
  float c = cos(th);
  float s = sin(th);
  p = pivot + vec2(q.x * c - q.y * s, q.x * s + q.y * c);
  p.x += uGaze * 0.038 * w;
  p.x -= (aUV.x - head.x) * abs(uGaze) * 0.12 * w;
  p.y += (1.0 - cos(uGaze * 0.23)) * 0.10 * w;
  p.y += uLift * 0.022 * w;

  // Eyes lead: fast saccade, then the blink pinch pulls lids to the eye line.
  p.x += uEye * 0.016 * wEye;
  p.y += uLift * 0.010 * wEye;
  float bl = uBlink * 0.75;
  p.y += (0.342 - aUV.y) * bl * wEyeL;
  p.y += (0.345 - aUV.y) * bl * wEyeR;

  // Follow-through: horns, ears and whiskers swing with the lag difference.
  float swing = uGazeSlow - uGaze;
  p.x += swing * 0.030 * wHorn;
  p.x += swing * 0.045 * (wEarL + wEarR);
  float lazySwing = uGazeLazy - uGazeSlow;
  p.x += lazySwing * 0.055 * (wWhiskL + wWhiskR);
  p.y += sin(uTime * 1.9 + aUV.x * 8.0) * 0.0035 * (wWhiskL + wWhiskR);

  // Ear flick: a quick asymmetric twitch.
  p.y -= uEar * 0.014 * wEarL;
  p.y += uEar * 0.014 * wEarR;

  // Breathing chest, dozing droop, tail sway.
  p.y += uBreath * 0.006 * wChest;
  p.x += uBreath * 0.0015 * wChest;
  p.y += uDroop * 0.092 * w;
  vec2 qh = p - head;
  p = head + qh * (1.0 - 0.07 * uDroop * w);
  p.x += uTail * 0.018 * wTail;
  p.y += abs(uTail) * 0.005 * wTail;

  vUV = aUV;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUV;
uniform sampler2D uTex;
void main() {
  gl_FragColor = texture2D(uTex, vUV);
}`;

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: block; }
  .rig { position: relative; margin: 0; aspect-ratio: 939 / 906; }
  .still { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; }
  canvas { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; display: block; }
  .ground { position: absolute; z-index: 0; left: 14%; right: 8%; bottom: 2.5%; height: 7%; border-radius: 50%; background: radial-gradient(50% 50% at 50% 50%, rgba(64, 52, 42, .26), transparent 70%); filter: blur(5px); }
`);

interface SpringAxis {
  value: number;
  velocity: number;
  target: number;
  k: number;
  c: number;
}

const axis = (k: number, c: number): SpringAxis => ({ value: 0, velocity: 0, target: 0, k, c });
const rand = (min: number, max: number): number => min + Math.random() * (max - min);

export default class DragonGaze extends OpenElement {
  static override styles = [sheet];

  #raf = 0;
  #last = 0;
  #lastPointer = 0;
  #nextGlance = 0;
  #glanceUntil = 0;
  #nextStartle = 0;
  #startleUntil = 0;
  #nextBlink = 0;
  #blinkStart = 0;
  #nextEar = 0;
  #earStart = 0;
  #earDir = 1;
  #nextTilt = 0;
  #tiltUntil = 0;
  #dozing = false;
  #blink = 0;
  #breathPhase = 0;
  #breathRate = 1.35;
  #tailPhase = 0;
  #visible = true;
  #started = false;
  #contextLost = false;
  #observer: IntersectionObserver | null = null;
  #resizeObserver: ResizeObserver | null = null;
  #canvas: HTMLCanvasElement | null = null;
  #gl: WebGLRenderingContext | null = null;
  #u: Record<string, WebGLUniformLocation | null> = {};
  // One spring per body-part time constant — follow-through is temporal.
  #gaze = axis(90, 13); // head: weighty
  #gazeSlow = axis(45, 8); // horns/ears: a beat late
  #gazeLazy = axis(22, 6); // whiskers: two beats late
  #eye = axis(320, 22); // saccade: darts ahead of the head
  #lift = axis(90, 13);
  #tilt = axis(30, 7); // curiosity roll
  #droop = axis(7, 4.5); // doze: very slow sink

  override connectedCallback(): void {
    super.connectedCallback();
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) return;

    const finePointer = globalThis.matchMedia?.('(pointer: fine)').matches ?? false;
    if (finePointer) {
      globalThis.addEventListener('pointermove', this.#onPointerMove, { passive: true });
    }
    this.#observer = new IntersectionObserver(
      (entries) => {
        this.#visible = entries[0]?.isIntersecting ?? true;
        if (this.#visible) this.#wake();
      },
      { threshold: 0.05 },
    );
    this.#observer.observe(this);
    this.#start();
  }

  override disconnectedCallback(): void {
    globalThis.removeEventListener('pointermove', this.#onPointerMove);
    this.#observer?.disconnect();
    this.#observer = null;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#canvas = null;
    this.#gl = null;
    super.disconnectedCallback();
  }

  #compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[dragon-gaze] shader compile failed:', gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;
    const rig = this.shadowRoot?.querySelector('.rig');
    const still = this.shadowRoot?.querySelector('.still');
    if (!rig || !(still instanceof HTMLImageElement)) return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    const vertex = this.#compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = this.#compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[dragon-gaze] program link failed:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const verts: number[] = [];
    for (let row = 0; row <= GRID; row++) {
      for (let col = 0; col <= GRID; col++) verts.push(col / GRID, row / GRID);
    }
    const indices: number[] = [];
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const a = row * (GRID + 1) + col;
        const b = a + 1;
        const below = a + GRID + 1;
        indices.push(a, b, below, b, below + 1, below);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    const aUV = gl.getAttribLocation(program, 'aUV');
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);

    for (const name of [
      'uGaze', 'uGazeSlow', 'uGazeLazy', 'uEye', 'uLift', 'uBlink', 'uEar',
      'uBreath', 'uDroop', 'uTail', 'uTilt', 'uTime',
    ]) {
      this.#u[name] = gl.getUniformLocation(program, name);
    }
    const texLocation = gl.getUniformLocation(program, 'uTex');
    if (texLocation) gl.uniform1i(texLocation, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const resize = () => {
      const scale = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const texture = gl.createTexture();
    const image = new Image();
    image.onload = () => {
      if (this.#contextLost || !this.isConnected) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      rig.appendChild(canvas);
      // Size only once the canvas is in the layout tree — clientWidth is 0
      // before insertion, and ResizeObserver fires immediately on observe().
      this.#resizeObserver = new ResizeObserver(resize);
      this.#resizeObserver.observe(canvas);
      resize();
      still.style.visibility = 'hidden';
      this.#wake();
    };
    image.src = TEXTURE_URL;

    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.#contextLost = true;
      cancelAnimationFrame(this.#raf);
      this.#raf = 0;
      still.style.visibility = '';
      canvas.remove();
    }, { once: true });

    this.#canvas = canvas;
    this.#gl = gl;
  }

  #onPointerMove = (event: PointerEvent): void => {
    const w = globalThis.innerWidth || 1;
    const h = globalThis.innerHeight || 1;
    const gx = Math.max(-1, Math.min(1, (event.clientX / w) * 2 - 1));
    this.#gaze.target = gx;
    // The eyes dart slightly past the target — saccades overshoot.
    this.#eye.target = Math.max(-1.12, Math.min(1.12, gx * 1.12));
    this.#lift.target = Math.max(-1, Math.min(1, (event.clientY / h) * 2 - 1)) * 0.6;
    this.#lastPointer = performance.now();
    if (this.#dozing) {
      // Woken up: eyes open, a small upward kick, the slow spring settles.
      this.#dozing = false;
      this.#droop.target = 0;
      this.#droop.velocity = -3.5;
    }
    this.#wake();
  };

  #wake(): void {
    if (!this.#raf && this.#gl) {
      this.#last = performance.now();
      this.#raf = requestAnimationFrame(this.#tick);
    }
  }

  #step(a: SpringAxis, dt: number): void {
    const acceleration = (a.target - a.value) * a.k - a.velocity * a.c;
    a.velocity += acceleration * dt;
    a.value += a.velocity * dt;
  }

  // Slower springs chase the faster one's target — the lag *is* the effect.
  #chase(): void {
    this.#gazeSlow.target = this.#gaze.target;
    this.#gazeLazy.target = this.#gazeSlow.target;
  }

  #tick = (now: number): void => {
    this.#raf = 0;
    const gl = this.#gl;
    if (!gl || this.#contextLost || !this.#visible || document.hidden) return;
    const dt = Math.min(now - this.#last, 50) / 1000;
    this.#last = now;
    const t = now / 1000;
    const idle = now - this.#lastPointer;

    // ── dozing ──
    if (idle > DOZE_AFTER_MS && !this.#dozing) {
      this.#dozing = true;
      this.#droop.target = 1;
      this.#gaze.target = 0;
      this.#eye.target = 0;
      this.#lift.target = 0;
      this.#nextStartle = now + STARTLE_EVERY_MS + Math.random() * 4000;
    }
    if (this.#dozing) {
      this.#breathRate += (0.62 - this.#breathRate) * dt * 0.8;
      this.#blink += (0.9 - this.#blink) * dt * 3; // eyes stay closed
      if (now > this.#nextStartle) {
        this.#droop.target = 0.25;
        this.#blink = Math.max(0, this.#blink - 0.5); // eyes flutter open a bit
        this.#startleUntil = now + 450 + Math.random() * 300;
        this.#nextStartle = now + STARTLE_EVERY_MS + Math.random() * 5000;
      } else if (now > this.#startleUntil) {
        this.#droop.target = 1;
      }
    } else {
      this.#breathRate += (1.35 - this.#breathRate) * dt * 0.8;
      this.#blink += (0 - this.#blink) * dt * 6;

      // ── blink events: a ~150ms cosine envelope every 2.2–5.5s ──
      if (now >= this.#nextBlink) {
        this.#blinkStart = now;
        this.#nextBlink = now + rand(2200, 5500);
      }
      const blinkProgress = (now - this.#blinkStart) / 150;
      if (blinkProgress >= 0 && blinkProgress <= 1) {
        this.#blink = Math.max(this.#blink, Math.sin(Math.PI * blinkProgress));
      }

      // ── ear flicks every 5–14s ──
      if (now >= this.#nextEar) {
        this.#earStart = now;
        this.#earDir = Math.random() < 0.5 ? -1 : 1;
        this.#nextEar = now + rand(5000, 14000);
      }

      // ── idle wander, glances, curiosity tilts ──
      if (idle > 4000) {
        if (now > this.#nextGlance) {
          const direction = Math.random() < 0.5 ? -1 : 1;
          this.#gaze.target = direction * (0.5 + Math.random() * 0.4);
          this.#eye.target = this.#gaze.target * 1.12;
          this.#glanceUntil = now + 1100 + Math.random() * 500;
          this.#nextGlance = now + GLANCE_EVERY_MS + Math.random() * 4000;
        } else if (now > this.#glanceUntil) {
          this.#gaze.target = 0.26 * Math.sin(t * 0.21) + 0.13 * Math.sin(t * 0.53 + 1.7);
          this.#eye.target = this.#gaze.target * 1.12;
          this.#lift.target = 0.12 * Math.sin(t * 0.31 + 0.8);
        }
        if (idle > 6000 && now > this.#nextTilt) {
          this.#tilt.target = (Math.random() < 0.5 ? -1 : 1) * rand(0.2, 0.4);
          this.#tiltUntil = now + rand(1100, 1700);
          this.#nextTilt = now + rand(18000, 30000);
        } else if (now > this.#tiltUntil) {
          this.#tilt.target = this.#gaze.value * 0.22; // roll into turns
        }
      } else {
        this.#tilt.target = this.#gaze.value * 0.22;
      }
    }
    this.#chase();

    this.#breathPhase += dt * this.#breathRate * Math.PI * 2 * 0.22;
    const breath = Math.sin(this.#breathPhase) * (this.#dozing ? 1.5 : 1);
    const excited = idle < 3000;
    this.#tailPhase += dt * (this.#dozing ? 0.5 : excited ? 1.7 : 0.9);

    const earProgress = (now - this.#earStart) / 260;
    const ear = earProgress >= 0 && earProgress <= 1
      ? Math.sin(Math.PI * earProgress) * this.#earDir
      : 0;

    this.#step(this.#gaze, dt);
    this.#step(this.#gazeSlow, dt);
    this.#step(this.#gazeLazy, dt);
    this.#step(this.#eye, dt);
    this.#step(this.#lift, dt);
    this.#step(this.#tilt, dt);
    this.#step(this.#droop, dt);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.#u.uGaze, this.#gaze.value);
    gl.uniform1f(this.#u.uGazeSlow, this.#gazeSlow.value);
    gl.uniform1f(this.#u.uGazeLazy, this.#gazeLazy.value);
    gl.uniform1f(this.#u.uEye, this.#eye.value);
    gl.uniform1f(this.#u.uLift, this.#lift.value);
    gl.uniform1f(this.#u.uBlink, Math.min(1, Math.max(0, this.#blink)));
    gl.uniform1f(this.#u.uEar, ear);
    gl.uniform1f(this.#u.uBreath, breath);
    gl.uniform1f(this.#u.uDroop, Math.max(0, this.#droop.value));
    gl.uniform1f(this.#u.uTail, Math.sin(this.#tailPhase));
    gl.uniform1f(this.#u.uTilt, this.#tilt.value);
    gl.uniform1f(this.#u.uTime, t);
    gl.drawElements(gl.TRIANGLES, GRID * GRID * 6, gl.UNSIGNED_SHORT, 0);
    this.#raf = requestAnimationFrame(this.#tick);
  };

  override render() {
    return (
      <figure class='rig'>
        <span class='ground' aria-hidden='true'></span>
        <img
          class='still'
          src={TEXTURE_URL}
          width='939'
          height='906'
          alt='The OpenElement dragon — it watches your cursor, breathes, blinks, and dozes.'
          fetchpriority='high'
          decoding='async'
        />
      </figure>
    );
  }
}

defineCustomElement(tagName, DragonGaze);
