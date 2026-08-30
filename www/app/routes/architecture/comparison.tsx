import { definePage } from '@openelement/app';
import ComparisonPage from '../../components/article-routes/architecture-comparison.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Principles', label: 'Comparison', order: 20 };

export default definePage(ComparisonPage, {
  props({ locale }) {
    return { model: projectArticlePage('architecture', 'comparison', locale) };
  },
});
