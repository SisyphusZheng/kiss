/** Static blog index (default renderIntent mode 'static'). */
import { definePage } from '@openelement/app';
import BlogIndexPage from '../../components/page-blog-index.tsx';

export default definePage(BlogIndexPage, {
  head: {
    title: 'Blog — My openElement App',
    description: 'Posts from app/routes/blog',
  },
});
