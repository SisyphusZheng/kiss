import { definePage } from '@openelement/app';
import GuideComparisonPage from '../../components/article-routes/guide-comparison.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Comparison', order: 25 };

export default definePage(GuideComparisonPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'comparison', locale) };
  },
});
