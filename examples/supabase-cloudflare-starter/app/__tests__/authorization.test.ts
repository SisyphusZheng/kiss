import { assertEquals, assertThrows } from '@std/assert';
import { hasAdminRole, requireAdmin } from '../../lib/authorization.ts';

Deno.test('admin authorization trusts app_metadata.role only', () => {
  assertEquals(hasAdminRole({ id: '1', app_metadata: { role: 'admin' } }), true);
  assertEquals(hasAdminRole({ id: '1', app_metadata: { role: 'member' } }), false);
  assertEquals(hasAdminRole(null), false);
});

Deno.test('user-writable metadata can never grant admin', () => {
  const forged = { id: 'attacker', app_metadata: {}, user_metadata: { role: 'admin' } };
  assertEquals(hasAdminRole(forged), false);
  const response = assertThrows(() => requireAdmin(forged));
  assertEquals(response instanceof Response, true);
  assertEquals((response as Response).status, 404);
});
