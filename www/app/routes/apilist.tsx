/**
 * @openelement/docs - API Reference
 *
 * Organized by category: application API, components, rendering, islands, signals, and build.
 */
import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/core/style-sheet";
import { linearTokenSheet } from "@openelement/ui";

export const tagName = "api-core-page";
export const meta = { section: "Reference", label: "API Reference", order: 5 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  .api-category { margin-bottom: var(--size-8); }
  .api-category h2 { margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
  .api-entry { margin: var(--size-4) 0 var(--size-3); }
  .api-sig { font-family: var(--font-mono); font-size: var(--font-size-00); color: var(--text-primary); margin-bottom: 0.25rem; }
  .api-desc { font-size: var(--font-size-0); color: var(--text-secondary); line-height: var(--font-lineheight-3); }
`);

export default class ApiCorePage extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return this._renderContent();
  }

  private _renderContent() {
    return (
      <div class="container">
        <h1>API Reference</h1>
        <p class="subtitle">
          Current openElement public APIs grouped by application authoring,
          components, rendering, islands, signals, and build.
        </p>

        <div class="api-category">
          <h2>Application API</h2>
          <div class="api-entry">
            <div class="api-sig">
              definePage({`{ route, head, renderIntent, render, error }`})
            </div>
            <div class="api-desc">
              Defines a file-route page through the canonical object descriptor.
              Head fields live under head; rendering intent lives under
              renderIntent. Page data is handled via `export const loader` in
              the route module.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">redirect(location, status?): never</div>
            <div class="api-desc">
              Throws a typed lifecycle redirect control consumed by request-time
              and SSG entry rendering.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">notFound(message?): never</div>
            <div class="api-desc">
              Throws a typed lifecycle not-found control consumed by the
              framework boundary.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">
              defineIslandConfig({`{ ssr, dsd, hydrate }`})
            </div>
            <div class="api-desc">
              Defines static island metadata for adapter scanning through the
              single canonical metadata API.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">
              defineIsland(tagName, render, {`{ hydrate, dsd, ssr }`})
            </div>
            <div class="api-desc">
              Defines browser-upgraded UI with JSX event handlers, hydration
              strategy, DSD mode, and SSR admission intent.
            </div>
          </div>
        </div>

        <div class="api-category">
          <h2>Components</h2>
          <div class="api-entry">
            <div class="api-sig">class OpenElement extends HTMLElement</div>
            <div class="api-desc">
              Base class for DSD components. Components return JSX VNodes and
              the unified renderer targets SSR HTML or real DOM.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">override render(): VNode | null</div>
            <div class="api-desc">
              The current component contract. JSX escapes dynamic text and event
              handlers use onClick/onInput style props.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">
              static props: Record&lt;string, typeof String | Number |
              Boolean&gt;
            </div>
            <div class="api-desc">
              Declares typed component properties, observed attributes, and
              kebab-case attribute mapping.
            </div>
          </div>
        </div>

        <div class="api-category">
          <h2>Rendering</h2>
          <div class="api-entry">
            <div class="api-sig">
              renderDsd(vnode, options): Promise&lt;RenderOutput&gt;
            </div>
            <div class="api-desc">
              The single DSD rendering entry. Props, sourceInfo, DSD options,
              and hooks are passed through the options object.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">
              renderDsdStream(components, options):
              ReadableStream&lt;Uint8Array&gt;
            </div>
            <div class="api-desc">
              Streams document shell and DSD component chunks via Web Streams.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">
              renderToDom(node, host?, disposers?): Node
            </div>
            <div class="api-desc">
              Converts a VNode tree to DOM. Events are native listeners; signal
              props create fine-grained effects.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">
              renderDsdTree(node): Promise&lt;string&gt;
            </div>
            <div class="api-desc">
              Converts a VNode tree to SSR/SSG HTML. Text is escaped by default;
              trustedHtml is the explicit trusted boundary.
            </div>
          </div>
        </div>

        <div class="api-category">
          <h2>Islands</h2>
          <div class="api-entry">
            <div class="api-sig">
              defineIsland(tagName, componentClass, options)
            </div>
            <div class="api-desc">
              Declares island metadata and upgrade strategy: load, idle,
              visible, or only.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">bindSsrProps(element: HTMLElement): void</div>
            <div class="api-desc">
              Restores only data-ssr-props from SSR. It does not bind events;
              events come from VNode markers and JSX handlers.
            </div>
          </div>
        </div>

        <div class="api-category">
          <h2>Signals</h2>
          <div class="api-entry">
            <div class="api-sig">
              signal&lt;T&gt;(initial: T): Signal&lt;T&gt;
            </div>
            <div class="api-desc">
              Creates a reactive value. JSX props automatically subscribe when a
              signal is passed.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">
              computed&lt;T&gt;(fn: () =&gt; T): Signal&lt;T&gt;
            </div>
            <div class="api-desc">
              Creates a memoized read-only signal derived from other signals.
            </div>
          </div>
          <div class="api-entry">
            <div class="api-sig">effect(fn: () =&gt; void): () =&gt; void</div>
            <div class="api-desc">
              Runs when tracked signals change and returns a disposer.
            </div>
          </div>
        </div>

        <div class="api-category">
          <h2>Build</h2>
          <div class="api-entry">
            <div class="api-sig">openPipeline(options, ctx): Plugin[]</div>
            <div class="api-desc">
              Creates the openElement Vite plugin pipeline for routes, entries,
              island manifests, SSR, and SSG.
            </div>
          </div>
        </div>
      </div>
    );
  }
}

customElements.define(tagName, ApiCorePage);
