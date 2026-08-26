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
import { type RealtimeChannel, RealtimeClient } from '@supabase/realtime-js';

export const tagName = 'notes-live';
export const openElement = defineIslandConfig({
  hydrate: 'load',
  ssr: true,
  dsd: true,
});

export const MAX_LIVE_EVENTS = 100;
export const MAX_RECONNECT_DELAY_MS = 30_000;
export const RECONCILE_INTERVAL_MS = 10_000;
export interface NotesAccessToken {
  accessToken: string;
  expiresAt: number | null;
}

export interface LiveNoteEvent {
  id: string;
  body: string;
  createdAt?: string;
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

/** Merge a newest-first Data API snapshot with possibly incomplete live events. */
export function mergeReconciledEvents(
  events: readonly LiveNoteEvent[],
  snapshot: readonly LiveNoteEvent[],
  maximum = MAX_LIVE_EVENTS,
): LiveNoteEvent[] {
  const existing = new Map(events.map((event) => [event.id, event]));
  const seen = new Set<string>();
  const merged: LiveNoteEvent[] = [];
  for (const event of [...snapshot, ...events]) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    merged.push(existing.get(event.id) ?? event);
  }
  merged.sort((left, right) => {
    if (!left.createdAt || !right.createdAt) return 0;
    return right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id);
  });
  return merged.slice(0, Math.max(0, maximum));
}

/** Capped exponential retry with full jitter; random is injectable for tests. */
export function reconnectDelayMs(attempt: number, random = Math.random): number {
  const cap = Math.min(MAX_RECONNECT_DELAY_MS, 1_000 * 2 ** Math.max(0, attempt));
  return Math.floor(random() * cap);
}

export function shouldRefreshAccessToken(
  expiresAtSeconds: number | null,
  nowMs = Date.now(),
): boolean {
  return (expiresAtSeconds ?? 0) * 1_000 <= nowMs + 60_000;
}

