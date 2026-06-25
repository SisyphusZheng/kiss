/** @jsxImportSource @openelement/core */
import { defineApp } from '@openelement/app/spa';
import { setRouter } from './router.ts';

// Register @openelement/ui custom elements on page load
import '@openelement/ui';

// Import route components for SPA routing
import BookshelfRoute, { loader as bookshelfLoader } from './routes/index.tsx';
import ReadingRoute, {
  action as readingAction,
  loader as readingLoader,
} from './routes/books/[id].tsx';
import NotesRoute, { loader as notesLoader } from './routes/notes.tsx';
import SearchRoute, { loader as searchLoader } from './routes/search.tsx';
import SettingsRoute, { loader as settingsLoader } from './routes/settings.tsx';
import WcInteropRoute from './routes/wc-interop.tsx';

import type { RouteConfig } from '@openelement/router/client-router';

const routes: RouteConfig[] = [
  { path: '/', loader: bookshelfLoader, component: BookshelfRoute },
  {
    path: '/books/:id',
    loader: readingLoader,
    action: readingAction,
    component: ReadingRoute,
  },
  { path: '/notes', loader: notesLoader, component: NotesRoute },
  { path: '/search', loader: searchLoader, component: SearchRoute },
  { path: '/settings', loader: settingsLoader, component: SettingsRoute },
  { path: '/wc-interop', component: WcInteropRoute },
];

export default function Reader() {
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

  return null;
}

// Auto-start
if (typeof document !== 'undefined') {
  Reader();
}
