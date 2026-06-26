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
        button{border:1px solid #cfd6df;background:#fff;border-radius:6px;padding:8px 10px}
        p{font:13px system-ui;color:#64707d;margin:8px 0 0}
      `,
    ),
    h(
      'button',
      { type: 'button', onClick: () => setOpen((value) => !value) },
      open ? 'Hide note help' : 'Note help',
    ),
    open
      ? h(
        'p',
        null,
        `This book has ${count} saved note${
          count === 1 ? '' : 's'
        }. Use the OpenElement form below to save another note for the current page.`,
      )
      : null,
  ]);
}

definePreactIsland('note-panel-island', NotePanelIsland, { ssr: false });
