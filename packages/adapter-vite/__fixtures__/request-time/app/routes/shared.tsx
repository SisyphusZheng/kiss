/**
 * /shared — a route whose enhanced form lives in an IMPORTED component
 * (#577): this file contains no data-open-enhance literal, so the
 * enhancement layer only ships because the scanner follows the import.
 */
import { definePage } from '@openelement/app';
import { SharedEnhancedForm } from '../components/shared-enhanced-form.tsx';

export const tagName = 'page-shared';

const SharedPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — shared' },
  render() {
    return (
      <main>
        <h1>shared component form</h1>
        <SharedEnhancedForm />
      </main>
    );
  },
});

customElements.define(tagName, SharedPage);
export default SharedPage;
