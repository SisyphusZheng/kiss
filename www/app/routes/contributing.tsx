/**
 * Contributing Page - v4 lab page: mono/serif masthead, setup terminal,
 * PR checklist, numbered help rows, and a questions-first callout.
 */
export const meta = { section: '', label: 'Contributing', order: 30 };
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-code-block';
import '@openelement/ui/open-button';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
    background: var(--bg-base);
  }

  * {
    box-sizing: border-box;
  }

  h1,
  h2,
  p,
  ol,
  ul {
    margin: 0;
  }

  /* ── masthead: mono "BUILD IT" + serif "with us." ── */
  .masthead {
    position: relative;
    isolation: isolate;
    padding: clamp(4rem, 11vh, 8rem) clamp(1.5rem, 5vw, 4.5rem) clamp(2.5rem, 6vh, 4.5rem);
  }

  .masthead::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image:
      linear-gradient(color-mix(in srgb, var(--violet-6) 7%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--violet-6) 7%, transparent) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: linear-gradient(180deg, black, transparent);
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--violet-8);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0.29em;
    text-transform: uppercase;
  }

  .eyebrow::before {
    content: "";
    width: 2rem;
    height: 2px;
    background: var(--brand);
  }

  h1 {
    margin-block-start: clamp(1.5rem, 4vh, 3rem);
    line-height: 0.92;
  }

  h1 .mono-line {
    display: block;
    font-family: var(--font-mono);
    font-weight: 800;
    font-size: clamp(3rem, 8vw, 7rem);
    letter-spacing: -0.05em;
    color: var(--text-primary);
  }

  h1 .serif-line {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(3.4rem, 9vw, 8rem);
    letter-spacing: -0.02em;
    color: var(--violet-8);
  }

  .lede {
    max-width: 38rem;
    margin-block-start: clamp(1.25rem, 3vh, 2rem);
    color: var(--text-secondary);
    font-size: clamp(1rem, 1.2vw, 1.1rem);
    line-height: 1.75;
  }

  .section-label {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  /* ── setup: terminal card + release line | PR checklist ── */
  .setup {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: clamp(2rem, 6vw, 6rem);
    padding: clamp(2.5rem, 6vh, 4.5rem) clamp(1.5rem, 5vw, 4.5rem);
    border-block-start: 1px solid var(--border);
  }

  .setup-col {
    display: grid;
    gap: var(--size-4);
    align-content: start;
  }

  .setup-copy {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: 1.75;
  }

  .setup-copy .inline-code {
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-1);
    padding: 0.125rem 0.375rem;
  }

  .release {
    display: grid;
    gap: var(--size-2);
    padding: 0;
    list-style: none;
    counter-reset: release;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: 1.7;
  }

  .release li {
    counter-increment: release;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--size-3);
    align-items: baseline;
  }

  .release li::before {
    content: counter(release, decimal-leading-zero);
    color: var(--violet-8);
    font-weight: var(--font-weight-8);
  }

  .release .inline-code {
    font-size: var(--font-size-micro);
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-1);
    padding: 0.125rem 0.375rem;
  }

  .checklist {
    display: grid;
    gap: var(--size-4);
    padding: 0;
    list-style: none;
  }

  .checklist li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--size-3);
    align-items: center;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: 1.6;
  }

  .checkbox {
    display: inline-grid;
    place-items: center;
    width: var(--size-5);
    height: var(--size-5);
    border-radius: var(--radius-1);
    background: var(--brand);
    color: var(--on-brand);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
  }

  .checkbox.open {
    background: transparent;
    border: 1.5px solid color-mix(in srgb, var(--violet-5) 55%, transparent);
  }

  /* ── where to help: outlined number rows ── */
  .help {
    display: grid;
    border-block-start: 1px solid var(--border);
  }

  .help-header {
    padding: clamp(2rem, 5vh, 3.5rem) clamp(1.5rem, 5vw, 4.5rem) var(--size-4);
  }

  .help-row {
    display: grid;
    grid-template-columns: minmax(4rem, 0.14fr) minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: clamp(1rem, 4vw, 4rem);
    align-items: center;
    padding: clamp(1.25rem, 3vh, 2rem) clamp(1.5rem, 5vw, 4.5rem);
    border-block-start: 1px solid var(--border);
  }

  .help-index {
    font-family: var(--font-mono);
    font-size: clamp(2.2rem, 4.5vw, 3.4rem);
    font-weight: 800;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--violet-5) 55%, transparent);
  }

  .help-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-2);
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }

  .help-copy {
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: 1.7;
  }

  /* ── questions-first callout: violet edge bar ── */
  .callout {
    margin: clamp(2.5rem, 6vh, 4.5rem) clamp(1.5rem, 5vw, 4.5rem);
    padding: var(--size-5) var(--size-6);
    border: 1px solid color-mix(in srgb, var(--violet-5) 40%, transparent);
    border-inline-start: var(--size-1) solid var(--brand);
    border-radius: var(--radius-2);
    background: color-mix(in srgb, var(--violet-1) 30%, var(--bg-elevated));
  }

  .callout-label {
    color: var(--violet-8);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .callout p {
    margin-block-start: var(--size-3);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: 1.75;
  }

  .callout a {
    color: var(--brand);
    text-decoration: none;
  }

  .callout a:hover {
    text-decoration: underline;
  }

  .nav-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    padding: 0 clamp(1.5rem, 5vw, 4.5rem) clamp(3rem, 8vh, 6rem);
  }

  @media (max-width: 900px) {
    .setup {
      grid-template-columns: 1fr;
    }

    .help-row {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--size-2);
    }
  }
