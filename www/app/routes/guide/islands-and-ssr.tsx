import { definePage } from '@openelement/app';
import GuideIslandsAndSsrPage from '../../components/article-routes/guide-islands-and-ssr.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'Islands and SSR', order: 90 };

export default definePage(GuideIslandsAndSsrPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'islands-and-ssr', locale) };
  },
});
