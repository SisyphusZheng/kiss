import { definePage } from '@openelement/app';
import StandardsRegistryPage from '../../components/article-routes/architecture-standards-registry.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Reference', label: 'WC Standards Contract', order: 80 };

export default definePage(StandardsRegistryPage, {
  props({ locale }) {
    return { model: projectArticlePage('architecture', 'standards-registry', locale) };
  },
});
