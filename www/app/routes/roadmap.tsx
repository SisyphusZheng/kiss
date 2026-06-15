export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// Strategic anchors: openElement = Elements + UI + Framework + Protocols.
// Version: v0.37.2, v0.37.6, v0.38.0, v0.39.0, v0.40.7, v1.0.
// Legacy smoke anchors: WC Package Protocol, Six-Phase Vision, Registry Hub, No webpack.

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { daisyClassSheet, openPropsTokenSheet } from '@openelement/ui';
import '../islands/open-search.tsx';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
  }

  :host([data-theme="dark"]) .now,
  :host([data-theme="dark"]) .phase,
  :host([data-theme="dark"]) .truth {
    background: var(--gray-0);
  }

  .chip { display: inline-flex; align-items: center; }

  .shell {
    max-width: 1080px;
    margin: 0 auto;
    padding: 44px var(--size-6) 72px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: var(--size-7);
    align-items: start;
    padding-bottom: 30px;
    border-bottom: 1px solid var(--gray-3);
  }

  h1 {
    margin: 0;
    color: var(--gray-10);
    font-size: clamp(2.6rem, 7vw, 5rem);
    line-height: 0.95;
    letter-spacing: 0;
  }

  .subtitle {
    max-width: 690px;
    margin: 18px 0 0;
    color: var(--gray-6);
    font-size: var(--font-size-4);
    line-height: var(--font-lineheight-4);
  }

  .now {
    border: 1px solid var(--gray-3);
    border-radius: var(--radius-2);
    background: var(--gray-0);
    padding: var(--size-4);
  }

  .now span {
    display: inline-flex;
    align-items: center;
  }

  .now h2 {
    margin: 14px 0 var(--size-2);
    color: var(--gray-10);
    font-size: 18px;
  }

  .now p {
    margin: 0;
    color: var(--gray-6);
    font-size: var(--font-size-1);
    line-height: 1.6;
  }

  .timeline {
    margin-top: var(--size-8);
    display: grid;
    gap: var(--size-3);
  }

  .phase {
    display: grid;
    grid-template-columns: 110px 1fr 140px;
    gap: var(--size-4);
    align-items: start;
    border: 1px solid var(--gray-3);
    border-radius: var(--radius-2);
    background: var(--gray-0);
    padding: var(--size-4);
  }

  .version {
    color: var(--indigo-5);
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-8);
  }

  .phase h3 {
    margin: 0 0 var(--size-2);
    color: var(--gray-10);
    font-size: var(--font-size-4);
  }

  .phase p {
    margin: 0;
    color: var(--gray-6);
    font-size: var(--font-size-1);
    line-height: 1.65;
  }

  .status {
    justify-self: end;
  }

  .truth-grid {
    margin-top: 34px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--size-3);
  }

  .truth {
    border: 1px solid var(--gray-3);
    border-radius: var(--radius-2);
    background: var(--gray-0);
    padding: var(--size-4);
  }

  .truth h2 {
    margin: 0 0 10px;
    color: var(--gray-10);
    font-size: var(--font-size-4);
  }

  .truth p,
  .truth li {
    color: var(--gray-6);
    font-size: var(--font-size-1);
    line-height: 1.65;
  }

  .truth p {
    margin: 0;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  .nav-row {
    margin-top: 34px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  @media (max-width: 820px) {
    .hero,
    .phase,
    .truth-grid {
      grid-template-columns: 1fr;
    }

    .status {
      justify-self: start;
    }
  }

  @media (max-width: 560px) {
    .shell {
      padding: var(--size-8) var(--size-4) 56px;
    }
  }
`);

export class RoadmapPage extends OpenElement {
  declare locale?: string;

  static override styles = [daisyClassSheet, openPropsTokenSheet, routeSheet];

  override render() {
    return (
      <div
        class='shell'
        data-legacy-anchors='WC Package Protocol Six-Phase Vision No webpack Registry Hub'
      >
        <section class='hero'>
          <div>
            <h1>Roadmap</h1>
            <p class='subtitle'>
              openElement roadmap labels are product truth, not aspiration. The current package line
              is v0.40.7: Release Readiness & CI Hardening. The active workspace is the
              11-package product line.
            </p>
          </div>
          <aside class='card card-bordered p-4'>
            <span class='badge badge-outline'>current line</span>
            <h2>v0.40.7 Release Readiness & CI Hardening</h2>
            <p>
              Hub/RPC/CEM/compat-check and interop adapters are out of the current package graph;
              AutoFlow3 owns gates.
            </p>
          </aside>
        </section>

        <div class='timeline'>
          <div class='phase'>
            <div class='version'>v0.30.x</div>
            <div>
              <h3>Architecture Contract Freeze</h3>
              <p>
                One renderer model, one metadata boundary, openElement rename, and cleanup gates.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.31.0</div>
            <div>
              <h3>JSX-first Application API</h3>
              <p>
                definePage, defineIsland, defineElement, defineLayout, and the @openelement/app/vite
                split.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.32.0</div>
            <div>
              <h3>App Lifecycle Contract</h3>
              <p>
                Route params, load context, route metadata, redirect, not-found, error fallback,
                rendering intent, and streaming intent.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.33.0</div>
            <div>
              <h3>AI-Readable API Foundation</h3>
              <p>
                Object-form pages, structured head/route/render intent, explicit island metadata,
                and old API rejection proof.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.34.0</div>
            <div>
              <h3>AutoFlow2 Sidecar Kernel</h3>
              <p>
                Workflow state, cells, evidence ledger, blockers, and allowed-action report without
                automatic edits.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.35.0</div>
            <div>
              <h3>AutoFlow2 Harness Gate</h3>
              <p>
                Low-noise workflow contradictions become local and CI blockers through model-backed
                checks.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.36.0</div>
            <div>
              <h3>Rendering Runtime and Deployment</h3>
              <p>
                Productized SSR, ISR, streaming DSD, cache adapters, and deployment recipes under
                AutoFlow evidence.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.36.1</div>
            <div>
              <h3>AutoFlow Closure and Release Truth</h3>
              <p>
                Windows-safe AutoFlow tests, merged-cell metrics, and v0.36 release evidence
                alignment.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.36.2</div>
            <div>
              <h3>SSG Bridge Migration</h3>
              <p>Move Vite-free SSG render and postprocess code into @openelement/ssg.</p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.36.3</div>
            <div>
              <h3>Complete SSG File Ownership</h3>
              <p>
                Move route scanning, entry generation, generated data, and SSG plugin logic into
                @openelement/ssg.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.36.4</div>
            <div>
              <h3>Firefox/WebKit Cross-Browser Proof</h3>
              <p>Record browser proof, known limitations, and 20-package v0.36.4 alignment.</p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.36.5</div>
            <div>
              <h3>Release Truth and AutoFlow Closure</h3>
              <p>
                Align workflow, release docs, AutoFlow evidence, and website truth without product
                changes.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.37.0</div>
            <div>
              <h3>Product Doctrine + Rendering Contract Reset</h3>
              <p>
                ADR-0091, static default 0JS, DSD/shadow default, light DOM opt-in terms, and the
                v0.37.x SOP split.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.37.1</div>
            <div>
              <h3>OpenElement Shadow + Light Contract</h3>
              <p>
                Audit OpenElement behavior and define explicit light DOM opt-in without weakening
                the DSD/shadow default.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.37.2</div>
            <div>
              <h3>SSR / ISR Server Runtime Contract</h3>
              <p>
                Define request-time SSR/ISR framework boundaries, cache behavior, server adapter
                evidence, and zero-JS defaults.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.37.3</div>
            <div>
              <h3>Data / Database Boundary</h3>
              <p>
                Specify data/database adapter contracts and recipes without adopting a built-in ORM,
                auth platform, or migration system.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.37.4</div>
            <div>
              <h3>Hygiene + Pure CSS UI + Architecture Decoupling</h3>
              <p>
                Close audit hygiene, SSG ownership, ui/router decoupling, dsd-hydration dedup, CSS
                UI foundation, and test supplementation.
              </p>
            </div>
            <span class='badge badge-primary status'>Recovery</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.37.5</div>
            <div>
              <h3>Protocol Ports + DaisyUI Coverage Completion</h3>
              <p>
                Complete interactive UI coverage and move public protocol types into
                @openelement/protocol with conformance tests.
              </p>
            </div>
            <span class='badge badge-warning status'>Planned</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.38.0</div>
            <div>
              <h3>Product Surface Reset</h3>
              <p>
                Classify product, advanced, internal, and archived packages before the v0.39
                framework release-candidate surface.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.38.x</div>
            <div>
              <h3>Product Surface Reset and Hardening</h3>
              <p>Reset public packages, APIs, and docs based on v0.37.x product evidence.</p>
            </div>
            <span class='badge badge-warning status'>Planned</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.39.0</div>
            <div>
              <h3>Framework RC + Four-Product Matrix Reset</h3>
              <p>
                Validate generated framework apps, public docs integrity, Elements direction, Preact
                handoff, and release gates.
              </p>
            </div>
            <span class='badge badge-success status'>Done</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.40.0</div>
            <div>
              <h3>Elements + Preact + Repository Slimming</h3>
              <p>
                Productize the 14-package current surface, remove Hub and archived packages, and
                keep Nitro proof plus AutoFlow3 gates green.
              </p>
            </div>
            <span class='badge badge-info status'>Active</span>
          </div>
          <div class='phase'>
            <div class='version'>v0.41.0</div>
            <div>
              <h3>v1.0 Freeze Candidate</h3>
              <p>
                Freeze public APIs, complete protocol conformance, and harden the product surface
                before stable release.
              </p>
            </div>
            <span class='badge badge-warning status'>Planned</span>
          </div>
          <div class='phase'>
            <div class='version'>v1.0.0</div>
            <div>
              <h3>Stable Four-Product Platform</h3>
              <p>
                Freeze Elements, UI, Framework, and Protocols surfaces with workflow evidence in the
                release gate.
              </p>
            </div>
            <span class='badge badge-warning status'>Planned</span>
          </div>
        </div>

        <div class='truth-grid'>
          <div class='truth'>
            <h2>Shipped</h2>
            <ul>
              <li>JSX-first Application API</li>
              <li>Structured Renderer IR + single async path</li>
              <li>SSG + Declarative Shadow DOM</li>
              <li>Hono API routes + MDX support</li>
              <li>AppShell protocol + signal-driven islands</li>
            </ul>
          </div>
          <div class='truth'>
            <h2>Current</h2>
            <ul>
              <li>v0.37.2 SSR / ISR runtime contract</li>
              <li>OpenElement shadow/light contract implemented</li>
              <li>SSG pipeline is proven as internal build infrastructure</li>
              <li>AutoFlow2 evidence and workflow gates</li>
              <li>20-package aligned monorepo</li>
            </ul>
          </div>
          <div class='truth'>
            <h2>Deferred</h2>
            <ul>
              <li>database adapters and recipes</li>
              <li>pure CSS UI product surface</li>
              <li>protocol ports and full-stack preset smoke</li>
              <li>generic auth or ORM systems</li>
            </ul>
          </div>
        </div>

        <nav class='nav-row'>
          <a class='btn btn-ghost' href='/architecture/architecture'>Architecture {'->'}</a>
          <a class='btn btn-ghost' href='/changelog'>Changelog {'->'}</a>
          <a class='btn btn-ghost' href='/guide/deployment'>Deployment {'->'}</a>
        </nav>
      </div>
    );
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
