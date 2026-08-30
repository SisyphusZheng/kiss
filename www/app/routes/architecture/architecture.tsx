import { definePage } from '@openelement/app';
import ArchitecturePage from '../../components/article-routes/architecture-architecture.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Principles', label: 'Architecture', order: 10 };

export default definePage(ArchitecturePage, {
  props({ locale }) {
    return { model: projectArticlePage('architecture', 'architecture', locale) };
  },
});
