import { definePage } from '@openelement/app';
import DesignSystemPage from '../../components/article-routes/architecture-design-system.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Reference', label: 'Design System', order: 15 };

export default definePage(DesignSystemPage, {
  props({ locale }) {
    return { model: projectArticlePage('architecture', 'design-system', locale) };
  },
});