export async function requestNotesAccessToken(
  fetchImpl: typeof fetch = fetch,
): Promise<NotesAccessToken> {
  const response = await fetchImpl('/api/session-token', {
    method: 'POST',
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Session renewal failed (${response.status})`);
  return response.json() as Promise<NotesAccessToken>;
}

/**
 * Fetch the newest-first notes snapshot through the RLS Data API with a
 * bounded retry: one 401 forces a session refresh, the fresh token is handed
 * back through onRefreshed (Realtime setAuth), and the request is retried
 * exactly once. A failed refresh, a failed retry — including another 401 —
 * or any other non-2xx response throws, so the caller fails closed into its
 * degraded path instead of looping. fetchImpl is injectable for tests.
 */
export async function fetchNotesSnapshot(options: {
  url: string;
  key: string;
  userId: string;
  token: string;
  refreshToken: () => Promise<string | null>;
  onRefreshed?: (token: string) => void | Promise<void>;
  fetchImpl?: typeof fetch;
}): Promise<LiveNoteEvent[]> {
  const { url, key, userId, refreshToken, onRefreshed } = options;
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = new URL(`${url.replace(/\/$/, '')}/rest/v1/notes`);
  endpoint.searchParams.set('select', 'id,body,created_at');
  endpoint.searchParams.set('user_id', `eq.${userId}`);
  endpoint.searchParams.set('order', 'created_at.desc,id.desc');
  endpoint.searchParams.set('limit', String(MAX_LIVE_EVENTS));
  const reconcile = (token: string) =>
    fetchImpl(endpoint, {
      cache: 'no-store',
      headers: { apikey: key, authorization: `Bearer ${token}` },
    });
  let response = await reconcile(options.token);
  if (response.status === 401) {
    const fresh = await refreshToken();
    if (!fresh) throw new Error('Notes session renewal failed');
    await onRefreshed?.(fresh);
    response = await reconcile(fresh);
  }
  if (!response.ok) throw new Error(`Notes reconciliation failed with HTTP ${response.status}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) throw new Error('Notes reconciliation returned a non-array');
  const snapshot: LiveNoteEvent[] = [];
  for (const row of payload) {
    if (
      typeof row === 'object' && row !== null &&
      typeof (row as { id?: unknown }).id === 'string' &&
      typeof (row as { body?: unknown }).body === 'string' &&
      typeof (row as { created_at?: unknown }).created_at === 'string'
    ) {
      snapshot.push({
        id: (row as { id: string }).id,
        body: (row as { body: string }).body,
        createdAt: (row as { created_at: string }).created_at,
      });
    }
  }
  return snapshot;
}

/** Prefer a fresh DOM handoff, then reuse private memory for later reconnects. */
export function resolveRealtimeAuthToken(
  attributeToken: string | null,
  retainedToken: string | null,
): string | null {
  return attributeToken || retainedToken;
}

/**
 * Move the short-lived SSR credential into Realtime and erase the DOM copy.
 * A token observed before the client exists must stay in place so #connect can
 * consume it later; removal is proof that setAuth was actually invoked.
 */
export function handoffRealtimeAuth(
  client: Pick<RealtimeClient, 'setAuth'> | null,
  host: Pick<Element, 'removeAttribute'>,
  accessToken: string | null,
): boolean {
  if (!client || !accessToken) return false;
  client.setAuth(accessToken);
  host.removeAttribute('data-access-token');
  return true;
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

  #client: RealtimeClient | null = null;
  #channel: RealtimeChannel | null = null;
  #accessToken: string | null = null;
  #accessTokenExpiresAt: number | null = null;
  #accessTokenRefresh: Promise<string | null> | null = null;
  #reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  #reconcileTimer: ReturnType<typeof setTimeout> | undefined;
  #reconnectAttempt = 0;
  #reconcileAttempt = 0;
  #connectionGeneration = 0;

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
    this.#accessToken = resolveRealtimeAuthToken(accessToken, this.#accessToken);
    this.#accessTokenExpiresAt = Number(this.getAttribute('data-access-token-expires-at')) || null;
    if (!url || !key || !userId) {
      this.#status.value = 'unconfigured';
      return;
    }
    this.#status.value = 'connecting';
    // This island only needs Realtime. Importing createClient from
    // supabase-js also bundles Auth, PostgREST, Storage, and Functions into
    // the browser chunk, duplicating server-only capabilities. Connect to
    // the same Realtime endpoint directly and keep the island single-purpose.
    const client = new RealtimeClient(`${url.replace(/\/$/, '')}/realtime/v1`, {
      params: { apikey: key },
      accessToken: () => this.#validAccessToken(),
    });
    // Hosted Realtime scopes postgres_changes by RLS: without the user's
    // short-lived access token the connection is `anon`, which has no
    // SELECT policy on notes and would receive nothing. setAuth upgrades
    // the realtime connection only — no session is persisted client-side.
    // The SSR attribute is a one-shot handoff, not durable DOM state. The
    // token remains inside the Realtime client after setAuth and is removed
    // from the browser-readable element immediately (#1130).
    // The DOM copy is one-shot, but reconnects still need the user JWT. Keep
    // it only in this element's private memory and wipe it on disconnect.
    handoffRealtimeAuth(client, this, this.#accessToken);
    this.#client = client;
    const generation = ++this.#connectionGeneration;
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
          if (!this.isConnected || generation !== this.#connectionGeneration) return;
          const row = payload.new as { id?: string; body?: string; created_at?: string };
          if (typeof row.id === 'string' && typeof row.body === 'string') {
            this.#events.value = mergeLiveEvent(this.#events.value, {
              id: row.id,
              body: row.body,
              createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
            });
          }
        },
      )
      .subscribe((status) => {
        if (!this.isConnected || generation !== this.#connectionGeneration) return;
        if (status === 'SUBSCRIBED') {
          this.#reconnectAttempt = 0;
          this.#status.value = 'recovering';
          void this.#reconcile(generation);
          return;
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.#status.value = 'degraded';
          this.#clearReconcileTimer();
          this.#scheduleReconnect();
          return;
        }
      });
  }

  #clearReconcileTimer(): void {
    if (this.#reconcileTimer !== undefined) clearTimeout(this.#reconcileTimer);
    this.#reconcileTimer = undefined;
  }

  #scheduleReconcile(generation: number, delay: number): void {
    if (this.#reconcileTimer !== undefined || !this.isConnected) return;
    this.#reconcileTimer = setTimeout(() => {
      this.#reconcileTimer = undefined;
      void this.#reconcile(generation);
    }, delay);
  }

  #validAccessToken(force = false): Promise<string | null> {
    if (
      !force && this.#accessToken &&
      !shouldRefreshAccessToken(this.#accessTokenExpiresAt)
    ) return Promise.resolve(this.#accessToken);
    if (this.#accessTokenRefresh) return this.#accessTokenRefresh;
    this.#accessTokenRefresh = requestNotesAccessToken()
      .then((fresh) => {
        if (!this.isConnected) return null;
        this.#accessToken = fresh.accessToken;
        this.#accessTokenExpiresAt = fresh.expiresAt;
        return fresh.accessToken;
      })
      .finally(() => {
        this.#accessTokenRefresh = null;
      });
    return this.#accessTokenRefresh;
  }

  async #reconcile(generation: number): Promise<void> {
    this.#clearReconcileTimer();
    const url = this.getAttribute('data-url');
    const key = this.getAttribute('data-key');
    const userId = this.getAttribute('data-user-id');
    const accessToken = await this.#validAccessToken();
    if (!url || !key || !userId || !accessToken) {
      this.#status.value = 'degraded';
      return;
    }

    this.#status.value = 'recovering';
    try {
      const snapshot = await fetchNotesSnapshot({
        url,
        key,
        userId,
        token: accessToken,
        refreshToken: () => this.#validAccessToken(true),
        onRefreshed: (fresh) => this.#client?.setAuth(fresh),
      });
      if (!this.isConnected || generation !== this.#connectionGeneration) return;
      this.#events.value = mergeReconciledEvents(this.#events.value, snapshot);
      this.#reconcileAttempt = 0;
      this.#status.value = 'subscribed';
      this.#scheduleReconcile(generation, RECONCILE_INTERVAL_MS);
    } catch {
      if (!this.isConnected || generation !== this.#connectionGeneration) return;
      if (globalThis.navigator?.onLine === false) {
        this.#status.value = 'offline';
        return;
      }
      this.#status.value = 'degraded';
      this.#scheduleReconcile(
        generation,
        reconnectDelayMs(this.#reconcileAttempt++),
      );
    }
  }

  #scheduleReconnect(): void {
    if (this.#reconnectTimer !== undefined || !this.isConnected) return;
    const delay = reconnectDelayMs(this.#reconnectAttempt++);
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = undefined;
      void this.#releaseChannel().then(
        () => this.#connect(),
        () => this.#connect(),
      );
    }, delay);
  }

  #releaseChannel(): Promise<unknown> {
    this.#connectionGeneration++;
    this.#clearReconcileTimer();
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
    void this.#releaseChannel().then(
      () => this.#connect(),
      () => this.#connect(),
    );
  };

  #onOnline = (): void => {
    this.#status.value = 'connecting';
    this.#reconnectNow();
  };

  #onOffline = (): void => {
    this.#clearReconcileTimer();
    this.#status.value = 'offline';
  };

  override attributeChangedCallback(name: string, oldValue: string | null, value: string | null) {
    super.attributeChangedCallback(name, oldValue, value);
    if (name === 'data-access-token' && value && value !== oldValue) {
      this.#accessToken = value;
      handoffRealtimeAuth(this.#client, this, value);
      if (this.#channel) void this.#reconcile(this.#connectionGeneration);
    }
  }

  override disconnectedCallback(): void {
    globalThis.removeEventListener?.('online', this.#onOnline);
    globalThis.removeEventListener?.('offline', this.#onOffline);
    if (this.#reconnectTimer !== undefined) clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = undefined;
    this.#clearReconcileTimer();
    void this.#releaseChannel().catch(() => undefined);
    this.#accessToken = null;
    this.#accessTokenExpiresAt = null;
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
