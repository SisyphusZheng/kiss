/** @jsxImportSource @openelement/core */
import { defineApp } from '@openelement/app/spa';
import { setRouter } from './router.ts';

import '@openelement/ui';
import { daisyClassSheet, openPropsRootSheet } from '@openelement/ui';

// ─── Inject design system ───────────────────────────────────

const tokenStyle = document.createElement('style');
tokenStyle.textContent = [...openPropsRootSheet.cssRules].map((r) => r.cssText)
  .join('\n');
document.head.appendChild(tokenStyle);

const daisyStyle = document.createElement('style');
daisyStyle.textContent = [...daisyClassSheet.cssRules].map((r) => r.cssText)
  .join('\n');
document.head.appendChild(daisyStyle);

// Apply persisted theme before app mount to avoid flash.
try {
  const stored = localStorage.getItem('mastodon:settings');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.theme === 'dark' || parsed.theme === 'light') {
      document.documentElement.setAttribute('data-theme', parsed.theme);
    }
  }
} catch {
  // ignore
}

import './app/styles.css';

// Import route modules for side-effect: customElements.define + exports.
import TimelinePage, { loader as timelineLoader, tagName as timelineTag } from './routes/index.tsx';
import ProfilePage, { loader as profileLoader, tagName as profileTag } from './routes/profile.tsx';
import StatusPage, { loader as statusLoader, tagName as statusTag } from './routes/status.tsx';

void TimelinePage;
void ProfilePage;
void StatusPage;

// ─── Route config ────────────────────────────────────────────

const routes = [
  { path: '/', loader: timelineLoader, tagName: timelineTag },
  { path: '/profile/:acct', loader: profileLoader, tagName: profileTag },
  { path: '/status/:id', loader: statusLoader, tagName: statusTag },
];

// ─── Top navigation ──────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/', label: 'Timeline' },
];

function createTopNav() {
  const nav = document.createElement('nav');
  nav.className = 'mastodon-topnav';
  nav.innerHTML = `
    <a class="mastodon-brand" href="/" data-nav="/">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      Mastodon Desktop
    </a>
    <div class="mastodon-nav-menu">
      ${
    NAV_ITEMS.map((item) => `
        <button class="mastodon-nav-item" data-nav="${item.path}">${item.label}</button>
      `).join('')
  }
    </div>
    <div class="mastodon-nav-right">
      <open-theme-toggle></open-theme-toggle>
    </div>
  `;

  nav.querySelectorAll('.mastodon-nav-item[data-nav], .mastodon-brand[data-nav]').forEach(
    (link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = (link as HTMLElement).dataset.nav;
        if (path) app.router?.navigate(path);
      });
    },
  );

  return nav;
}

function updateActiveNav(path: string) {
  document.querySelectorAll('.mastodon-nav-item').forEach((link) => {
    const navPath = (link as HTMLElement).dataset.nav;
    if (!navPath) return;
    if (navPath === '/' ? path === '/' : path.startsWith(navPath)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ─── Boot ────────────────────────────────────────────────────

const app = defineApp({ mode: 'spa', routes });

const root = document.querySelector('#root');
if (root) {
  const layout = document.createElement('div');
  layout.className = 'mastodon-layout';
  root.parentNode?.insertBefore(layout, root);
  layout.appendChild(createTopNav());
  const content = document.createElement('div');
  content.className = 'mastodon-content';
  content.appendChild(root);
  layout.appendChild(content);
}

app.mount('#root');
setRouter(app.router);

updateActiveNav(app.router?.currentPath ?? location.pathname + location.search);
