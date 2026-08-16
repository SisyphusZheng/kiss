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

export const MAX_LIVE_EVENTS = 100;
export const MAX_RECONNECT_DELAY_MS = 30_000;

export interface LiveNoteEvent {
  id: string;
  body: string;
}

/** Stable-id dedupe with an explicit DOM/memory bound. */
export function mergeLiveEvent(
  events: readonly LiveNoteEvent[],
  incoming: LiveNoteEvent,
  maximum = MAX_LIVE_EVENTS,
): LiveNoteEvent[] {
  if (events.some((event) => event.id === incoming.id)) return [...events];
  return [incoming, ...events].slice(0, Math.max(0, maximum));
}

/** Capped exponential retry with full jitter; random is injectable for tests. */
export function reconnectDelayMs(attempt: number, random = Math.random): number {
  const cap = Math.min(MAX_RECONNECT_DELAY_MS, 1_000 * 2 ** Math.max(0, attempt));
  return Math.floor(random() * cap);
}

export default class NotesLive extends OpenElement {
  #status = signal('idle');
  #events = signal<LiveNoteEvent[]>([]);
  #liveNodes = computed((): VNode[] => [
    <p key='status' id='live-status'>realtime: {this.#status.value}</p>,
    <ul key='events' id='live-events'>
      {this.#events.value.map((event) => <li key={event.id}>{event.body}</li>)}
    </ul>,
  ]);

  #client: SupabaseClient | null = null;
  #channel: RealtimeChannel | null = null;
  #reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  #reconnectAttempt = 0;

  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, 'data-access-token'];
  }

  constructor() {
    super();
    this.registerSignal('liveNodes', this.#liveNodes);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    globalThis.addEventListener?.('online', this.#onOnline);
    globalThis.addEventListener?.('offline', this.#onOffline);
    this.#connect();
  }

  #connect(): void {
    if (!this.isConnected || this.#channel) return;
    const url = this.getAttribute('data-url');
    const key = this.getAttribute('data-key');
    const userId = this.getAttribute('data-user-id');
    const accessToken = this.getAttribute('data-access-token');
    if (!url || !key || !userId) {
      this.#status.value = 'unconfigured';
      return;
    }
    this.#status.value = 'connecting';
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
          const row = payload.new as { id?: string; body?: string };
          if (typeof row.id === 'string' && typeof row.body === 'string') {
            this.#events.value = mergeLiveEvent(this.#events.value, {
              id: row.id,
              body: row.body,
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.#reconnectAttempt = 0;
          this.#status.value = 'subscribed';
          return;
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.#status.value = 'degraded';
          this.#scheduleReconnect();
          return;
        }
      });
  }

  #scheduleReconnect(): void {
    if (this.#reconnectTimer !== undefined || !this.isConnected) return;
    const delay = reconnectDelayMs(this.#reconnectAttempt++);
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = undefined;
      void this.#releaseChannel().then(() => this.#connect());
    }, delay);
  }

  #releaseChannel(): Promise<unknown> {
    const channel = this.#channel;
    const client = this.#client;
    this.#channel = null;
    this.#client = null;
    if (!channel) return Promise.resolve();
    return client ? client.removeChannel(channel) : channel.unsubscribe();
  }

  #reconnectNow = (): void => {
    if (this.#reconnectTimer !== undefined) clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = undefined;
    this.#reconnectAttempt = 0;
    void this.#releaseChannel().then(() => this.#connect());
  };

  #onOnline = (): void => {
    this.#status.value = 'connecting';
    this.#reconnectNow();
  };

  #onOffline = (): void => {
    this.#status.value = 'offline';
  };

  override attributeChangedCallback(name: string, oldValue: string | null, value: string | null) {
    super.attributeChangedCallback(name, oldValue, value);
    if (name === 'data-access-token' && value && value !== oldValue) {
      this.#client?.realtime.setAuth(value);
    }
  }

  override disconnectedCallback(): void {
    globalThis.removeEventListener?.('online', this.#onOnline);
    globalThis.removeEventListener?.('offline', this.#onOffline);
    if (this.#reconnectTimer !== undefined) clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = undefined;
    void this.#releaseChannel();
    super.disconnectedCallback();
  }

  override render() {
    return (
      <section id='notes-live'>
        <h2>Live updates</h2>
        <div data-signal-render='liveNodes' />
        <button type='button' onClick={this.#reconnectNow}>Reconnect</button>
      </section>
    );
  }
}

defineCustomElement(tagName, NotesLive);
