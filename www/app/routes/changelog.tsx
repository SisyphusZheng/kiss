/**
 * Changelog Page - openElement Framework Version History.
 */
export const meta = { section: '', label: 'Changelog', order: 20 };
import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-button';
import { PUBLISHED_PACKAGE_VERSION } from '../data/version.ts';
import { pageStyles } from '../components/page-styles.js';
import { marked } from 'marked';
// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml from 'npm:sanitize-html@^2.17.4';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-reading-shell.tsx';
import '@openelement/site-ui/open-page-rail.tsx';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
  :host { display: block; }
  .title-serif { display: block; color: var(--violet-8); font-family: var(--font-serif); font-size: calc(1em * 1.12); font-style: italic; font-weight: 400; letter-spacing: -.02em; }
  .title-mono { display: block; }

  /* release register: current line highlighted, history on hairlines */
  .register { margin: var(--size-8) 0 var(--size-10); border-block-start: var(--border-size-1) solid var(--border); }
  .reg-row { padding: var(--size-5); border-block-end: var(--border-size-1) solid var(--border); }
  .reg-current { background: var(--brand-subtle); box-shadow: inset var(--size-1) 0 0 var(--brand); }
  .reg-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--size-3); }
  .reg-version { color: var(--text-secondary); font-size: clamp(1.4rem, 2.4vw, 2rem); font-weight: 800; line-height: 1; letter-spacing: -.02em; }
  .reg-current .reg-version { color: var(--text-primary); font-size: clamp(1.9rem, 3.4vw, 2.8rem); }
  .reg-ghost .reg-version { color: transparent; -webkit-text-stroke: 1.5px color-mix(in srgb, var(--violet-5) 55%, transparent); }
  .reg-stamp { padding: var(--size-1) var(--size-3); border-radius: var(--radius-1); background: var(--brand); color: var(--on-brand); font-size: var(--font-size-00); font-weight: var(--font-weight-7); letter-spacing: .08em; text-transform: uppercase; }
  .reg-note { color: var(--text-muted); font-size: var(--font-size-00); }
  .reg-summary { margin: var(--size-2) 0 0; max-width: 640px; overflow: hidden; color: var(--text-secondary); font-size: var(--font-size-00); line-height: var(--font-lineheight-3); text-overflow: ellipsis; white-space: nowrap; }
  .reg-ghost .reg-summary { color: var(--text-muted); }

  .changelog-content { font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--text-primary); }
  .changelog-content h2 { position:relative; font-size: var(--font-size-5); margin: var(--size-10) 0 var(--size-4); border-bottom: 0.5px solid var(--border); padding:0 0 var(--size-4) var(--size-6); }
  .changelog-content h2::before { content:""; position:absolute; inset:0 auto 0 0; width:2px; background:var(--brand); }
  .changelog-content h2:first-child::after { content:"published history"; display:block; margin-top:var(--size-2); color:var(--brand); font-family:var(--font-mono); font-size:var(--font-size-00); text-transform:uppercase; letter-spacing:.08em; }
  .changelog-content h3 { font-size: var(--font-size-3); margin: var(--size-6) 0 var(--size-2); }
  .changelog-content code { font-family: var(--font-mono); background: var(--bg-surface); padding: var(--size-1) var(--size-2); border-radius: var(--radius-1); font-size: var(--font-size-00); }
  .changelog-content pre { background: var(--bg-surface); padding: var(--size-5) var(--size-6); border-radius: var(--radius-2); overflow-x: auto; }
