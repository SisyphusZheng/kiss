import { definePage } from '@openelement/app';
import GuideConfigurationPage from '../../components/article-routes/guide-configuration.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Configuration', order: 70 };

export default definePage(GuideConfigurationPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'configuration', locale) };
  },
});
