import { definePage } from '@openelement/app';
import GuideArchitecturePage from '../../components/article-routes/guide-architecture.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Architecture', order: 20 };

export default definePage(GuideArchitecturePage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'architecture', locale) };
  },
});
