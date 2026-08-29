/** @jsxImportSource @openelement/element */
import { defineIsland, defineIslandConfig } from '@openelement/app';

export const tagName = 'v044-interop-fixture';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });

if (typeof window !== 'undefined') {
  import('../client/v044-interop-client.ts');
}

export default defineIsland(tagName, {
  render() {
    return (
      <main id='v044-interop-main'>
        <h1>OpenElement v0.44 interoperability corpus</h1>
        <v044-interop-child-host id='children'>
          <v044-native-probe id='native-child' value='native-child'>Native child</v044-native-probe>
          <v044-lit-probe id='lit-child' value='lit-child'>Lit child</v044-lit-probe>
          <v044-fast-probe id='fast-child' value='fast-child'>FAST child</v044-fast-probe>
          <v044-stencil-probe id='stencil-child' disabled='true'>Stencil child</v044-stencil-probe>
        </v044-interop-child-host>
        <section id='application-dependencies'>
          <h2>Application dependencies</h2>
          <v044-native-probe id='native-dependency' value='native-dependency'>
            Native dependency
          </v044-native-probe>
          <v044-lit-probe id='lit-dependency' value='lit-dependency'>Lit dependency</v044-lit-probe>
          <v044-fast-probe id='fast-dependency' value='fast-dependency'>
            FAST dependency
          </v044-fast-probe>
          <v044-stencil-probe id='stencil-dependency' disabled='true'>
            Stencil dependency
          </v044-stencil-probe>
        </section>
      </main>
    );
  },
}, openElement);
