/**
 * Contributing Page - v4 lab page: mono/serif masthead, setup terminal,
 * PR checklist, numbered help rows, and a questions-first callout.
 */
import { definePage } from '@openelement/app';
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { localizePath } from '@openelement/site-ui/link.ts';
import PageContributing from '../components/page-contributing.tsx';

export const meta = { section: '', label: 'Contributing', order: 30 };

const content = {
  en: {
    eyebrow: 'Contributing — Join the lab',
    monoLine: 'BUILD IT',
    serifLine: 'with us.',
    lede: 'A precise, Deno-first contributor workflow for the Web Standards Lab.',
    setupAriaLabel: 'Development setup',
    setupLabel: '§1 — Setup',
    setupCopyBefore:
      'openElement core CLI, SSG, serverless API, tests, publishing, and docs site tasks all use Deno 2.8+ as the default runtime. Vite runs via ',
    setupCopyVite: 'deno run -A npm:vite',
    setupCopyBetween: ' — no ',
    setupCopyNpm: 'npm',
    setupCopyAnd: ' or ',
    setupCopyNpx: 'npx',
    setupCopyAfter: ' needed for the main workflow.',
    releaseLabel: 'Release line',
    releaseItems: [
      {
        id: 'versions',
        before: 'Update version numbers (',
        code1: 'packages/*/deno.json',
        middle1: ')',
        code2: '',
        middle2: '',
        code3: '',
        after: '',
      },
      {
        id: 'changelog',
        before: 'Update the changelog',
        code1: '',
        middle1: '',
        code2: '',
        middle2: '',
        code3: '',
        after: '',
      },
      {
        id: 'test',
        before: 'Run ',
        code1: 'deno task test',
        middle1: '',
        code2: '',
        middle2: '',
        code3: '',
        after: '',
      },
      {
        id: 'publish',
        before: 'Publish via ',
        code1: 'deno task publish:jsr',
        middle1: ', ',
        code2: 'deno task publish:npm',
        middle2: ', ',
        code3: 'deno task pack:dry-run',
        after: '',
      },
      {
        id: 'release',
        before: 'Create the GitHub Release',
        code1: '',
        middle1: '',
        code2: '',
        middle2: '',
        code3: '',
        after: '',
      },
    ],
    beforePrLabel: '§2 — Before a PR',
    checklist: [
      {
        id: 'format',
        checkboxClass: 'checkbox',
        mark: '✓',
        text: 'deno fmt + deno lint stay clean',
      },
      {
        id: 'commits',
        checkboxClass: 'checkbox',
        mark: '✓',
        text: 'Conventional Commits (feat / fix / docs / refactor / test / chore)',
      },
      {
        id: 'gates',
        checkboxClass: 'checkbox',
        mark: '✓',
        text: 'Gates green locally — deno task test before push',
      },
      {
        id: 'adr',
        checkboxClass: 'checkbox open',
        mark: '',
        text: 'Architectural change? Write the ADR first',
      },
    ],
    layeringCopy:
      'Layering discipline: before adding a feature, check whether it can be solved at a lower level — L0 HTML, L1 CSS, L2 Browser API, L3 Hono/Vite/Lit, then L4 custom code.',
    helpLabel: '§3 — Where to help',
    helpRows: [
      {
        id: 'corpus',
        index: '01',
        title: 'Third-party WC corpus',
        copy:
          'Lit / FAST / Stencil components that render through our DSD smoke pipeline, with evidence.',
      },
      {
        id: 'dogfood',
        index: '02',
        title: 'Dogfood something real',
        copy:
          'Build an application on the stable line and file what breaks. That is the pilot now.',
      },
      {
        id: 'docs',
        index: '03',
        title: 'Documentation truth',
        copy: 'Run the docs gates, fix stale claims, and keep the public surface evidence-backed.',
      },
    ],
    calloutLabel: 'Questions first',
    calloutIntro: 'Use ',
    discussionsLabel: 'GitHub Discussions',
    calloutBetween: ' for usage and design. ',
    issuesLabel: 'Issues',
    calloutAfter: ' for reproducible bugs, documentation defects, and agreed proposals.',
    changelogLabel: 'Changelog',
    roadmapLabel: 'Roadmap',
  },
} as const;

export default definePage(PageContributing, {
  props({ locale }) {
    const resolved = contentLocale(locale ?? 'en');
    const text = content.en;
    return {
      ...text,
      discussionsHref: 'https://github.com/open-element/openelement/discussions',
      issuesHref: 'https://github.com/open-element/openelement/issues',
      changelogHref: localizePath('/changelog', resolved),
      roadmapHref: localizePath('/roadmap', resolved),
    };
  },
});
