/** @jsxImportSource @openelement/element */
/**
 * The WWW hero mascot, living edition. Two cooperating media sources:
 *
 * 1. A 59-frame pose atlas (WebP stills drawn to <canvas>) for cursor
 *    tracking — the head IS the frames: cursor x maps piecewise onto the
 *    range through the frontal anchor (frame 27), chased with exponential
 *    smoothing, rendered as a sub-frame crossfade of the two nearest
 *    frames. Continuous at any speed, no seek latency, no stop-motion.
 *    Frames 15-17 are the source take's one natural squint: traversable
 *    mid-gesture (reads as a blink) but never parked on — a resting cursor
 *    slides the pose to the nearest open-eyed frame.
 * 2. An idle video loop (dragon-idle.mp4, a deflicked boomerang of a real
 *    Kling take: breathing, blinks, ear twitches, tail-tip sway). After ~4s
 *    without cursor input the atlas glides to center and crossfades into
 *    the loop — the dragon is alive on its own with filmed micro-motion,
 *    not a simulation. Any pointer movement fades back to the atlas
 *    instantly. If the loop cannot play, a layered-sine gaze wander around
 *    center is the fallback.
 *
 * SSR ships the frontal poster frame; the canvas takes over once decoded.
 * Reduced motion → poster only. Coarse pointer → no tracking; the idle
 * loop still plays. Offscreen or hidden tab → everything pauses.
 */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';

export const tagName = 'open-dragon-live-gaze';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const FRAME_COUNT = 59;
// Frontal anchor: clip A3 source frame 58 — dead-frontal, eyes fully open.
const CENTER = 27;
// The take's single squint (src ~30-40, sparsely sampled): fine mid-gesture,
// never a resting pose.
const PARK_MIN = 15;
const PARK_MAX = 17;
const PARK_LOW = 14;
const PARK_HIGH = 18;
const PARK_DELAY_MS = 1200;
const IDLE_AFTER_MS = 4000;
const FOLLOW_RATE = 9;
const RETURN_RATE = 3;
// Fallback-wander bounds (only used if the idle loop cannot play).
const WANDER_AMP = 5.5;
const IDLE_MIN = 20;
const IDLE_MAX = 34;
const IDLE_VIDEO_URL = '/assets/dragon-idle.mp4';

