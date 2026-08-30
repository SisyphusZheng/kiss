import { definePage } from '@openelement/app';
import IslandsPage from '../../components/article-routes/architecture-islands.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Principles', label: 'Islands', order: 40 };

export default definePage(IslandsPage, {
  props({ locale }) {
    return { model: projectArticlePage('architecture', 'islands', locale) };
  },
});
