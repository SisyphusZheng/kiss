/** @jsxImportSource @openelement/element */
/** The public WWW flagship: view-source editorial, v4 language. */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import { OPENELEMENT_VERSION, PUBLISHED_PACKAGE_VERSION } from '../../data/version.ts';
import '@openelement/ui/open-code-block';
import '../../islands/cinematic-atmosphere.tsx';
import '../../islands/cinematic-scroll.tsx';

export const tagName = 'open-home-page';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display:block; color:var(--text-primary); background:var(--bg-base); }
  * { box-sizing:border-box; }
  h1,h2,h3,p { margin:0; }
  .home { overflow:clip; background:var(--bg-base); }

  /* ── hero: kinetic type, spec strip, standards marquee ── */
  .hero { position:relative; min-height:calc(100svh - var(--nav-height)); display:grid; align-content:end; padding:clamp(3rem,8vh,6rem) clamp(1.5rem,5vw,4.5rem) 0; background:radial-gradient(circle at 62% 78%, color-mix(in srgb,var(--violet-5) 20%,transparent), transparent 55%), var(--bg-base); isolation:isolate; }
  .hero::before { content:""; position:absolute; inset:0; z-index:-1; background-image:linear-gradient(color-mix(in srgb,var(--violet-6) 7%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--violet-6) 7%,transparent) 1px,transparent 1px); background-size:72px 72px; }
  .hero-ghost { position:absolute; right:-0.12em; top:-0.25em; z-index:-1; font-family:var(--font-mono); font-size:clamp(14rem,29vw,26rem); font-weight:800; letter-spacing:-0.06em; color:transparent; -webkit-text-stroke:1.5px color-mix(in srgb,var(--violet-6) 22%,transparent); user-select:none; pointer-events:none; }
  .eyebrow { display:flex; align-items:center; gap:.75rem; color:var(--violet-8); font-family:var(--font-mono); font-size:var(--font-size-00); font-weight:var(--font-weight-8); letter-spacing:.29em; text-transform:uppercase; }
  .eyebrow::before { content:""; width:2rem; height:2px; background:var(--brand); }
  .hero-stamp { position:absolute; top:clamp(3rem,8vh,6rem); right:clamp(1.5rem,5vw,4.5rem); color:var(--text-muted); font-size:var(--font-size-caption); letter-spacing:.08em; }
  h1 { margin:clamp(1.5rem,4vh,3rem) 0 0; font-weight:800; line-height:.92; letter-spacing:-.045em; }
  h1 .mono-line { display:block; font-size:clamp(3.4rem,10.4vw,9.4rem); color:var(--text-primary); }
  h1 .serif-line { display:block; margin-inline-start:clamp(2rem,24vw,22rem); font-family:var(--font-serif); font-style:italic; font-weight:400; font-size:clamp(4.2rem,15vw,13.5rem); letter-spacing:-.02em; color:var(--violet-8); }
  .lede { max-width:38rem; margin:clamp(1.5rem,3.5vh,2.5rem) 0 0; color:var(--text-secondary); font-size:clamp(1rem,1.2vw,1.1rem); line-height:1.75; }
  .actions { display:flex; flex-wrap:wrap; gap:var(--size-3); margin:var(--size-6) 0 clamp(2rem,6vh,4rem); }
  .action { display:inline-flex; align-items:center; padding:var(--size-2) var(--size-5); border:var(--border-size-1) solid var(--border-strong); border-radius:var(--btn-radius); color:var(--text-primary); font-weight:var(--font-weight-7); text-decoration:none; transition:border-color .15s ease,background .15s ease; }
  .action:hover { border-color:var(--brand); }
  .action.primary { background:var(--brand); border-color:var(--brand); color:var(--on-brand); }
  .action.primary:hover { background:var(--brand-hover); }
  .spec-strip { display:grid; grid-template-columns:repeat(5,1fr); border-block-start:1px solid var(--border); margin-inline:calc(clamp(1.5rem,5vw,4.5rem) * -1); }
  .spec-cell { padding:var(--size-4) clamp(1rem,2.5vw,2rem); border-inline-start:1px solid var(--border); }
  .spec-cell:first-child { border-inline-start:0; }
  .spec-cell small { display:block; color:var(--text-muted); font-size:var(--font-size-micro); letter-spacing:.16em; text-transform:uppercase; }
  .spec-cell strong { display:block; margin-block-start:var(--size-1); font-size:var(--font-size-1); font-weight:var(--font-weight-8); }
  .spec-cell strong.accent { color:var(--violet-8); }
  .marquee { overflow:hidden; white-space:nowrap; border-block:1px solid var(--border); background:var(--surface-1); margin-inline:calc(clamp(1.5rem,5vw,4.5rem) * -1); }
  .marquee span { display:inline-block; padding:var(--size-3) 0; color:var(--brand); font-size:var(--font-size-0); font-weight:var(--font-weight-5); letter-spacing:.12em; animation:marquee 36s linear infinite; }
  @keyframes marquee { to { transform:translateX(-50%); } }

  /* ── scene framework: outlined index anchors ── */
  .scene { position:relative; padding:clamp(4rem,10vh,8rem) clamp(1.5rem,5vw,4.5rem); }
  .scene-index { color:var(--brand); font-size:var(--font-size-00); font-weight:var(--font-weight-8); letter-spacing:.24em; text-transform:uppercase; }
  .scene h2 { font-size:clamp(2.2rem,3.6vw,3.2rem); font-weight:800; line-height:1; letter-spacing:-.03em; }
  .scene h2 .accent { display:block; font-family:var(--font-serif); font-style:italic; font-weight:400; font-size:calc(1em * 1.15); color:var(--violet-8); }
  .scene-copy { max-width:34rem; color:var(--text-secondary); line-height:1.75; }
  .scene-copy p + p { margin-block-start:var(--size-3); }
  .scene-outlined { position:absolute; top:clamp(1rem,4vh,3rem); left:clamp(-.5rem,-.4vw,0rem); z-index:-1; font-family:var(--font-mono); font-size:clamp(9rem,18vw,16rem); font-weight:800; line-height:1; color:transparent; -webkit-text-stroke:1.5px color-mix(in srgb,var(--violet-5) 55%,transparent); user-select:none; pointer-events:none; }
  .scene-split { display:grid; grid-template-columns:minmax(0,.9fr) minmax(320px,1.1fr); gap:clamp(2rem,6vw,6rem); align-items:center; }
  .badges { display:flex; gap:var(--size-2); margin-block-start:var(--size-5); }
  .badge { padding:2px var(--size-2); border:var(--border-size-1) solid var(--border-strong); border-radius:var(--badge-radius); color:var(--violet-8); font-size:var(--font-size-00); font-weight:var(--font-weight-7); letter-spacing:.06em; }

  /* ── §2 DSD: violet flood ── */
  .flood { background:linear-gradient(135deg,var(--violet-5),var(--violet-6)); color:var(--violet-0); }
  .flood .scene-index { color:var(--violet-1); }
  .flood h2 { color:var(--violet-0); }
  .flood h2 .accent { color:var(--violet-11); }
  .flood .scene-copy { color:var(--violet-1); }
  .flood-panels { display:grid; grid-template-columns:1fr auto 1fr; gap:clamp(1rem,3vw,2.5rem); align-items:center; margin-block-start:clamp(2rem,5vh,3.5rem); }
  .flood-panel { padding:var(--size-5); border:1.5px solid color-mix(in srgb,var(--violet-0) 70%,transparent); border-radius:var(--radius-2); background:color-mix(in srgb,var(--violet-0) 8%,transparent); }
  .flood-panel.solid { background:var(--violet-0); color:var(--violet-11); border-color:var(--violet-0); }
  .flood-panel small { display:block; margin-block-end:var(--size-3); font-size:var(--font-size-micro); font-weight:var(--font-weight-7); letter-spacing:.14em; text-transform:uppercase; opacity:.75; }
  .flood-panel code { display:block; font-size:var(--font-size-00); line-height:1.8; white-space:pre; }
  .flood-arrow { font-size:var(--font-size-5); color:var(--violet-0); }
  .shadow-outline { display:inline-block; margin-block-end:var(--size-2); padding:var(--size-1) var(--size-3); border:1.5px dashed var(--violet-8); border-radius:var(--radius-1); color:var(--violet-8); font-size:var(--font-size-00); }

  /* ── §3 islands: outlined strategy columns ── */
  .strategies { display:grid; grid-template-columns:repeat(4,1fr); margin-block-start:clamp(2rem,5vh,3rem); border-block:1px solid var(--border); }
  .strategy { padding:var(--size-5) var(--size-4); border-inline-start:1px solid var(--border); }
  .strategy:first-child { border-inline-start:0; }
  .strategy.default { background:color-mix(in srgb,var(--brand) 14%,transparent); }
  .strategy .glyph { display:block; font-family:var(--font-mono); font-size:clamp(3.5rem,7vw,6.5rem); font-weight:800; line-height:1; color:transparent; -webkit-text-stroke:1.5px color-mix(in srgb,var(--violet-5) 65%,transparent); }
  .strategy.default .glyph { -webkit-text-stroke-color:var(--violet-8); }
  .strategy strong { display:block; margin-block-start:var(--size-3); font-size:var(--font-size-2); font-weight:var(--font-weight-8); }
  .strategy .tag-default { display:inline-block; margin-inline-start:var(--size-2); padding:1px var(--size-2); border-radius:var(--badge-radius); background:var(--brand); color:var(--on-brand); font-size:var(--font-size-micro); font-weight:var(--font-weight-7); letter-spacing:.1em; vertical-align:middle; }
  .strategy p { margin-block-start:var(--size-2); color:var(--text-secondary); font-size:var(--font-size-00); line-height:1.6; }
  .strategy footer { margin-block-start:var(--size-3); color:var(--text-muted); font-size:var(--font-size-micro); }

  /* ── §4 output: typographic rows ── */
  .output-rows { margin-block-start:clamp(2rem,5vh,3rem); border-block-start:1px solid var(--border); }
  .output-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:clamp(1rem,4vw,3rem); padding:var(--size-4) clamp(1rem,3vw,2.5rem); border-block-end:1px solid var(--border); }
  .output-row.active { background:var(--brand); color:var(--on-brand); }
  .output-row .name { font-size:clamp(2.2rem,4vw,3.5rem); font-weight:800; letter-spacing:-.02em; line-height:1; }
  .output-row .desc { max-width:22rem; color:var(--text-secondary); font-size:var(--font-size-00); line-height:1.6; }
  .output-row.active .desc { color:var(--violet-9); }
  .output-row .arrow { font-size:var(--font-size-6); color:var(--violet-5); }
  .output-row.active .arrow { color:var(--violet-0); }

  /* ── §5 begin ── */
  .begin { text-align:center; padding-block:clamp(5rem,12vh,9rem); }
  .begin h2 { font-family:var(--font-serif); font-style:italic; font-weight:400; font-size:clamp(4rem,8vw,7rem); color:var(--violet-8); }
  .begin .command { display:inline-flex; align-items:center; gap:var(--size-4); margin-block-start:var(--size-6); padding:var(--size-3) var(--size-5); border:var(--border-size-1) solid var(--border); border-radius:var(--radius-2); background:var(--surface-code); color:var(--text-primary); font-size:var(--font-size-0); }
  .begin .command code { color:var(--success); }
  .begin .actions { justify-content:center; margin-block-end:0; }

  /* ── reference links ── */
  .reference { padding:clamp(3rem,8vh,6rem) clamp(1.5rem,5vw,4.5rem); border-block-start:1px solid var(--border); }
  .reference header { display:flex; justify-content:space-between; gap:2rem; align-items:end; margin-block-end:var(--size-6); }
  .reference h2 { font-size:clamp(2rem,4vw,4rem); letter-spacing:-.04em; line-height:1; }
  .reference header p { max-width:30rem; color:var(--text-secondary); line-height:1.5; }
  .links { display:grid; grid-template-columns:repeat(4,1fr); border:1px solid var(--border); }
  .links a { display:grid; gap:var(--size-2); min-height:160px; padding:var(--size-5); border-inline-end:1px solid var(--border); color:inherit; text-decoration:none; background:color-mix(in srgb,var(--bg-elevated) 55%,transparent); transition:background .2s ease,transform .2s ease; }
  .links a:last-child { border-inline-end:0; }
  .links a:hover { background:color-mix(in srgb,var(--violet-5) 18%,var(--bg-elevated)); transform:translateY(-4px); }
  .links span { color:transparent; -webkit-text-stroke:1px var(--violet-8); font-family:var(--font-mono); font-size:var(--font-size-4); font-weight:800; line-height:1; }
  .links strong { font-size:var(--font-size-2); }
  .links small { color:var(--text-secondary); line-height:1.4; }

  @supports (animation-timeline:view()) {
    .scene-copy,.scene-art,.strategy,.output-row { animation:scene-in linear both; animation-timeline:view(); animation-range:entry 8% cover 32%; }
  }
  @keyframes scene-in { from { opacity:.12; transform:translateY(8vh); } to { opacity:1; transform:none; } }
  @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none!important; scroll-behavior:auto!important; } }

  @media (max-width:900px) {
    .scene-split { grid-template-columns:1fr; }
    .strategies { grid-template-columns:1fr 1fr; }
    .strategy:nth-child(3) { border-inline-start:0; }
    .spec-strip { grid-template-columns:1fr 1fr; }
    .spec-cell:nth-child(odd) { border-inline-start:0; }
    .flood-panels { grid-template-columns:1fr; }
    .flood-arrow { transform:rotate(90deg); justify-self:center; }
    .links { grid-template-columns:1fr 1fr; }
    .links a:nth-child(2) { border-inline-end:0; }
  }
  @media (max-width:520px) {
    h1 .serif-line { margin-inline-start:0; }
    .hero-stamp { display:none; }
    .output-row { grid-template-columns:1fr; gap:var(--size-2); }
    .links { grid-template-columns:1fr; }
    .links a { border-inline-end:0; border-block-end:1px solid var(--border); }
    .links a:last-child { border-block-end:0; }
  }
