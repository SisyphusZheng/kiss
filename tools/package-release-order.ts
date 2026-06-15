export interface ReleasePackageStep {
  pkg: string;
  dir: string;
}

export const RELEASE_PACKAGE_ORDER: ReleasePackageStep[] = [
  { pkg: '@openelement/protocol', dir: 'packages/protocol' },
  { pkg: '@openelement/signal', dir: 'packages/signal' },
  { pkg: '@openelement/create', dir: 'packages/create' },
  { pkg: '@openelement/core', dir: 'packages/core' },
  { pkg: '@openelement/content', dir: 'packages/content' },
  { pkg: '@openelement/element', dir: 'packages/element' },
  { pkg: '@openelement/router', dir: 'packages/router' },
  { pkg: '@openelement/ssg', dir: 'packages/ssg' },
  { pkg: '@openelement/adapter-vite', dir: 'packages/adapter-vite' },
  { pkg: '@openelement/ui', dir: 'packages/ui' },
  { pkg: '@openelement/app', dir: 'packages/app' },
];
