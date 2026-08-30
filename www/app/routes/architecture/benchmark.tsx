import { definePage } from '@openelement/app';
import Benchmark from '../../components/article-routes/architecture-benchmark.tsx';
import { projectArticlePage } from '../../site-ui/article-page-model.ts';

export const meta = { section: 'Reference', label: 'Performance', order: 100 };

export default definePage(Benchmark, {
  props({ locale }) {
    return { model: projectArticlePage('architecture', 'benchmark', locale) };
  },
});
