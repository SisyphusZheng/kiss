/** @jsxImportSource @openelement/core */
import { defineIsland, defineIslandConfig } from '@openelement/app';
import { signal, StyleSheet } from '@openelement/element';

export const tagName = 'my-counter';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: inline-flex; gap: 0.5rem; align-items: center; margin-top: 1rem; }
  button { padding: 0.25rem 0.75rem; cursor: pointer; }
`);

const count = signal(0);

export default defineIsland(tagName, {
  styles,
  render() {
    return (
      <>
        <button type="button" onClick={() => count.value--}>-</button>
        <span>{count.value}</span>
        <button type="button" onClick={() => count.value++}>+</button>
      </>
    );
  },
}, { hydrate: openElement.hydrate, dsd: openElement.dsd, ssr: openElement.ssr });
