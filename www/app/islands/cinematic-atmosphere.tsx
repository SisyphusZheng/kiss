/**
 * A progressive-enhancement atmosphere layer for the WWW hero.
 *
 * Content never depends on this island: it draws a small WebGL violet field
 * when the browser and motion preference allow it, and otherwise leaves the
 * CSS backdrop intact.
 */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';

export const tagName = 'open-cinematic-atmosphere';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { position: absolute; inset: 0; display: block; overflow: hidden; pointer-events: none; }
  canvas { width: 100%; height: 100%; display: block; opacity: .82; }
  @media (prefers-reduced-motion: reduce) { canvas { display: none; } }
`);

export default class CinematicAtmosphere extends OpenElement {
  static override styles = [sheet];
  #frame = 0;
  #contextLost = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(() => this.#start());
  }

  override disconnectedCallback(): void {
    cancelAnimationFrame(this.#frame);
    super.disconnectedCallback();
  }

  #start(): void {
    const canvas = this.shadowRoot?.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement) || this.#contextLost) return;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;
    const resize = () => {
      const scale = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.#contextLost = true;
      cancelAnimationFrame(this.#frame);
      observer.disconnect();
    }, { once: true });

    const started = performance.now();
    const render = (now: number) => {
      if (this.#contextLost || !this.isConnected) return;
      const t = (now - started) / 1000;
      const wave = .055 + Math.sin(t * .36) * .018;
      gl.clearColor(.16 + wave, .045, .34 + wave * 2, .22);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.#frame = requestAnimationFrame(render);
    };
    this.#frame = requestAnimationFrame(render);
  }

  override render() {
    return <canvas aria-hidden='true'></canvas>;
  }
}

defineCustomElement(tagName, CinematicAtmosphere);
