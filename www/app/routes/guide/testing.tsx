import { definePage } from '@openelement/app';
import GuideTestingPage from '../../components/article-routes/guide-testing.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Testing', order: 110 };

export default definePage(GuideTestingPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'testing', locale) };
  },
});
