/**
 * KISS Docs navigation data.
 * 
 * Data-driven sidebar + header navigation for the docs site.
 * Lives here so nav changes don't require rebuilding @kissjs/ui.
 */

export interface NavItem {
  path: string;
  label: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface HeaderNavItem {
  href: string;
  label: string;
}

export const SIDEBAR_NAV: NavSection[] = [
  {
    section: 'Introduction',
    items: [
      { path: '/guide/getting-started', label: 'Getting Started' },
      { path: '/guide/design-philosophy', label: 'Design Philosophy' },
      { path: '/guide/architecture', label: 'KISS Architecture' },
    ],
  },
  {
    section: 'Core',
    items: [
      { path: '/guide/routing', label: 'Routing' },
      { path: '/guide/islands', label: 'Islands' },
      { path: '/guide/api-routes', label: 'API Routes' },
      { path: '/guide/api-design', label: 'API Design' },
      { path: '/guide/ssg', label: 'SSG' },
    ],
  },
  {
    section: 'Guides',
    items: [
      { path: '/guide/configuration', label: 'Configuration' },
      { path: '/guide/error-handling', label: 'Error Handling' },
      { path: '/guide/security-middleware', label: 'Security & Middleware' },
      { path: '/guide/testing', label: 'Testing' },
    ],
  },
  {
    section: 'Reference',
    items: [
      { path: '/guide/deployment', label: 'Deployment' },
      { path: '/styling/kiss-ui', label: '@kissjs/ui' },
      { path: '/styling/web-awesome', label: 'Web Awesome' },
    ],
  },
  {
    section: 'Architecture',
    items: [
      { path: '/guide/kiss-compiler', label: 'KISS Compiler' },
      { path: '/guide/pwa', label: 'PWA Support' },
      { path: '/guide/blog-system', label: 'Blog System' },
      { path: '/roadmap', label: 'Roadmap' },
    ],
  },
  {
    section: 'UI',
    items: [{ path: '/ui', label: 'Design System' }],
  },
  {
    section: 'Examples',
    items: [
      { path: '/demo', label: 'Live Demo' },
      { path: '/examples', label: 'Overview' },
      { path: '/examples/hello', label: 'Hello World' },
      { path: '/examples/minimal-blog', label: 'Minimal Blog' },
      { path: '/examples/fullstack', label: 'Fullstack' },
    ],
  },
  {
    section: 'Blog',
    items: [
      { path: '/blog', label: 'All Posts' },
      { path: '/blog/kiss-compiler', label: 'KISS Compiler' },
    ],
  },
  {
    section: 'Project',
    items: [
      { path: '/changelog', label: 'Changelog' },
      { path: '/contributing', label: 'Contributing' },
    ],
  },
];

export const HEADER_NAV: HeaderNavItem[] = [
  { href: '/guide/getting-started', label: 'Docs' },
  { href: '/ui', label: 'UI' },
  { href: '/blog', label: 'Blog' },
  { href: '/demo', label: 'Demo' },
  { href: 'https://jsr.io/@kissjs/core', label: 'JSR' },
];
