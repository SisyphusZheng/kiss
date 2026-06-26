/** @jsxImportSource @openelement/core */
import { defineApp } from '@openelement/app/spa';
import { setRouter } from './router.ts';

// Register @openelement/ui custom elements on page load
import '@openelement/ui';
import { openPropsRootSheet } from '@openelement/ui';

// Inject Open Props design tokens into the document so shadow-DOM components
// can inherit CSS custom properties (--brand, --bg-elevated, etc.).
const tokenStyle = document.createElement('style');
tokenStyle.textContent = [...openPropsRootSheet.cssRules].map((r) => r.cssText).join('\n');
document.head.appendChild(tokenStyle);

// Import route modules for side-effect: customElements.define + exports loader/action/tagName
import BookshelfPage, {
  loader as bookshelfLoader,
  tagName as bookshelfTag,
} from './routes/index.tsx';
import ReadingPage, {
  action as readingAction,
  loader as readingLoader,
  tagName as readingTag,
} from './routes/books/[id].tsx';
import NotesPage, { loader as notesLoader, tagName as notesTag } from './routes/notes.tsx';
import SearchPage, { loader as searchLoader, tagName as searchTag } from './routes/search.tsx';
import SettingsPage, {
  loader as settingsLoader,
  tagName as settingsTag,
} from './routes/settings.tsx';
import WcInteropPage, { tagName as wcInteropTag } from './routes/wc-interop.tsx';

// Prevent tree-shaking: default exports trigger customElements.define side effects
void BookshelfPage; void ReadingPage; void NotesPage;
void SearchPage; void SettingsPage; void WcInteropPage;

// ─── Route config ──────────────────────────────────────────

const routes = [
  { path: '/', loader: bookshelfLoader, component: () => bookshelfTag, tagName: bookshelfTag },
  { path: '/books/:id', loader: readingLoader, action: readingAction, component: () => readingTag, tagName: readingTag },
  { path: '/notes', loader: notesLoader, component: () => notesTag, tagName: notesTag },
  { path: '/search', loader: searchLoader, component: () => searchTag, tagName: searchTag },
  { path: '/settings', loader: settingsLoader, component: () => settingsTag, tagName: settingsTag },
  { path: '/wc-interop', component: () => wcInteropTag, tagName: wcInteropTag },
];

// ─── Boot ───────────────────────────────────────────────────

const app = defineApp({ mode: 'spa', routes });
app.mount('#root');
setRouter(app.router);

// Keyboard shortcuts
document.addEventListener('keydown', (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
    e.preventDefault();
    app.router?.navigate('/search');
  }
  if ((e.metaKey || e.ctrlKey) && e.key === ',') {
    e.preventDefault();
    app.router?.navigate('/settings');
  }
});