`);

const strategies = [
  [
    'L',
    'load',
    '',
    'Critical interactivity, hydrated immediately after parse.',
    'nav · search · theme',
  ],
  [
    'I',
    'idle',
    'DEFAULT',
    'Upgrades when the browser is idle — never blocks paint.',
    'counters · forms',
  ],
  [
    'V',
    'visible',
    '',
    'IntersectionObserver gates hydration until scroll-in.',
    'comments · charts',
  ],
  ['O', 'only', '', 'Client-only, for what the server cannot know.', 'webgl · media'],
] as const;

const outputs = [
  ['BROWSER', 'Pure static HTML + DSD. CDN-ready, no runtime.', false],
  ['NODE', 'Nitro server output with ISR manifests baked in.', true],
  ['WORKERS', 'Edge deploys from the same page model. Proof gate per release.', false],
] as const;

const references = [
  [
    '01',
    'Get started',
    '/guide/getting-started',
    'Create a real app from the supported public interface.',
  ],
  ['02', 'API reference', '/apilist', 'Inspect the five-package surface and optional primitives.'],
  [
    '03',
    'Architecture',
    '/architecture/architecture',
    'Follow the element, app and build contracts.',
  ],
  ['04', 'Roadmap', '/roadmap', 'See current truth and the next product boundary.'],
] as const;

const marqueeText =
  'CUSTOM ELEMENTS ✳ SHADOW DOM ✳ DECLARATIVE SHADOW DOM ✳ ES MODULES ✳ SIGNALS ✳ HTML FIRST ✳ ';

const content = {
  en: {
    lede:
      'A Web Components-native application framework — beautiful, static-first applications composed from real browser primitives.',
    startBuilding: 'Start building',
    watchUnfold: 'Watch it unfold',
    getStarted: 'Get started',
    readGuide: 'Read the guide',
    specVersion: 'Version',
    specGraph: 'Graph',
    specEngines: 'Engines',
    specDeps: 'Framework deps',
    specOutput: 'Server output',
    begin: 'Begin.',
    facts: 'Facts behind the feeling',
    continueComposition: 'Continue the composition.',
    referenceCopy:
      'Every scene is grounded in the public product surface, architecture and release truth — not a decorative fiction.',
  },
  zh: {
    lede: 'Web Components 原生应用框架——用真实的浏览器原语，组合出美观的 static-first 应用。',
    startBuilding: '开始构建',
    watchUnfold: '看它展开',
    getStarted: '快速开始',
    readGuide: '阅读指南',
    specVersion: '版本',
    specGraph: '包图',
    specEngines: '浏览器引擎',
    specDeps: '框架依赖',
    specOutput: '服务端输出',
    begin: '开始。',
    facts: '感觉背后的事实',
    continueComposition: '继续这场组合。',
    referenceCopy: '每一个场景都立足于公开产品面、架构与发布真相——不是装饰性的虚构。',
  },
} as const;

export class DocsHome extends OpenElement {
  static override styles = [sheet];

  override render() {
    const t = content[this._getLocale('en') === 'zh' ? 'zh' : 'en'];
    return (
      <main class='home'>
        <open-cinematic-scroll></open-cinematic-scroll>
        <section class='hero'>
          <open-cinematic-atmosphere></open-cinematic-atmosphere>
          <span class='hero-ghost' aria-hidden='true'>&lt;/&gt;</span>
          <span class='hero-stamp'>EST. 2026 / SPEC-041</span>
          <p class='eyebrow'>OpenElement — Web Standards Lab</p>
          <h1>
            <span class='mono-line'>THE WEB,</span>
            <span class='serif-line'>composed.</span>
          </h1>
          <p class='lede'>
            {t.lede}
          </p>
          <div class='actions'>
            <a class='action primary' href='/guide/getting-started'>{t.startBuilding}</a>
            <a class='action' href='#element'>{t.watchUnfold}</a>
          </div>
          <div class='spec-strip'>
            <div class='spec-cell'>
              <small>{t.specVersion}</small>
              <strong>{PUBLISHED_PACKAGE_VERSION} — stable</strong>
              <small>{OPENELEMENT_VERSION} source</small>
            </div>
            <div class='spec-cell'>
              <small>{t.specGraph}</small>
              <strong>five packages</strong>
            </div>
            <div class='spec-cell'>
              <small>{t.specEngines}</small>
              <strong>3 in CI</strong>
            </div>
            <div class='spec-cell'>
              <small>{t.specDeps}</small>
              <strong class='accent'>zero</strong>
            </div>
            <div class='spec-cell'>
              <small>{t.specOutput}</small>
              <strong>DSD default</strong>
            </div>
          </div>
          <div class='marquee' aria-hidden='true'>
            <span>{marqueeText + marqueeText}</span>
          </div>
        </section>

        <section class='scene scene-split' id='element'>
          <span class='scene-outlined' aria-hidden='true'>01</span>
          <div class='scene-copy'>
            <p class='scene-index'>§1 — Element</p>
            <h2>
              One durable
              <span class='accent'>contract.</span>
            </h2>
            <p>
              Custom Elements are the application component contract — not a renderer integration,
              not a leaf-widget format. Write the element once; it renders on the server and
              upgrades in the browser.
            </p>
            <div class='badges'>
              <span class='badge'>ZERO RUNTIME</span>
              <span class='badge'>JSX + BASIC</span>
            </div>
          </div>
          <div class='scene-art'>
            <open-code-block>
              <pre><code>{`import { defineElement } from '@openelement/element'

