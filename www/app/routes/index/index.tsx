/** @jsxImportSource @openelement/element */
/** The public WWW flagship: a real-DOM, progressively enhanced product film. */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import { OPENELEMENT_VERSION } from '../../data/version.ts';
import '../../islands/cinematic-atmosphere.tsx';
import '../../islands/cinematic-scroll.tsx';

export const tagName = 'open-home-page';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display:block; color:var(--text-primary); background:var(--bg-base); }
  * { box-sizing:border-box; }
  h1,h2,h3,p { margin:0; }
  .home { overflow:clip; background:radial-gradient(circle at 50% 0%, color-mix(in srgb,var(--violet-4) 16%,transparent), transparent 34rem),var(--bg-base); }
  .film-grid { background-image:linear-gradient(color-mix(in srgb,var(--violet-6) 9%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--violet-6) 9%,transparent) 1px,transparent 1px); background-size:72px 72px; }
  .film { position:relative; min-height:calc(100svh - var(--nav-height)); isolation:isolate; border-block-end:1px solid color-mix(in srgb,var(--violet-6) 35%,var(--border)); }
  .hero { position:relative; z-index:1; display:grid; grid-template-columns:minmax(0,1.02fr) minmax(340px,.98fr); align-items:center; gap:clamp(2rem,7vw,9rem); width:min(1440px,100%); min-height:calc(100svh - var(--nav-height)); margin:auto; padding:clamp(5rem,10vh,9rem) clamp(1.5rem,6vw,7rem) 4rem; }
  .eyebrow,.scene-index,.tag { color:var(--violet-8); font-family:var(--font-mono); font-size:var(--font-size-00); font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
  .eyebrow { display:flex; align-items:center; gap:.75rem; margin-block-end:1.5rem; }
  .eyebrow::before { content:""; width:2.5rem; border-block-start:1px solid currentColor; }
  h1 { max-width:760px; font-size:clamp(4.1rem,10vw,10.5rem); font-weight:900; line-height:.82; letter-spacing:-.075em; text-wrap:balance; }
  .lede { max-width:620px; margin-block:2rem; color:var(--text-secondary); font-size:clamp(1.12rem,1.6vw,1.45rem); line-height:1.5; text-wrap:pretty; }
  .actions { display:flex; flex-wrap:wrap; gap:.8rem; align-items:center; }
  .action { display:inline-flex; align-items:center; justify-content:center; min-height:3.25rem; padding:0 1.2rem; border:1px solid color-mix(in srgb,var(--text-primary) 42%,transparent); border-radius:999px; color:var(--text-primary); background:color-mix(in srgb,var(--bg-base) 56%,transparent); font-weight:700; text-decoration:none; transition:transform .22s var(--ease-3),background .22s var(--ease-3),border-color .22s var(--ease-3); }
  .action:hover,.action:focus-visible { transform:translateY(-3px); border-color:var(--violet-7); background:color-mix(in srgb,var(--violet-5) 22%,var(--bg-base)); outline:none; }
  .action.primary { border-color:var(--violet-7); background:linear-gradient(120deg,var(--violet-6),var(--violet-4)); color:#fff; box-shadow:0 16px 45px color-mix(in srgb,var(--violet-6) 42%,transparent); }
  .version { display:block; margin-block-start:1.1rem; color:var(--text-muted); font-family:var(--font-mono); font-size:var(--font-size-00); }
  .aperture-stage { position:relative; aspect-ratio:1; width:min(100%,680px); margin-inline:auto; transform-style:preserve-3d; }
  .aperture { position:absolute; inset:10%; display:grid; place-items:center; border:1px solid color-mix(in srgb,var(--violet-7) 66%,transparent); border-radius:50%; background:radial-gradient(circle at 31% 28%,color-mix(in srgb,var(--violet-5) 32%,transparent),transparent 31%),radial-gradient(circle at 68% 70%,color-mix(in srgb,var(--violet-9) 32%,transparent),transparent 45%); box-shadow:inset 0 0 90px color-mix(in srgb,var(--violet-7) 18%,transparent),0 0 120px color-mix(in srgb,var(--violet-7) 22%,transparent); animation:orbit 12s linear infinite; }
  .aperture::before,.aperture::after { content:""; position:absolute; border:1px solid color-mix(in srgb,var(--violet-6) 40%,transparent); border-radius:50%; }
  .aperture::before { inset:8%; } .aperture::after { inset:22%; }
  .mark { position:relative; z-index:1; color:var(--text-primary); font-family:var(--font-mono); font-size:clamp(3rem,7vw,6.8rem); font-weight:800; letter-spacing:-.09em; text-shadow:0 0 36px color-mix(in srgb,var(--violet-6) 55%,transparent); }
  .mark b { color:var(--violet-8); }
  .orbit { position:absolute; inset:0; border:1px dashed color-mix(in srgb,var(--violet-6) 24%,transparent); border-radius:50%; animation:reverse-orbit 20s linear infinite; }
  .node { position:absolute; display:grid; place-items:center; width:3.2rem; aspect-ratio:1; border:1px solid color-mix(in srgb,var(--violet-6) 62%,transparent); border-radius:50%; background:color-mix(in srgb,var(--bg-base) 70%,transparent); color:var(--violet-8); font-family:var(--font-mono); font-size:.72rem; box-shadow:0 0 22px color-mix(in srgb,var(--violet-7) 24%,transparent); }
  .node.one { inset:9% auto auto 13%; }.node.two { inset:auto 5% 17% auto; }.node.three { inset:44% auto auto -3%; }
  .scroll-cue { position:absolute; inset:auto 0 1.5rem; z-index:1; display:flex; justify-content:center; gap:.7rem; color:var(--text-muted); font-family:var(--font-mono); font-size:.72rem; letter-spacing:.1em; text-transform:uppercase; }
  .scroll-cue::after { content:"↓"; color:var(--violet-8); animation:bob 1.6s ease-in-out infinite; }
  .scenes { position:relative; }
  .scene { position:relative; display:grid; grid-template-columns:minmax(0,.45fr) minmax(0,.55fr); align-items:center; min-height:100svh; gap:clamp(2rem,8vw,10rem); padding:clamp(4.5rem,12vh,9rem) clamp(1.5rem,8vw,10rem); border-block-end:1px solid color-mix(in srgb,var(--violet-6) 25%,var(--border)); }
  .scene-copy { max-width:540px; }.scene-index { margin-block-end:1.2rem; }.scene h2 { font-size:clamp(2.8rem,5.8vw,6.8rem); line-height:.9; letter-spacing:-.065em; text-wrap:balance; }.scene p:not(.scene-index) { margin-block-start:1.6rem; color:var(--text-secondary); font-size:clamp(1rem,1.4vw,1.22rem); line-height:1.55; }
  .scene-art { position:relative; min-height:min(62vw,660px); display:grid; place-items:center; perspective:1000px; }
  .component-stack { display:grid; width:min(100%,560px); transform:rotateX(8deg) rotateY(-12deg); transform-style:preserve-3d; }
  .component { position:relative; display:grid; gap:.8rem; padding:1.4rem; border:1px solid color-mix(in srgb,var(--violet-6) 45%,var(--border)); background:linear-gradient(135deg,color-mix(in srgb,var(--violet-4) 18%,var(--bg-elevated)),color-mix(in srgb,var(--bg-base) 84%,transparent)); box-shadow:0 25px 65px color-mix(in srgb,var(--violet-11) 45%,transparent); font-family:var(--font-mono); transform:translateZ(var(--depth,0)); }
  .component:nth-child(2) { margin:1.4rem 0 0 3rem; --depth:45px; }.component:nth-child(3) { margin:1.4rem 0 0 6rem; --depth:90px; }.component strong { color:var(--violet-8); }.component span { color:var(--text-secondary); font-size:.84rem; }
  .pulse-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; width:min(100%,560px); }.island { display:grid; place-items:center; min-height:150px; border:1px solid color-mix(in srgb,var(--violet-6) 42%,var(--border)); border-radius:1.1rem; background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--violet-6) 25%,transparent),transparent 60%),var(--bg-elevated); color:var(--text-primary); font-family:var(--font-mono); animation:pulse 3s ease-in-out infinite; }.island:nth-child(2){animation-delay:-1s}.island:nth-child(3){animation-delay:-2s}.island small{color:var(--violet-8)}
  .output { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; width:min(100%,620px); }.target { min-height:230px; display:grid; align-content:space-between; padding:1.25rem; border:1px solid color-mix(in srgb,var(--violet-6) 43%,var(--border)); background:linear-gradient(145deg,color-mix(in srgb,var(--violet-5) 18%,transparent),var(--bg-elevated)); box-shadow:0 18px 50px color-mix(in srgb,var(--violet-10) 38%,transparent); }.target svg{width:42px;color:var(--violet-8)}.target strong{font-size:1.1rem}.target span{color:var(--text-secondary);font-family:var(--font-mono);font-size:.75rem}
  .final { grid-template-columns:1fr; text-align:center; min-height:82svh; }.final .scene-copy { max-width:800px; margin:auto; }.command { display:flex; align-items:center; justify-content:space-between; gap:1rem; width:min(100%,680px); margin:2.5rem auto; padding:1rem 1.1rem 1rem 1.35rem; border:1px solid color-mix(in srgb,var(--violet-6) 52%,var(--border)); border-radius:999px; background:color-mix(in srgb,var(--bg-elevated) 72%,transparent); color:var(--violet-8); font-family:var(--font-mono); text-align:left; }.command code{overflow:auto;white-space:nowrap}.final-actions{justify-content:center}
  .reference { width:min(1180px,calc(100% - 3rem)); margin:0 auto; padding:7rem 0; }.reference header{display:flex;justify-content:space-between;gap:2rem;align-items:end;margin-block-end:2rem}.reference h2{font-size:clamp(2.2rem,4vw,4.5rem);letter-spacing:-.06em;line-height:.92}.reference p{max-width:500px;color:var(--text-secondary);line-height:1.5}.links{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--border)}.links a{display:grid;gap:.6rem;min-height:180px;padding:1.4rem;border-inline-end:1px solid var(--border);color:inherit;text-decoration:none;background:color-mix(in srgb,var(--bg-elevated) 55%,transparent);transition:background .2s ease,transform .2s ease}.links a:last-child{border:0}.links a:hover{background:color-mix(in srgb,var(--violet-5) 18%,var(--bg-elevated));transform:translateY(-4px)}.links span{color:var(--violet-8);font-family:var(--font-mono);font-size:.75rem}.links strong{font-size:1.25rem}.links small{color:var(--text-secondary);line-height:1.4}
  .cinematic-v2 { --film-progress:0; --scene-progress:0; --pointer-x:0; --pointer-y:0; position:relative; }
  .cinematic-v2 .film { position:sticky; top:0; z-index:0; }
  .cinematic-v2 .hero > div:first-child { opacity:clamp(0,calc(1 - var(--film-progress) * 3.2),1); transform:translateY(calc(var(--film-progress) * -4vh)); }
  .hero-mark-wrap { position:relative; z-index:3; display:grid; place-items:center; width:clamp(15rem,34vw,31rem); aspect-ratio:1; background:url('/assets/open-favicon.svg') center/contain no-repeat; filter:drop-shadow(0 0 70px color-mix(in srgb,var(--violet-6) 48%,transparent)); transform:translate3d(calc(min(calc(var(--film-progress) * 2.4),1) * -48vw + var(--pointer-x) * 8px),calc(min(calc(var(--film-progress) * 2.4),1) * -42vh + var(--pointer-y) * 8px),0) scale(calc(1 - min(calc(var(--film-progress) * 2.4),1) * .82)); transform-origin:center; will-change:transform; }
  .hero-mark { --mark-size:clamp(15rem,34vw,31rem); opacity:0; }
  .cinematic-v2 .scenes { position:relative; z-index:2; margin-block-start:100vh; }
  .cinematic-v2 .scene { background:linear-gradient(90deg,color-mix(in srgb,var(--bg-base) 96%,transparent),color-mix(in srgb,var(--bg-base) 72%,transparent)); backdrop-filter:blur(2px); }
  .cinematic-v2 .component-stack { transform:rotateX(calc(18deg - var(--film-progress) * 12deg)) rotateY(calc(-24deg + var(--film-progress) * 18deg)) translateZ(calc(var(--film-progress) * 90px)); }
  .cinematic-v2 .island { animation-timeline:view(block 15% 15%); animation-name:pulse; }
  @supports (animation-timeline:view()) { .scene-copy,.scene-art { animation:scene-in linear both; animation-timeline:view(); animation-range:entry 12% cover 44%; } }
  @keyframes scene-in { from{opacity:.08;transform:translateY(12vh) scale(.94)} to{opacity:1;transform:none} }
  @keyframes orbit{50%{transform:rotate(12deg) scale(1.035)}} @keyframes reverse-orbit{to{transform:rotate(-360deg)}} @keyframes bob{50%{transform:translateY(5px)}} @keyframes pulse{50%{border-color:var(--violet-8);box-shadow:0 0 38px color-mix(in srgb,var(--violet-6) 36%,transparent)}}
  @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;scroll-behavior:auto!important}.film,.scene{min-height:auto}.hero{min-height:auto}.scene{padding-block:6rem}.component-stack{transform:none}}
  @media (max-width:800px){.hero,.scene{grid-template-columns:1fr;min-height:auto;padding:6rem 1.4rem}.hero{padding-block-start:5rem}.aperture-stage{width:min(92vw,540px)}.scene-art{min-height:420px}.component:nth-child(2){margin-inline-start:1.5rem}.component:nth-child(3){margin-inline-start:3rem}.output{grid-template-columns:1fr 1fr}.target:last-child{grid-column:span 2}.links{grid-template-columns:1fr 1fr}.links a:nth-child(2){border-inline-end:0}.links a:nth-child(-n+2){border-block-end:1px solid var(--border)}}
  @media (max-width:480px){h1{font-size:clamp(3.6rem,18vw,5.6rem)}.pulse-grid{gap:.65rem}.island{min-height:105px;font-size:.72rem}.output{grid-template-columns:1fr}.target:last-child{grid-column:auto;min-height:150px}.command{border-radius:1.1rem;align-items:start;flex-direction:column}.links{grid-template-columns:1fr}.links a{border-inline-end:0;border-block-end:1px solid var(--border)}.links a:last-child{border-block-end:0}.reference header{display:grid}.scene h2{font-size:clamp(2.8rem,13vw,4.4rem)}}
