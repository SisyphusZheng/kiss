import type { Plugin } from 'vite';
import mdx from '@mdx-js/rollup';

export interface OpenMdxPluginOptions {
  jsxImportSource?: string;
  development?: boolean;
}

export function mdxPlugin(options: OpenMdxPluginOptions = {}): Plugin {
  const plugin = mdx({
    jsxImportSource: options.jsxImportSource ?? '@openelement/element',
    providerImportSource: undefined,
    development: options.development ?? false,
  }) as Plugin;

  return {
    ...plugin,
    name: 'open:mdx',
    enforce: 'pre',
  };
}
