import { definePage } from '@openelement/app';
import DsdGuidePage from '../../components/article-routes/architecture-dsd.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Principles', label: 'DSD Rendering', order: 30 };

export default definePage(DsdGuidePage, {
  props({ locale }) {
    return { model: projectArticlePage('architecture', 'dsd', locale) };
  },
});
