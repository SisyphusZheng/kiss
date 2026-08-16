/**
 * notes-live — Realtime island (reference starter, #983).
 *
 * Subscribes to INSERT events on public.notes via supabase-js in the
 * browser. The page feeds it the project's public URL + anon key, the
 * signed-in user's id, and their short-lived access token through data
 * attributes from the loader (the anon key is public by design; the access
 * token scopes the realtime connection through RLS so the island only ever
 * receives rows the owner could SELECT — reinforced by the hard
 * user_id=eq.<uid> filter). No service-role key ever reaches this bundle.
 *
 * connectedCallback subscribes; disconnectedCallback unsubscribes and
 * removes the channel — SSR never runs lifecycle callbacks (instantiate →
 * render → DSD), so all browser work stays in connectedCallback.
 */
import { computed, defineCustomElement, OpenElement, signal } from '@openelement/element';
import type { VNode } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

export const tagName = 'notes-live';
export const openElement = defineIslandConfig({
  hydrate: 'load',
  ssr: true,
  dsd: true,
});

export default class NotesLive extends OpenElement {
  #status = signal('idle');
  #events = signal<string[]>([]);
  #liveNodes = computed((): VNode[] => [
    <p key='status' id='live-status'>realtime: {this.#status.value}</p>,
    <ul key='events' id='live-events'>
      {this.#events.value.map((body, index) => <li key={`${index}-${body}`}>{body}</li>)}
    </ul>,
  ]);

  #client: SupabaseClient | null = null;
  #channel: RealtimeChannel | null = null;

  constructor() {
    super();
    this.registerSignal('liveNodes', this.#liveNodes);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const url = this.getAttribute('data-url');
    const key = this.getAttribute('data-key');
    const userId = this.getAttribute('data-user-id');
    const accessToken = this.getAttribute('data-access-token');
    if (!url || !key || !userId) {
      this.#status.value = 'unconfigured';
      return;
    }
    const client = createClient(url, key);
    // Hosted Realtime scopes postgres_changes by RLS: without the user's
    // short-lived access token the connection is `anon`, which has no
    // SELECT policy on notes and would receive nothing. setAuth upgrades
    // the realtime connection only — no session is persisted client-side.
    if (accessToken) client.realtime.setAuth(accessToken);
    this.#client = client;
    this.#channel = client
      .channel('notes-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const body = (payload.new as { body?: string }).body;
          if (typeof body === 'string') {
            this.#events.value = [body, ...this.#events.value];
          }
        },
      )
      .subscribe((status) => {
        this.#status.value = status === 'SUBSCRIBED' ? 'subscribed' : status.toLowerCase();
      });
  }

  override disconnectedCallback(): void {
    const channel = this.#channel;
    const client = this.#client;
    this.#channel = null;
    this.#client = null;
    if (channel) {
      // removeChannel unsubscribes the channel and closes its socket share.
      if (client) void client.removeChannel(channel);
      else void channel.unsubscribe();
    }
    super.disconnectedCallback();
  }

  override render() {
    return (
      <section id='notes-live'>
        <h2>Live updates</h2>
        <div data-signal-render='liveNodes' />
      </section>
    );
  }
}

defineCustomElement(tagName, NotesLive);
