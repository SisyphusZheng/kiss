import { h } from 'preact';
import { useState } from 'preact/hooks';
import { definePreactIsland } from '@openelement/app/preact';

interface SearchBoxProps {
  query?: string;
}

function SearchBoxIsland(props: SearchBoxProps) {
  const [query, setQuery] = useState(props.query ?? '');
  return h(
    'form',
    {
      class: 'search-island',
      onSubmit: (event: Event) => {
        event.preventDefault();
        location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      },
    },
    [
      h(
        'style',
        null,
        `
        form{display:flex;gap:8px;margin:16px 0}
        input{flex:1;border:1px solid #ccd5df;border-radius:6px;padding:10px 12px;font:15px system-ui}
        button{border:1px solid #2f5f55;background:#2f5f55;color:white;border-radius:6px;padding:10px 14px}
      `,
      ),
      h('input', {
        'aria-label': 'Search library',
        value: query,
        placeholder: 'Search titles, notes, and indexed PDF text',
        onInput: (event: Event) => setQuery((event.currentTarget as HTMLInputElement).value),
      }),
      h('button', { type: 'submit' }, 'Search'),
    ],
  );
}

definePreactIsland('search-box-island', SearchBoxIsland, { ssr: false });
