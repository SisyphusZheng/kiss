/** @jsxImportSource @openelement/core */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'alpha3-wc-page';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; max-width: 880px; margin: 2rem auto; padding: 0 1rem; }
  h1 { margin: 0 0 1rem; }
`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>alpha3 Web Components interop</h1>
        <alpha3-wc-fixture></alpha3-wc-fixture>
      </>
    );
  },
});

export default definePage({
  route: { path: '/third-party-wc' },
  head: {
    title: 'alpha3 Web Components interop',
    description: 'Lit, Shoelace, and Material Web Components inside openElement',
  },
  renderIntent: { mode: 'static', streaming: 'auto', revalidate: false },
  render() {
    return <alpha3-wc-page />;
  },
});
