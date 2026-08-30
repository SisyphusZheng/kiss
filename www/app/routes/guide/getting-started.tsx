import { definePage } from '@openelement/app';
import GuideGettingStartedPage from '../../components/article-routes/guide-getting-started.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Getting Started', order: 1 };

export default definePage(GuideGettingStartedPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'getting-started', locale) };
  },
});
