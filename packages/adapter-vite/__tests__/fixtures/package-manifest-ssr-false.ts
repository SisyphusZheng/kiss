/**
 * Fixture: Package manifest with ssr: false declaration
 *
 * This mock package manifest declares a component with ssr: false.
 * The SSR admission plan should treat it as client-only.
 */

import type { OpenElementPackageManifest } from '@openelement/element';

export const manifest: OpenElementPackageManifest = {
  packageName: '@test/package-island-ssr-false',
  schemaVersion: '1.0.0',
  version: '0.0.1',
  declarations: [
    {
      tagName: 'package-ssr-false',
      openElement: {
        module: './dist/package-island-ssr-false.js',
        ssr: false,
        dsd: false,
        hydrate: 'idle',
      },
    },
  ],
};
