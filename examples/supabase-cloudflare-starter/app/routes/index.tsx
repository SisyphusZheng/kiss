/** Public home page — prerendered at build time (default static intent). */
import { definePage } from '@openelement/app';

export const tagName = 'page-home';

const HomePage = definePage({
  head: { title: 'Reference starter — OpenElement × Supabase × Cloudflare' },
  render() {
    return (
      <main>
        <h1>Reference starter</h1>
        <p>
          OpenElement app shell on the Nitro cloudflare_module output, Supabase-backed.
        </p>
        <ul>
          <li>
            <a href='/notes'>Protected notes (RLS)</a>
          </li>
          <li>
            <a href='/upload'>Storage upload (owner-scoped bucket)</a>
          </li>
          <li>
            <a href='/login'>Sign-in</a>
          </li>
        </ul>
      </main>
    );
  },
});

customElements.define(tagName, HomePage);
export default HomePage;