const frameUrl = (index: number): string =>
  `/assets/dragon-frames/f${String(index).padStart(2, '0')}.webp`;

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: block; width: 100%; height: 100%; }
  .stage {
    position: relative; margin: 0; width: 100%; height: 100%;
    background: #000; overflow: hidden; transform-origin: 46% 56%;
    animation: dragon-enter 2.2s cubic-bezier(.22,.61,.21,1) both, dragon-breathe 6.5s ease-in-out 2.3s infinite alternate;
  }
  /* Emerge from the dark — a slow settle, not a fade-in. */
  @keyframes dragon-enter { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
  /* A tiny, slow breath — felt more than seen. */
  @keyframes dragon-breathe {
    from { transform: scale(1) translateY(0); }
    to { transform: scale(1.016) translateY(-0.4%); }
  }
  .poster, .view, .idle-view { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
  .poster { object-fit: cover; }
  .view { visibility: hidden; z-index: 1; }
  .stage.live .view { visibility: visible; }
  .idle-view {
    z-index: 2; object-fit: cover; opacity: 0; pointer-events: none;
    transition: opacity .28s ease-out;
  }
  .stage.idling .idle-view { opacity: 1; transition-duration: .75s; }
  .stage::before, .stage::after { content: ""; position: absolute; inset: 0; z-index: 3; pointer-events: none; }
  /* A faint warm pool on the floor — grounds the creature on the black. */
  .stage::before { background: radial-gradient(34% 9% at 50% 83%, rgba(255,224,178,.07), transparent 72%); }
  /* Studio key light: a soft warm wash that leans a few percent toward the
     dragon's gaze — as if the viewer's attention were the light source. */
  .stage::after { background: radial-gradient(58% 46% at calc(46% + (var(--gaze, .5) - .5) * 14%) 36%, rgba(255,238,208,.09), transparent 70%); }
  /* Dust motes drifting through the key light — almost subliminal. */
  .mote {
    position: absolute; z-index: 3; width: 3px; height: 3px; border-radius: 50%;
    background: rgba(255,236,200,.55); filter: blur(1px); opacity: 0; pointer-events: none;
    animation: mote-drift 15s ease-in-out infinite;
  }
  .mote:nth-of-type(1) { left: 36%; top: 26%; animation-delay: -2s; animation-duration: 17s; }
  .mote:nth-of-type(2) { left: 44%; top: 40%; animation-delay: -7s; }
  .mote:nth-of-type(3) { left: 52%; top: 22%; animation-delay: -4s; animation-duration: 13s; }
  .mote:nth-of-type(4) { left: 58%; top: 48%; animation-delay: -11s; animation-duration: 18s; }
  .mote:nth-of-type(5) { left: 41%; top: 55%; animation-delay: -9s; animation-duration: 14s; }
  .mote:nth-of-type(6) { left: 61%; top: 33%; animation-delay: -5s; animation-duration: 16s; }
  .mote:nth-of-type(7) { left: 48%; top: 18%; animation-delay: -13s; animation-duration: 19s; }
  .mote:nth-of-type(8) { left: 33%; top: 44%; animation-delay: -1s; animation-duration: 12s; }
  @keyframes mote-drift {
    0%, 100% { transform: translate(0, 0); opacity: 0; }
    18% { opacity: .26; }
    50% { transform: translate(2.4rem, -3.2rem); opacity: .16; }
    82% { opacity: .22; }
  }
  /* Extreme ratios: cover would amputate horns or tail — contain instead;
     the letterbox is pure black on a pure black stage, i.e. invisible. */
  @media (max-aspect-ratio: 4/5), (min-aspect-ratio: 21/10) {
    .poster, .idle-view { object-fit: contain; }
  }
  @media (prefers-reduced-motion: reduce) { .stage { animation: none; } .mote { animation: none; opacity: 0; } }
`);

export default class DragonLiveGaze extends OpenElement {
  static override styles = [sheet];

  #canvas: HTMLCanvasElement | null = null;
  #ctx: CanvasRenderingContext2D | null = null;
  #video: HTMLVideoElement | null = null;
  #observer: IntersectionObserver | null = null;
  #resizer: ResizeObserver | null = null;
  #imgs: (HTMLImageElement | null)[] = Array.from({ length: FRAME_COUNT }, () => null);
  // 0 = not requested, 1 = loading, 2 = loaded, 3 = decoded at least once.
  #state: number[] = Array.from({ length: FRAME_COUNT }, () => 0);
  #decoding = new Set<number>();
  #raf = 0;
  #last = 0;
  #lastPointer = 0;
  #current = CENTER;
  #target = CENTER;
  #drawn = Number.NaN;
  #dirty = true;
  #idleAmp = 0;
  #saccade = 0;
  #nextSaccade = 0;
  #visible = true;
  #attrFrame = -1;
  #idling = false;
  #videoFailed = false;
  #pauseTimer = 0;
  #onIdlePlaying: (() => void) | null = null;
  #idleBlink = 0;
  #blinkT = 0;
  #stage: HTMLElement | null = null;
  #farewell = false;
  #farewellCleanup: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    const root = this.shadowRoot;
    const canvas = root?.querySelector('canvas');
    const video = root?.querySelector('video');
    if (!root || !(canvas instanceof HTMLCanvasElement)) return;
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) return; // the SSR poster is the whole experience
    this.#canvas = canvas;
    this.#ctx = canvas.getContext('2d', { alpha: false });
    if (this.#ctx) this.#ctx.imageSmoothingQuality = 'high';
    this.#stage = root.querySelector('.stage');
    if (video instanceof HTMLVideoElement) {
      this.#video = video;
      video.muted = true;
      video.addEventListener('error', () => {
        this.#videoFailed = true;
      });
    }

    this.#resizer = new ResizeObserver(() => {
      this.#resize();
      this.#dirty = true;
    });
    this.#resizer.observe(this);
    this.#resize();

    // Center first for the fastest live first paint, then the rest outward
    // from center — the cursor always travels through near-center frames.
    this.#load(CENTER, () => {
      root.querySelector('.stage')?.classList.add('live');
      this.#wake();
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (CENTER - d >= 0) this.#load(CENTER - d);
        if (CENTER + d < FRAME_COUNT) this.#load(CENTER + d);
      }
      // Progressive full decode in the background: without it, a fast sweep
      // can hit a loaded-but-undecoded frame and pay a synchronous main-
      // thread decode — that is the mid-gesture stutter.
      const pump = (): void => {
        const next = this.#state.findIndex((s) => s === 2 && !this.#decoding.has(s));
        if (next === -1) {
          if (this.#state.some((s) => s === 1)) globalThis.setTimeout(pump, 400);
          return;
        }
        this.#ensureDecoded(next);
        globalThis.setTimeout(pump, 60);
      };
      globalThis.setTimeout(pump, 800);
    });

    const finePointer = globalThis.matchMedia?.('(pointer: fine)').matches ?? false;
    if (finePointer) {
      globalThis.addEventListener('pointermove', this.#onPointerMove, { passive: true });
    }
    this.#observer = new IntersectionObserver(
      (entries) => {
        this.#visible = entries[0]?.isIntersecting ?? true;
        if (this.#visible) {
          this.#wake();
          if (this.#idling) void this.#video?.play().catch(() => {});
        } else if (this.#idling) {
          this.#video?.pause();
        }
      },
      { threshold: 0.05 },
    );
    this.#observer.observe(this);
    document.addEventListener('visibilitychange', this.#onVisibility);

    // The farewell: once the hero is scrolled a third out of view, the
    // dragon stops performing for the cursor and returns to its own life —
    // it glides home, blinks, and the breathing loop takes over as the
    // stage sinks away. Scrolling back up hands control straight back.
    // While the farewell holds, pointer input is ignored entirely.
    if (finePointer) {
      const heroMain = (this.getRootNode() as ShadowRoot | Document)?.querySelector?.('.hero-main');
      if (heroMain) {
        let scrollQueued = false;
        const onScroll = (): void => {
          if (scrollQueued) return;
          scrollQueued = true;
          requestAnimationFrame(() => {
            scrollQueued = false;
            const rect = heroMain.getBoundingClientRect();
            if (-rect.top > rect.height * 0.35) {
              if (!this.#farewell) {
                this.#farewell = true;
                // Parked forever — the idle state machine glides home,
                // blinks and hands over to the loop, exactly as it does
                // after four cursor-free seconds.
                this.#lastPointer = 0;
                this.#wake();
              }
            } else if (this.#farewell) {
              this.#farewell = false;
              this.#lastPointer = performance.now();
              if (this.#idling) this.#leaveIdle();
              this.#wake();
            }
          });
        };
        globalThis.addEventListener('scroll', onScroll, { passive: true });
        this.#farewellCleanup = () => globalThis.removeEventListener('scroll', onScroll);
      }
    }
  }

  override disconnectedCallback(): void {
    globalThis.removeEventListener('pointermove', this.#onPointerMove);
    document.removeEventListener('visibilitychange', this.#onVisibility);
    this.#farewellCleanup?.();
    this.#farewellCleanup = null;
    this.#observer?.disconnect();
    this.#observer = null;
    this.#resizer?.disconnect();
    this.#resizer = null;
    cancelAnimationFrame(this.#raf);
    clearTimeout(this.#pauseTimer);
    this.#raf = 0;
    this.#canvas = null;
    this.#ctx = null;
    this.#video = null;
    super.disconnectedCallback();
  }

  #load(index: number, onReady?: () => void): void {
    if (this.#state[index] !== 0) return;
    this.#state[index] = 1;
    const img = new Image();
    img.onload = () => {
      this.#state[index] = 2;
      this.#dirty = true; // a sharper substitute may now be drawable
      if (onReady) {
        img.decode().then(onReady, onReady);
      }
    };
    img.onerror = () => {
      this.#state[index] = 0;
    };
    img.src = frameUrl(index);
    this.#imgs[index] = img;
  }

  // Warm the decoder for the frames a sweep is about to pass through, so
  // drawImage never pays a first-decode hitch mid-gesture.
  #ensureDecoded(index: number): void {
    if (index < 0 || index >= FRAME_COUNT) return;
    const img = this.#imgs[index];
    if (this.#state[index] !== 2 || !img || this.#decoding.has(index)) return;
    this.#decoding.add(index);
    img.decode()
      .then(() => {
        this.#state[index] = 3;
      })
      .catch(() => {})
      .finally(() => {
        this.#decoding.delete(index);
      });
  }

  #resize(): void {
    const canvas = this.#canvas;
    if (!canvas) return;
    const rect = this.getBoundingClientRect();
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this.#dirty = true;
    }
  }

  #onVisibility = (): void => {
    if (document.hidden && this.#idling) this.#video?.pause();
    if (!document.hidden && this.#idling && this.#visible) void this.#video?.play().catch(() => {});
  };

  #onPointerMove = (event: PointerEvent): void => {
    if (this.#farewell) return; // scrolled out — the dragon is its own creature now
    const width = globalThis.innerWidth || 1;
    const norm = Math.max(0, Math.min(1, event.clientX / width));
    // Piecewise through the frontal frame so a centered cursor is dead-on.
    this.#target = norm <= 0.5
      ? norm * 2 * CENTER
      : CENTER + (norm - 0.5) * 2 * (FRAME_COUNT - 1 - CENTER);
    this.#lastPointer = performance.now();
    if (this.#idling) this.#leaveIdle();
    this.#wake();
  };

  #enterIdle(): void {
    if (this.#idling) return;
    const video = this.#video;
    const stage = this.shadowRoot?.querySelector('.stage');
    if (!video || this.#videoFailed || !stage) return;
    this.#idling = true;
    // Start playback from the loop's first frame — it matches the atlas
    // center pose by construction, so the slow entry fade is seamless.
    try {
      video.currentTime = 0;
    } catch {
      // metadata not loaded yet; the loop starts wherever it is — the
      // fade covers the difference.
    }
    // Guard every async step on #idling: if the cursor returns while the
    // video is still fetching, a late 'playing'/timer must not fire into
    // the revived atlas loop (that race once froze the dragon mid-sweep).
    const show = (): void => {
      if (!this.#idling) {
        if (!video.paused) video.pause(); // left idle while it was fetching
        return;
      }
      stage.classList.add('idling');
      // The atlas loop can rest once the loop covers it.
      this.#pauseTimer = globalThis.setTimeout(() => {
        if (this.#idling) {
          cancelAnimationFrame(this.#raf);
          this.#raf = 0;
        }
      }, 900);
    };
    this.#onIdlePlaying = show;
    const guardedPlay = video.play();
    if (video.readyState >= 3) {
      void guardedPlay.then(show).catch(() => {
        this.#videoFailed = true;
        this.#idling = false;
        this.#wake(); // fall back to the wander loop
      });
    } else {
      void guardedPlay.then(show).catch(() => {});
      video.addEventListener('playing', show, { once: true });
      // Never wait forever for the loop — the wander fallback takes over.
      globalThis.setTimeout(() => {
        if (this.#idling && !stage.classList.contains('idling')) {
          this.#idling = false;
          this.#wake();
        }
      }, 3000);
    }
  }

  #leaveIdle(): void {
    this.#idling = false;
    clearTimeout(this.#pauseTimer);
    const video = this.#video;
    if (video && this.#onIdlePlaying) {
      video.removeEventListener('playing', this.#onIdlePlaying);
      this.#onIdlePlaying = null;
    }
    const stage = this.shadowRoot?.querySelector('.stage');
    stage?.classList.remove('idling');
    if (video && !video.paused) {
      globalThis.setTimeout(() => {
        if (!this.#idling) video.pause();
      }, 300);
    }
    // Hand back to the atlas exactly where the loop took over.
    this.#current = CENTER;
    this.#drawn = Number.NaN;
    this.#dirty = true;
    this.#idleBlink = 0;
  }

  #wake(): void {
    if (!this.#raf && this.#canvas && !this.#idling) {
      this.#last = performance.now();
      this.#raf = requestAnimationFrame(this.#tick);
    }
  }

  #tick = (now: number): void => {
    this.#raf = 0;
    if (!this.#visible || document.hidden) return;
    const dt = Math.min(now - this.#last, 50) / 1000;
    this.#last = now;

    const parkedMs = this.#lastPointer ? now - this.#lastPointer : Number.POSITIVE_INFINITY;
    const idle = parkedMs > IDLE_AFTER_MS;

    let target: number;
    let rate = FOLLOW_RATE;
    let blinking = false;
    if (idle) {
      if (!this.#videoFailed && this.#video) {
        if (this.#idleBlink === 0 && Math.abs(this.#current - CENTER) >= 0.2) {
          // Glide home first.
          target = CENTER;
          rate = RETURN_RATE;
        }
        if (this.#idleBlink === 0 && Math.abs(this.#current - CENTER) < 0.2) {
          this.#idleBlink = 1; // at center: begin the settle blink
          this.#blinkT = now;
        }
        if (this.#idleBlink === 1) {
          // Once started, the blink always runs to completion — re-checking
          // the at-center gate mid-blink resets the dip and starves the
          // hand-off (the dragon would fidget at center forever).
          const phase = (now - this.#blinkT) / 560;
          if (phase < 0.45) {
            target = Math.round((PARK_MIN + PARK_MAX) / 2); // into the squint — eyes close
            rate = 10;
            blinking = true;
          } else if (phase < 1) {
            target = CENTER;
            rate = 10;
            blinking = true;
          } else {
            this.#idleBlink = 0;
            this.#current = CENTER;
            this.#render(CENTER);
            this.#enterIdle();
            if (this.#idling) return; // the loop is taking over; stop the atlas rAF
            target = CENTER; // hand-off failed mid-flight — hold center
          }
        }
      } else {
        // Fallback: a slow layered-sine wander (periods ~23s/8.5s/4.3s —
        // never visibly repeating) plus small saccade darts.
        this.#idleAmp = Math.min(1, this.#idleAmp + dt / 2.5);
        const t = now / 1000;
        const wander = 0.55 * Math.sin(2 * Math.PI * 0.043 * t)
          + 0.3 * Math.sin(2 * Math.PI * 0.117 * t + 1.7)
          + 0.15 * Math.sin(2 * Math.PI * 0.231 * t + 4.2);
        if (this.#idleAmp > 0.6 && now >= this.#nextSaccade) {
          this.#saccade = (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random() * 2.2);
          this.#nextSaccade = now + 1200 + Math.random() * 2300;
        }
        this.#saccade *= Math.exp(-dt * 2.2);
        target = CENTER + (wander * WANDER_AMP + this.#saccade) * this.#idleAmp;
      }
    } else {
      this.#idleAmp = 0;
      this.#saccade = 0;
      target = this.#target;
    }

    // A resting pose may not sit inside the squint: slide to the nearest
    // open-eyed frame (applies to parked cursor and wander alike — but not
    // to the deliberate blink of the idle handoff).
    const resting = idle || parkedMs > PARK_DELAY_MS;
    if (resting && !blinking && target >= PARK_MIN && target <= PARK_MAX) {
      target = target < (PARK_MIN + PARK_MAX) / 2 ? PARK_LOW : PARK_HIGH;
    }
    if (idle) target = Math.max(IDLE_MIN, Math.min(IDLE_MAX, target));

    this.#current += (target - this.#current) * (1 - Math.exp(-dt * rate));

    // Always render the exact sub-frame position: the two nearest frames
    // crossfade — continuous at sweep speed and at drift speed alike.
    const drawIndex = this.#current;
    if (this.#dirty || Math.abs(drawIndex - this.#drawn) > 0.002) {
      this.#dirty = false;
      this.#render(drawIndex);
    }

    const near = Math.round(target);
    for (let d = -4; d <= 4; d++) this.#ensureDecoded(near + d);
    const here = Math.round(this.#current);
    for (let d = -2; d <= 2; d++) this.#ensureDecoded(here + d);

    this.#raf = requestAnimationFrame(this.#tick);
  };

  // Nearest loaded frame, preferring the requested one — a stand-in a frame
  // or two off beats a blank canvas while neighbors stream in.
  #drawable(index: number): HTMLImageElement | null {
    if (this.#state[index] >= 2) return this.#imgs[index];
    for (let d = 1; d < FRAME_COUNT; d++) {
      if (index - d >= 0 && this.#state[index - d] >= 2) return this.#imgs[index - d];
      if (index + d < FRAME_COUNT && this.#state[index + d] >= 2) return this.#imgs[index + d];
    }
    return null;
  }

  #render(drawIndex: number): void {
    const ctx = this.#ctx;
    const canvas = this.#canvas;
    if (!ctx || !canvas) return;
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, drawIndex));
    const lo = Math.floor(clamped);
    const hi = Math.min(FRAME_COUNT - 1, lo + 1);
    const alpha = clamped - lo;
    const imgLo = this.#drawable(lo);
    const imgHi = alpha > 0.003 ? this.#drawable(hi) : null;
    if (!imgLo) return;

    const { width: cw, height: ch } = canvas;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    // Mirror the poster's cover/contain media-query rule.
    const contain = cw / ch < 0.8 || cw / ch > 2.1;
    this.#paint(ctx, imgLo, cw, ch, contain, 1);
    if (imgHi && imgHi !== imgLo) this.#paint(ctx, imgHi, cw, ch, contain, alpha);

    this.#drawn = clamped;
    const attr = Math.round(clamped);
    if (attr !== this.#attrFrame) {
      this.#attrFrame = attr;
      this.setAttribute('data-frame', String(attr));
    }
    // The key light leans with the gaze (subtle — a few percent of stage width).
    this.#stage?.style.setProperty('--gaze', (clamped / (FRAME_COUNT - 1)).toFixed(3));
  }

  #paint(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    cw: number,
    ch: number,
    contain: boolean,
    alpha: number,
  ): void {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return;
    const scale = contain ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    ctx.globalAlpha = 1;
  }

  override render() {
    return (
      <figure class='stage'>
        <img
          class='poster'
          src={frameUrl(CENTER)}
          alt='The OpenElement dragon — it turns its head to watch your cursor.'
          draggable={false}
        />
        <canvas class='view' aria-hidden='true'></canvas>
        <video
          class='idle-view'
          src={IDLE_VIDEO_URL}
          muted={true}
          loop={true}
          playsinline={true}
          preload='none'
          aria-hidden='true'
        ></video>
        <i class='mote'></i><i class='mote'></i><i class='mote'></i><i class='mote'></i>
        <i class='mote'></i><i class='mote'></i><i class='mote'></i><i class='mote'></i>
      </figure>
    );
  }
}

defineCustomElement(tagName, DragonLiveGaze);
