import { definePage } from '@openelement/app';
import PackageCompatibilityPage from '../../components/article-routes/architecture-package-compatibility.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Reference', label: 'Package Compatibility', order: 90 };

export default definePage(PackageCompatibilityPage, {
  props({ locale }) {
    return { model: projectArticlePage('architecture', 'package-compatibility', locale) };
  },
});
