/**
 * Mastodon Desktop — cached API client used by route loaders.
 *
 * Wraps the raw fixture/live client with a localStorage TTL cache so repeated
 * navigations between timeline, profile, and status feel instant.
 */

import {
  fetchAccount,
  fetchAccountStatuses,
  fetchPublicTimeline,
  fetchStatus,
  fetchStatusContext,
} from './api.ts';
import { getCache, setCache } from './cache.ts';
import { loadSettings } from './settings.ts';
import type {
  ApiResult,
  MastodonAccount,
  MastodonStatus,
  ProfileRequest,
  StatusRequest,
  TimelineRequest,
} from './types.ts';

const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

function currentInstance(): string {
  if (typeof document !== 'undefined') {
    return loadSettings().instanceUrl;
  }
  return 'mastodon.social';
}

export async function getTimeline(
  options: Partial<Omit<TimelineRequest, 'instance'>> & { ttlMs?: number } = {},
): Promise<ApiResult<MastodonStatus[]>> {
  const { ttlMs = DEFAULT_TTL_MS, ...req } = options;
  const request: TimelineRequest = {
    ...req,
    instance: currentInstance(),
    timeline: req.timeline ?? 'public',
    limit: req.limit ?? 20,
  };
  const cacheKey = `timeline:${request.instance}:${request.timeline}:${request.maxId ?? ''}:${
    request.sinceId ?? ''
  }:${request.limit ?? 20}`;
  const cached = getCache<MastodonStatus[]>(cacheKey, ttlMs);
  if (cached) return { ok: true, data: cached };

  const result = await fetchPublicTimeline(request);
  if (result.ok) setCache(cacheKey, result.data);
  return result;
}

export async function getProfile(
  acct: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<ApiResult<MastodonAccount>> {
  const request: ProfileRequest = { instance: currentInstance(), acct };
  const cacheKey = `profile:${request.instance}:${acct}`;
  const cached = getCache<MastodonAccount>(cacheKey, ttlMs);
  if (cached) return { ok: true, data: cached };

  const result = await fetchAccount(request);
  if (result.ok) setCache(cacheKey, result.data);
  return result;
}

export async function getProfileStatuses(
  acct: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<ApiResult<MastodonStatus[]>> {
  const request: ProfileRequest = { instance: currentInstance(), acct };
  const cacheKey = `profile-statuses:${request.instance}:${acct}`;
  const cached = getCache<MastodonStatus[]>(cacheKey, ttlMs);
  if (cached) return { ok: true, data: cached };

  const result = await fetchAccountStatuses(request);
  if (result.ok) setCache(cacheKey, result.data);
  return result;
}

export async function getStatus(
  id: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<ApiResult<MastodonStatus>> {
  const request: StatusRequest = { instance: currentInstance(), id };
  const cacheKey = `status:${request.instance}:${id}`;
  const cached = getCache<MastodonStatus>(cacheKey, ttlMs);
  if (cached) return { ok: true, data: cached };

  const result = await fetchStatus(request);
  if (result.ok) setCache(cacheKey, result.data);
  return result;
}

export async function getStatusContext(
  id: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<ApiResult<{ ancestors: MastodonStatus[]; descendants: MastodonStatus[] }>> {
  const request: StatusRequest = { instance: currentInstance(), id };
  const cacheKey = `status-context:${request.instance}:${id}`;
  const cached = getCache<{ ancestors: MastodonStatus[]; descendants: MastodonStatus[] }>(
    cacheKey,
    ttlMs,
  );
  if (cached) return { ok: true, data: cached };

  const result = await fetchStatusContext(request);
  if (result.ok) setCache(cacheKey, result.data);
  return result;
}
