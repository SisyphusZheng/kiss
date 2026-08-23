import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from 'node:path';
import {
  loadCollectionData,
  writeCollectionDataModule,
} from '../src/internal/content/collection/data.ts';
import type { CollectionOptions } from '../src/internal/content/collection/types.ts';

const schema: CollectionOptions['schema'] = {
  fields: {
    title: { type: 'string', required: true },
    order: { type: 'number', required: true },
    locale: { type: 'string', default: 'en' },
  },
  transform(frontmatter, context) {
    const localized = context.slug.match(/^(.*)\.([a-z]{2})$/);
    return {
      slug: localized?.[1] ?? context.slug,
      frontmatter: { ...frontmatter, locale: localized?.[2] ?? 'en' },
    };
  },
};

Deno.test('collection data validates schema, derives metadata, and uses the shared sanitizer', async () => {
  const root = await Deno.makeTempDir({ prefix: 'oe-collection-' });
  try {
    await Deno.writeTextFile(
      join(root, 'start.zh.md'),
      `---\ntitle: 开始\norder: 1\n---\n## Safe\n<script>alert(1)</script>\n[link](javascript:alert(1))`,
    );
    const options: CollectionOptions = { contentDir: root, schema };
    const pages = await loadCollectionData('guide', options);
    assertEquals(pages.length, 1);
    assertEquals(pages[0].slug, 'start');
    assertEquals(pages[0].locale, 'zh');
    assertEquals(pages[0].frontmatter, { title: '开始', order: 1, locale: 'zh' });
    assertEquals(pages[0].html.includes('<script'), false);
    assertEquals(pages[0].html.includes('javascript:'), false);

    const module = writeCollectionDataModule('guide', pages, options);
    assertStringIncludes(module, 'collection:guide');
    assertStringIncludes(module, '"order": number;');
    assertStringIncludes(module, 'getPage(slug: string, locale?: string)');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('collection schema fails closed on missing required frontmatter', async () => {
  const root = await Deno.makeTempDir({ prefix: 'oe-collection-invalid-' });
  try {
    await Deno.writeTextFile(join(root, 'broken.md'), '---\ntitle: Broken\n---\nBody');
    await assertRejects(
      () => loadCollectionData('guide', { contentDir: root, schema }),
      Error,
      'frontmatter.order is required',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
