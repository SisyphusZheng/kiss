import { definePage } from '@openelement/app';
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { localizePath } from '@openelement/site-ui/link.ts';
import Page404 from '../components/page-404.tsx';

const marquee =
  'CUSTOM ELEMENTS ✳ SHADOW DOM ✳ DECLARATIVE SHADOW DOM ✳ ES MODULES ✳ SIGNALS ✳ HTML FIRST ✳ 404 ✳ ';

const content = {
  en: {
    serifLine: 'Lost in the shadow DOM.',
    lede: 'This route never mounted. The page you want is probably one declarative template away.',
    backHome: 'Back home',
    readDocs: 'Read the docs',
  },
  zh: {
    serifLine: '迷失在 shadow DOM 里。',
    lede: '这个路由从未被挂载。你要找的页面，也许只差一个 declarative template。',
    backHome: '回到首页',
    readDocs: '阅读文档',
  },
} as const;

export default definePage(Page404, {
  props({ locale }) {
    const resolved = contentLocale(locale ?? 'en');
    const text = content[resolved];
    return {
      serifLine: text.serifLine,
      lede: text.lede,
      backHome: text.backHome,
      readDocs: text.readDocs,
      homeHref: localizePath('/', resolved),
      docsHref: localizePath('/docs', resolved),
      marqueeText: marquee + marquee,
    };
  },
});
