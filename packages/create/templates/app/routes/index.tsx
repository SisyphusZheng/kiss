/** @jsxImportSource @openelement/element */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'home-page';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 2rem; margin-bottom: 0.5rem; }
  p { color: var(--text-secondary, #666); }
  img { width: 64px; height: 64px; }
`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>Hello from openElement!</h1>
        <p>
          Your openElement app is running. Edit <code>app/routes/index.tsx</code> to get started.
        </p>
        <img src='/openelement-mark.svg' alt='openElement mark' />
        <my-counter></my-counter>
      </>
    );
  },
});

export default definePage({
  route: { path: '/' },
  head: {
    title: 'My openElement App',
    description: 'Generated openElement starter app',
  },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: false,
  },
  render() {
    return <home-page />;
  },
});
