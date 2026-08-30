/**
 * /freshness — ISR intent route. The revalidate value is a forward-compatible
 * record only in 0.44 (no cache is wired to it); the page is prerendered once
 * at build time.
 */
import { definePage } from '@openelement/app';
import FreshnessPage from '../components/page-freshness.tsx';

export default definePage(FreshnessPage, {
  head: {
    title: 'Freshness proof',
    description: 'Generated openElement ISR intent route',
  },
  renderIntent: {
    mode: 'static',
    revalidate: 300,
  },
});