`);

const references = [
  ['01', 'Get started', '/guide/getting-started', 'Create a real app from the supported public interface.'],
  ['02', 'API reference', '/apilist', 'Inspect the five-package surface and optional primitives.'],
  ['03', 'Architecture', '/architecture/architecture', 'Follow the element, app and build contracts.'],
  ['04', 'Roadmap', '/roadmap', 'See current truth and the next product boundary.'],
] as const;

export class DocsHome extends OpenElement {
  static override styles = [sheet];

  override render() {
    return <main class='home cinematic-v2'>
      <open-cinematic-scroll></open-cinematic-scroll>
      <section class='film film-grid'>
        <open-cinematic-atmosphere></open-cinematic-atmosphere>
        <div class='hero'>
          <div>
            <p class='eyebrow'>OpenElement / Web Standards Lab</p>
            <h1>The Web,<br />composed.</h1>
            <p class='lede'>A Web Components-native application framework for beautiful, static-first applications — composed from real browser primitives.</p>
            <div class='actions'><a class='action primary' href='/guide/getting-started'>Start building</a><a class='action' href='#element'>Watch it unfold</a></div>
            <small class='version'>Published line: {OPENELEMENT_VERSION}</small>
          </div>
          <div class='aperture-stage' aria-label='OpenElement brand mark visual'>
            <div class='orbit'></div><div class='aperture'><div class='hero-mark-wrap'><open-brand-mark class='hero-mark' size='xl'></open-brand-mark></div></div>
            <span class='node one'>DSD</span><span class='node two'>APP</span><span class='node three'>WC</span>
          </div>
        </div>
        <div class='scroll-cue'>Scroll to compose</div>
      </section>

      <div class='scenes'>
        <section class='scene' id='element'>
          <div class='scene-copy'><p class='scene-index'>01 / Element</p><h2>Start with a native boundary.</h2><p>A reusable element is not an abstraction to escape the web. It is the durable, inspectable contract your application is built from.</p></div>
          <div class='scene-art'><div class='component-stack'><div class='component'><strong>&lt;open-app&gt;</strong><span>application shell / browser-native</span></div><div class='component'><strong>&lt;open-page&gt;</strong><span>route descriptor / static render</span></div><div class='component'><strong>&lt;open-card&gt;</strong><span>custom element / light from shadow</span></div></div></div>
        </section>
        <section class='scene'>
          <div class='scene-copy'><p class='scene-index'>02 / DSD</p><h2>Give every component its own room.</h2><p>Declarative Shadow DOM preserves real component boundaries in the document. What ships is still HTML: visible, inspectable and ready before client JavaScript.</p></div>
          <div class='scene-art'><div class='component-stack'><div class='component'><strong>&lt;template shadowrootmode="open"&gt;</strong><span>shadow root attached by the browser</span></div><div class='component'><strong>slot="content"</strong><span>encapsulation without an invented runtime</span></div><div class='component'><strong>&lt;/template&gt;</strong><span>rendered once, understood everywhere</span></div></div></div>
        </section>
        <section class='scene'>
          <div class='scene-copy'><p class='scene-index'>03 / Islands</p><h2>Wake only what needs to move.</h2><p>Static composition remains still. Small islands light up exactly where interaction earns its cost, keeping the rest of the page close to the platform.</p></div>
          <div class='scene-art'><div class='pulse-grid'><div class='island'><span>static<br /><small>0 JS</small></span></div><div class='island'><span>visible<br /><small>island</small></span></div><div class='island'><span>idle<br /><small>island</small></span></div></div></div>
        </section>
        <section class='scene'>
          <div class='scene-copy'><p class='scene-index'>04 / Output</p><h2>One composition. Portable output.</h2><p>The same supported build interface produces static output proven for browser delivery, Node and Workers. The deployment target changes; the component contract does not.</p></div>
          <div class='scene-art'><div class='output'><article class='target'><span>01</span><strong>Browser</strong><span>HTML · DSD · islands</span></article><article class='target'><span>02</span><strong>Node</strong><span>SSR admission · output proof</span></article><article class='target'><span>03</span><strong>Workers</strong><span>portable deployment · standards</span></article></div></div>
        </section>
        <section class='scene final'><div class='scene-copy'><p class='scene-index'>05 / Begin</p><h2>Compose your next application in the open.</h2><p>Use the public starter, author the parts that matter, and let the browser keep the rest honest.</p><div class='command'><code>$ deno run -A npm:@openelement/create my-app</code><a class='action primary' href='/guide/getting-started'>Start building</a></div><div class='actions final-actions'><a class='action' href='/docs'>Explore docs</a><a class='action' href='/architecture/architecture'>See architecture</a></div></div></section>
      </div>
      <section class='reference'><header><div><p class='scene-index'>Continue the composition</p><h2>Facts behind the feeling.</h2></div><p>Every scene is grounded in the public product surface, architecture and release truth — not a decorative fiction.</p></header><div class='links'>{references.map(([index,title,href,copy]) => <a href={href}><span>{index}</span><strong>{title}</strong><small>{copy}</small></a>)}</div></section>
    </main>;
  }
}

defineCustomElement(tagName, DocsHome);
export default DocsHome;
