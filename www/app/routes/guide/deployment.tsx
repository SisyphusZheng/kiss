import { definePage } from '@openelement/app';
import GuideDeploymentPage from '../../components/article-routes/guide-deployment.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Deployment', order: 100 };

export default definePage(GuideDeploymentPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'deployment', locale) };
  },
});
