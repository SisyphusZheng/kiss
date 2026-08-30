import { definePage } from '@openelement/app';
import GuideMdxPage from '../../components/article-routes/guide-mdx.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Guide', label: 'MDX', order: 50 };

export default definePage(GuideMdxPage, {
  props({ locale }) {
    return { model: projectArticlePage('guide', 'mdx', locale) };
  },
});
