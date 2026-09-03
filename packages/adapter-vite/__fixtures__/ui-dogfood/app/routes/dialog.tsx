/** /dialog — static page qualifying open-dialog (#1226). */
import { definePage } from '@openelement/app';
import DialogPage from '../components/page-dialog.tsx';

export default definePage(DialogPage, {
  head: { title: 'ui dogfood fixture — dialog' },
});
