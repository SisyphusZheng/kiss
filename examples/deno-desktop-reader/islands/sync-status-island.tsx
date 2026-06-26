import { h } from 'preact';
import { useState } from 'preact/hooks';
import { definePreactIsland } from '@openelement/app/preact';

interface SyncStatusProps {
  'source-id'?: string;
}

function SyncStatusIsland(props: SyncStatusProps) {
  const [state, setState] = useState<'idle' | 'syncing' | 'done' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');
  const sourceId = props['source-id'] ?? 'fixtures';
  return h('span', { class: 'sync-island' }, [
    h(
      'style',
      null,
      `
        button{border:1px solid #c9d2dc;background:#fff;border-radius:999px;padding:5px 10px}
        small{margin-left:6px;color:#68727e}
      `,
    ),
    h(
      'button',
      {
        type: 'button',
        disabled: state === 'syncing',
        onClick: async () => {
          setState('syncing');
          setMessage('Syncing...');
          try {
            const res = await fetch(
              `/api/sources/${encodeURIComponent(sourceId)}/sync`,
              {
                method: 'POST',
              },
            );
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            setState('done');
            setMessage('Synced');
            setTimeout(() => location.reload(), 350);
          } catch (err) {
            setState('error');
            setMessage(err instanceof Error ? err.message : String(err));
          }
        },
      },
      'Sync',
    ),
    h('small', null, message),
  ]);
}

definePreactIsland('sync-status-island', SyncStatusIsland, { ssr: false });