`);

const checklist = [
  { done: true, text: 'deno fmt + deno lint stay clean' },
  { done: true, text: 'Conventional Commits (feat / fix / docs / refactor / test / chore)' },
  { done: true, text: 'Gates green locally — deno task test before push' },
  { done: false, text: 'Architectural change? Write the ADR first' },
] as const;

const helpRows = [
  [
    '01',
    'Third-party WC corpus',
    'Lit / FAST / Stencil components that render through our DSD smoke pipeline, with evidence.',
  ],
  [
    '02',
    'Dogfood something real',
    'Build an application on the stable line and file what breaks. That is the pilot now.',
  ],
  [
    '03',
    'Documentation truth',
    'Run the docs gates, fix stale claims, and keep the public surface evidence-backed.',
  ],
] as const;

export class ContributingPage extends OpenElement {
  static override styles = [routeSheet];
  override render() {
    return (
      <main class='contribute'>
        <header class='masthead'>
          <p class='eyebrow'>Contributing — Join the lab</p>
          <h1>
            <span class='mono-line'>BUILD IT</span>
            <span class='serif-line'>with us.</span>
          </h1>
          <p class='lede'>
            A precise, Deno-first contributor workflow for the Web Standards Lab.
          </p>
        </header>

        <section class='setup' aria-label='Development setup'>
          <div class='setup-col'>
            <p class='section-label'>§1 — Setup</p>
            <open-code-block>
              <pre><code>{`git clone https://github.com/open-element/openelement.git
cd openelement
deno install
deno task test
deno task dev`}</code></pre>
            </open-code-block>
            <p class='setup-copy'>
              openElement core CLI, SSG, serverless API, tests, publishing, and docs site tasks all
              use Deno 2.8+ as the default runtime. Vite runs via{' '}
              <span class='inline-code'>deno run -A npm:vite</span> — no{' '}
              <span class='inline-code'>npm</span> or <span class='inline-code'>npx</span>{' '}
              needed for the main workflow.
            </p>
            <p class='section-label'>Release line</p>
            <ol class='release'>
              <li>
                <span>
                  Update version numbers (<span class='inline-code'>packages/*/deno.json</span>)
                </span>
              </li>
              <li>
                <span>Update the changelog</span>
              </li>
              <li>
                <span>
                  Run <span class='inline-code'>deno task test</span>
                </span>
              </li>
              <li>
                <span>
                  Publish via <span class='inline-code'>deno task publish:jsr</span>,{' '}
                  <span class='inline-code'>deno task publish:npm</span>,{' '}
                  <span class='inline-code'>deno task pack:dry-run</span>
                </span>
              </li>
              <li>
                <span>Create the GitHub Release</span>
              </li>
            </ol>
          </div>

          <div class='setup-col'>
            <p class='section-label'>§2 — Before a PR</p>
            <ul class='checklist'>
              {checklist.map((item) => (
                <li>
                  <span class={item.done ? 'checkbox' : 'checkbox open'} aria-hidden='true'>
                    {item.done ? '✓' : ''}
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <p class='setup-copy'>
              Layering discipline: before adding a feature, check whether it can be solved at a
              lower level — L0 HTML, L1 CSS, L2 Browser API, L3 Hono/Vite/Lit, then L4 custom code.
            </p>
          </div>
        </section>

        <section class='help' aria-label='Where to help'>
          <p class='section-label help-header'>§3 — Where to help</p>
          {helpRows.map(([index, title, copy]) => (
            <div class='help-row'>
              <span class='help-index' aria-hidden='true'>{index}</span>
              <span class='help-title'>{title}</span>
              <p class='help-copy'>{copy}</p>
            </div>
          ))}
        </section>

        <aside class='callout'>
          <p class='callout-label'>Questions first</p>
          <p>
            <a href='https://github.com/open-element/openelement/discussions'>GitHub Discussions</a>
            {' '}
            for usage and design.{' '}
            <a href='https://github.com/open-element/openelement/issues'>Issues</a>{' '}
            for reproducible bugs, documentation defects, and agreed proposals.
          </p>
        </aside>

        <div class='nav-row'>
          <open-button variant='ghost' size='sm' href='/changelog'>
            Changelog
          </open-button>
          <open-button variant='ghost' size='sm' href='/roadmap'>
            Roadmap
          </open-button>
        </div>
      </main>
    );
  }
}

customElements.define('page-contributing', ContributingPage);
export default ContributingPage;
export const tagName = 'page-contributing';
