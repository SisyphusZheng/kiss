import { definePage } from '@openelement/app';
import GuideStylingPage from '../../components/article-routes/guide-styling.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Styling', order: 5 };

export default definePage(GuideStylingPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'styling', locale) };
  },
});
