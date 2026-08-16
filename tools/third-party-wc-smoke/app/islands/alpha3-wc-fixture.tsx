/** @jsxImportSource @openelement/element */
import { defineElement, defineIsland, defineIslandConfig } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'alpha3-wc-fixture';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });

if (typeof window !== 'undefined') {
  import('../client/alpha3-wc-client.ts');
}

defineElement('alpha3-open-child', {
  render() {
    return <span id='open-child-ready'>openElement child inside Lit</span>;
  },
});

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: grid; gap: 1rem; }
  section { display: grid; gap: 0.5rem; padding: 1rem; border: 1px solid #d0d7de; border-radius: 8px; }
  .row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
`);

let eventCount = 0;
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, string[]>).__alpha3EventLog = [];
}

const bump = (source: string) => {
  eventCount++;
  (window as unknown as Record<string, string[]>).__alpha3EventLog.push(source);
  // #960: the definePage route registers under the path-derived fallback tag
  // (third-party-wc); alpha3-wc-page is the content element in its shadow.
  const fixture = document
    .querySelector('third-party-wc')
    ?.shadowRoot?.querySelector('alpha3-wc-page')
    ?.shadowRoot?.querySelector('alpha3-wc-fixture') as HTMLElement | null;
  const countEl = fixture?.shadowRoot?.querySelector('#event-count');
  if (countEl) countEl.textContent = `events:${eventCount}`;
};

export default defineIsland(tagName, {
  styles,
  render() {
    return (
      <>
        <p id='event-count'>events:0</p>
        <section id='lit-section'>
          <h2>Lit</h2>
          <alpha3-lit-counter label='Lit counter' on-lit-count={() => bump('lit-count')}>
            <span slot='label'>Lit slot label</span>
          </alpha3-lit-counter>
        </section>
        <section id='shoelace-section'>
          <h2>Shoelace</h2>
          <div class='row'>
            <sl-button id='sl-button' variant='primary' onClick={() => bump('sl-button')}>
              Shoelace Button
            </sl-button>
            <sl-switch id='sl-switch' on-sl-change={() => bump('sl-switch')}>
              Shoelace Switch
            </sl-switch>
          </div>
          <sl-dialog id='sl-dialog' label='Shoelace Dialog'>Dialog content</sl-dialog>
        </section>
        <section id='material-section'>
          <h2>Material Web</h2>
          <div class='row'>
            <md-filled-button id='md-button' onClick={() => bump('md-button')}>
              Material Button
            </md-filled-button>
            <md-outlined-text-field id='md-field' label='Material Field' value='alpha3'>
            </md-outlined-text-field>
            <md-switch id='md-switch' on-change={() => bump('md-switch')}></md-switch>
          </div>
        </section>
        <section id='interop-section'>
          <h2>Bidirectional</h2>
          <alpha3-lit-host></alpha3-lit-host>
        </section>
        <section id='fast-section'>
          <h2>FAST</h2>
          <alpha3-fast-counter id='fast-counter' on-fast-count={() => bump('fast-count')}>
            <span slot='label'>FAST slot label</span>
          </alpha3-fast-counter>
        </section>
        <section id='stencil-section'>
          <h2>Stencil compiled output (Ionic)</h2>
          <ion-button id='ionic-button' onClick={() => bump('ionic-button')}>
            Ionic Stencil Button
          </ion-button>
        </section>
        <section id='native-section'>
          <h2>Bare native</h2>
          <alpha3-native-badge id='native-badge' onClick={() => bump('native-badge')}>
            Native badge light child
          </alpha3-native-badge>
        </section>
      </>
    );
  },
}, openElement);
