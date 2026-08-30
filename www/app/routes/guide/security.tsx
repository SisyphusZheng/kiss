import { definePage } from '@openelement/app';
import GuideSecurityPage from '../../components/article-routes/guide-security.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Security', order: 95 };

export default definePage(GuideSecurityPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'security', locale) };
  },
});
