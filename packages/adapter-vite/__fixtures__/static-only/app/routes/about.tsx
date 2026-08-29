import { definePage } from '@openelement/app';
import AboutPage from '../components/page-about.tsx';

export default definePage(AboutPage, {
  head: { title: 'static-only fixture — about' },
});
