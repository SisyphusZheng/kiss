export interface AuthenticatedIdentity {
  id: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

/** Authorization trusts issuer-controlled app_metadata, never user_metadata. */
export function hasAdminRole(user: AuthenticatedIdentity | null | undefined): boolean {
  return user?.app_metadata?.role === 'admin';
}

export function requireAdmin(user: AuthenticatedIdentity | null | undefined): void {
  if (!hasAdminRole(user)) throw new Response('Not found', { status: 404 });
}
