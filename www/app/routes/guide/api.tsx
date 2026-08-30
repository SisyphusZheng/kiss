import { definePage } from '@openelement/app';
import GuideApiPage from '../../components/article-routes/guide-api.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Core', label: 'API Routes', order: 60 };

export default definePage(GuideApiPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'api', locale) };
  },
});
