/** @jsxImportSource @openelement/core */
import { defineApp } from '@openelement/app/spa';
import { setRouter } from './router.ts';

// Register @openelement/ui custom elements on page load
import '@openelement/ui';

// Import route components for SPA routing
import BookshelfRoute from './routes/index.tsx';
import ReadingRoute from './routes/books/[id].tsx';
import NotesRoute from './routes/notes.tsx';
import SearchRoute from './routes/search.tsx';
import SettingsRoute from './routes/settings.tsx';
import WcInteropRoute from './routes/wc-interop.tsx';

import type { RouteConfig } from '@openelement/router/client-router';

const routes: RouteConfig[] = [
  { path: '/', component: BookshelfRoute },
  { path: '/books/:id', component: ReadingRoute },
  { path: '/notes', component: NotesRoute },
  { path: '/search', component: SearchRoute },
  { path: '/settings', component: SettingsRoute },
  { path: '/wc-interop', component: WcInteropRoute },
];

export default function Reader() {
  const app = defineApp({ mode: 'spa', routes });
  setRouter(app.router);
  app.mount('#root');

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
