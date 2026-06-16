export const meta = { section: 'Production', label: 'Error Handling', order: 30 };
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';
import '@openelement/ui/open-button-linear';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
  .error-hierarchy { padding: var(--size-4); background: var(--bg-surface); border-left: 2px solid var(--border); border-radius: 0 var(--radius-1) var(--radius-1) 0; margin: var(--size-4) 0; font-family: var(--font-mono); font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--text-secondary); }
`,
);

export class ErrorHandlingPage extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return (
      <div class='container'>
        <h1>Error Handling</h1>
        <p class='subtitle'>
          openElement separates framework errors, build-time render errors, API errors, and browser
          island failures so production output stays clear and safe.
        </p>
        <h2>Error Hierarchy</h2>
        <div class='error-hierarchy'>
          OpenElementError |-- NotFoundError 404 |-- ValidationError 422 |-- RateLimitError 429 |--
          SsrRenderError 500 |-- IslandUpgradeError 500
        </div>
        <h2>Operational vs Programming</h2>
        <p>
          Operational errors return structured status and diagnostics. Programming errors such as
          render failures, broken imports, or invalid route metadata fail the build or surface dev
          diagnostics.
        </p>
        <h2>Structured Logging</h2>
        <p>
          Use <span class='inline-code'>createLogger(scope)</span>{' '}
          for scoped DEBUG, INFO, WARN, and ERROR messages. Logs identify the subsystem without
          leaking private runtime state.
        </p>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/security-middleware'>Security and Middleware</open-button-linear>
          <open-button-linear variant='secondary' href='/guide/testing'>Testing</open-button-linear>
        </div>
      </div>
    );
  }
}

customElements.define('page-error-handling', ErrorHandlingPage);
export default ErrorHandlingPage;
export const tagName = 'page-error-handling';
