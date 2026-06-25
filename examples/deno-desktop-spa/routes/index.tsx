import { useSignal } from '@preact/signals';

export default function Home() {
  const count = useSignal(0);
  return (
    <div>
      <h1>openElement Desktop — Deno Desktop Proof</h1>
      <p>
        This page is rendered via <code>defineApp({'{'} mode: 'spa' {'}'})</code>{' '}
        inside a Deno Desktop window.
      </p>
      <button type='button' onClick={() => count.value += 1}>
        Count: {count}
      </button>
    </div>
  );
}