export const Counter = defineElement('open-counter', {
  render: (props) => (
    <button type="button">Count: {props.count ?? 0}</button>
  ),
})

// SSR: <open-counter count="0"> + DSD shadow root.
// No JavaScript required for first paint.`}</code></pre>
            </open-code-block>
          </div>
        </section>

        <section class='scene flood'>
          <p class='scene-index'>§2 — Declarative Shadow DOM</p>
          <h2>
            The server writes HTML.
            <span class='accent'>The browser upgrades it.</span>
          </h2>
          <div class='scene-copy'>
            <p>
              DSD is the default server output. No client re-render, no double payload — the markup
              is the application.
            </p>
          </div>
          <div class='flood-panels'>
            <div class='flood-panel'>
              <small>Server · text/html</small>
              <code>
                {`<open-counter count="0">
  <template shadowrootmode="open">
    <button>0</button>
  </template>`}
              </code>
            </div>
            <span class='flood-arrow' aria-hidden='true'>⟶</span>
            <div class='flood-panel solid'>
              <small>Browser · upgrades in place</small>
              <span class='shadow-outline'>#shadow-root (open)</span>
              <code>
                {`└─ <button> → signal bound
   first paint = interactive`}
              </code>
            </div>
          </div>
        </section>

        <section class='scene'>
          <p class='scene-index'>§3 — Islands</p>
          <h2>
            Upgrade
            <span class='accent'>selectively.</span>
          </h2>
          <div class='scene-copy'>
            <p>
              Interactive regions hydrate on your schedule. The rest of the page never ships a byte
              of JavaScript.
            </p>
          </div>
          <div class='strategies'>
            {strategies.map(([glyph, name, tag, copy, uses]) => (
              <div class={`strategy${tag ? ' default' : ''}`}>
                <span class='glyph' aria-hidden='true'>{glyph}</span>
                <strong>
                  {name}
                  {tag && <span class='tag-default'>{tag}</span>}
                </strong>
                <p>{copy}</p>
                <footer>{uses}</footer>
              </div>
            ))}
          </div>
        </section>

        <section class='scene'>
          <p class='scene-index'>§4 — Output</p>
          <h2>
            Static first.
            <span class='accent'>Deployable anywhere.</span>
          </h2>
          <div class='output-rows'>
            {outputs.map(([name, desc, active]) => (
              <div class={`output-row${active ? ' active' : ''}`}>
                <span class='name'>{name}</span>
                <span class='desc'>{desc}</span>
                <span class='arrow' aria-hidden='true'>→</span>
              </div>
            ))}
          </div>
        </section>

        <section class='scene begin'>
          <p class='scene-index'>§5 — Begin</p>
          <h2>{t.begin}</h2>
          <div class='command'>
            <code>$</code>
            <span>deno run -A npm:@openelement/create my-app</span>
          </div>
          <div class='actions'>
            <a class='action primary' href='/guide/getting-started'>{t.getStarted}</a>
            <a class='action' href='/docs'>{t.readGuide}</a>
          </div>
        </section>

        <section class='reference'>
          <header>
            <div>
              <p class='scene-index'>{t.facts}</p>
              <h2>{t.continueComposition}</h2>
            </div>
            <p>{t.referenceCopy}</p>
          </header>
          <div class='links'>
            {references.map(([index, title, href, copy]) => (
              <a href={href}>
                <span aria-hidden='true'>{index}</span>
                <strong>{title}</strong>
                <small>{copy}</small>
              </a>
            ))}
          </div>
        </section>
      </main>
    );
  }
}

defineCustomElement(tagName, DocsHome);
export default DocsHome;