`,
);

export class ChangelogPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    // The module runs from www/app/routes in dev but from www/dist/server in
    // the SSG bundle, so locate CHANGELOG.md by walking up from import.meta.url.
    let changelogPath: URL | undefined;
    let cursor = new URL('.', import.meta.url);
    for (let depth = 0; depth < 8 && !changelogPath; depth++) {
      const candidate = new URL('CHANGELOG.md', cursor);
      try {
        Deno.statSync(candidate);
        changelogPath = candidate;
      } catch {
        cursor = new URL('../', cursor);
      }
    }
    let html: string;
    try {
      if (!changelogPath) throw new Error('CHANGELOG.md not found');
      const md = Deno.readTextFileSync(changelogPath);
      const raw = marked.parse(md, { async: false }) as string;
      html = sanitizeHtml(raw, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'h2',
          'h3',
          'h4',
          'img',
        ]),
        allowedAttributes: { a: ['href', 'target', 'rel'] },
      });
    } catch {
      html =
        '<p>Unable to load the changelog. Read it on <a href="https://github.com/open-element/openelement/blob/main/CHANGELOG.md">GitHub</a>.</p>';
    }

    return (
      <main>
        <open-page-hero variant='timeline'>
          <span slot='eyebrow'>Changelog — release registry</span>
          <span slot='title'>
            <span class='title-serif'>Every line,</span>
            <span class='title-mono'>EVIDENCED.</span>
          </span>
          <span slot='lede'>
            Published, candidate, withdrawn and historical release evidence for OpenElement.
          </span>
          <div slot='artifact'>
            <open-button href='/roadmap'>Read roadmap</open-button>
          </div>
        </open-page-hero>
        <open-reading-shell meta rail footer>
          <div slot='meta'>
            <p class='section-label'>Current truth</p>
            <p class='subtitle'>
              The currently published package line is <code>{PUBLISHED_PACKAGE_VERSION}</code>.
            </p>
          </div>
          <open-page-rail
            slot='rail'
            items='[{"id":"published","label":"Published"},{"id":"candidate","label":"Stable line"},{"id":"withdrawn","label":"Withdrawn"},{"id":"historical","label":"Historical archive"}]'
          >
          </open-page-rail>
          <p id='published'>
            The project follows Keep a Changelog and SemVer. Historical entries preserve older names
            where they describe older releases; current docs use the openElement contract.
          </p>
          <div class='register' aria-label='Release register'>
            <div class='reg-row reg-current'>
              <div class='reg-head'>
                <span class='reg-version'>{PUBLISHED_PACKAGE_VERSION}</span>
                <span class='reg-stamp'>Current</span>
              </div>
              <p class='reg-summary'>
                The published five-package line — unified product and website surface, sealed export
                seams.
              </p>
            </div>
            <div class='reg-row reg-ghost'>
              <div class='reg-head'>
                <span class='reg-version'>0.40.x</span>
                <span class='reg-note'>archive →</span>
              </div>
              <p class='reg-summary'>
                The eleven-package era — JSR-only, before the collapse. Historical record.
              </p>
            </div>
          </div>
          <section id='candidate'>
            <h2>Stable line</h2>
            <p>
              <code>{PUBLISHED_PACKAGE_VERSION}</code>{' '}
              is the published stable line under the ADR-0119 scoped interface freeze. Patches on
              the 0.41.x line carry tooling and hygiene fixes only; the frozen surface changes only
              with a major-version ADR.
            </p>
          </section>
          <section id='withdrawn'>
            <h2>Withdrawn partial artifacts</h2>
            <p>
              The npm beta.1–beta.3 artifacts are withdrawn partial releases, not supported product
              lines or upgrade targets.
            </p>
          </section>
          <p class='reg-note'>
            ※ Withdrawn partial artifacts (beta.1–beta.3) stay withdrawn from the active release
            story. History is kept, not rewritten.
          </p>
          <div id='historical' class='changelog-content' innerHTML={html} trustedHtml />
          <div slot='footer' class='nav-row'>
            <open-button variant='ghost' size='sm' href='/roadmap'>
              Roadmap
            </open-button>
            <open-button
              variant='ghost'
              size='sm'
              href='/guide/getting-started'
            >
              Getting Started
            </open-button>
          </div>
        </open-reading-shell>
      </main>
    );
  }
}

defineCustomElement('page-changelog', ChangelogPage);
export default ChangelogPage;
export const tagName = 'page-changelog';
