/** @jsxImportSource @openelement/core */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'freshness-page';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  p { color: var(--text-secondary, #666); }
`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>Freshness proof</h1>
        <p>This page records ISR/cache intent with a 300 second revalidate window.</p>
      </>
    );
  },
});

export default definePage({
  route: { path: '/freshness' },
  head: {
    title: 'Freshness proof',
    description: 'Generated openElement ISR intent route',
  },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: 300,
  },
  render() {
    return <freshness-page />;
  },
});
