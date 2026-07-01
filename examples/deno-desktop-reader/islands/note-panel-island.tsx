import { h } from 'preact';
import { useState } from 'preact/hooks';
import { definePreactIsland } from '@openelement/app/preact';

interface NotePanelProps {
  count?: string;
}

function NotePanelIsland(props: NotePanelProps) {
  const [open, setOpen] = useState(false);
  const count = Number(props.count ?? 0);
  return h('aside', { class: 'note-panel-island' }, [
    h(
      'style',
      null,
      `
        .hint-toggle {
          background: var(--bg-inset, #fafaf8);
          border: 1px solid var(--border, #ececea);
          border-radius: var(--radius-md, 8px);
          color: var(--text-secondary, #4a4a48);
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          padding: 8px 12px;
          transition: border-color 0.12s ease, color 0.12s ease;
        }
        .hint-toggle:hover {
          border-color: var(--border-hover, #b8b8b4);
          color: var(--text-primary, #1a1a1a);
        }
        .hint-text {
          color: var(--text-muted, #888884);
          font-size: 13px;
          line-height: 1.6;
          margin: 10px 0 0;
        }
      `,
    ),
    h(
      'button',
      {
        class: 'hint-toggle',
        type: 'button',
        onClick: () => setOpen((value) => !value),
      },
      open ? '隐藏提示' : '笔记提示',
    ),
    open
      ? h(
        'p',
        { class: 'hint-text' },
        count === 0
          ? '这本书目前还没有笔记。在下方表单中写下你的想法，保存后会显示在这里。'
          : `这本书已有 ${count} 条笔记。在下方表单中可以为当前页面添加新笔记。`,
      )
      : null,
  ]);
}

definePreactIsland('note-panel-island', NotePanelIsland, { ssr: false });
