interface QualificationEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_ACCESS_TOKEN: string;
  SUPABASE_PROJECT_ID: string;
  A_ID: string;
  A_EMAIL: string;
  A_PASSWORD: string;
  B_ID: string;
  B_EMAIL: string;
  B_PASSWORD: string;
  SMOKE_RESULTS_FILE?: string;
}

function parseEnv(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function requireUuid(name: string, value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${name} is not a UUID`);
  }
  return value;
}

async function loadEnv(): Promise<QualificationEnv> {
  const envFileArg = Deno.args.find((argument) => argument.startsWith('--env-file='));
  const fileValues = envFileArg
    ? parseEnv(await Deno.readTextFile(envFileArg.slice('--env-file='.length)))
    : {};
  const values = { ...Deno.env.toObject(), ...fileValues };
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_ACCESS_TOKEN',
    'SUPABASE_PROJECT_ID',
    'A_ID',
    'A_EMAIL',
    'A_PASSWORD',
    'B_ID',
    'B_EMAIL',
    'B_PASSWORD',
  ] as const;
  for (const name of required) {
    if (!values[name]) throw new Error(`${name} is required`);
  }
  return {
    ...Object.fromEntries(required.map((name) => [name, values[name]])),
    SMOKE_RESULTS_FILE: values.SMOKE_RESULTS_FILE,
  } as unknown as QualificationEnv;
}

async function record(env: QualificationEnv, check: string, details?: Record<string, unknown>) {
  const result = { check, result: 'pass', ...details };
  console.log(JSON.stringify(result));
  if (env.SMOKE_RESULTS_FILE) {
    await Deno.writeTextFile(env.SMOKE_RESULTS_FILE, `${JSON.stringify(result)}\n`, {
      append: true,
      create: true,
    });
  }
}

async function managementQuery(env: QualificationEnv, query: string): Promise<unknown> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${env.SUPABASE_PROJECT_ID}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  );
  const body = await response.text();
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(body) as { message?: string; error?: string };
      message += `: ${parsed.message ?? parsed.error ?? 'database query failed'}`;
    } catch {
      message += ': database query failed';
    }
    throw new Error(message);
  }
  return body ? JSON.parse(body) : null;
}

async function signIn(env: QualificationEnv, email: string, password: string): Promise<string> {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json() as { access_token?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Auth sign-in failed: HTTP ${response.status}`);
  }
  return body.access_token;
}

async function expectNoteConstraint(
  env: QualificationEnv,
  token: string,
  row: { user_id: string; title: string; body: string },
  constraint: string,
) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/notes`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
  const text = await response.text();
  let code = '';
  try {
    code = (JSON.parse(text) as { code?: string }).code ?? '';
  } catch {
    // The assertion below reports only status/code and never echoes row data.
  }
  if (response.status !== 400 || code !== '23514' || !text.includes(constraint)) {
    throw new Error(
      `${constraint} was not enforced (HTTP ${response.status}, PostgreSQL code ${
        code || 'missing'
      })`,
    );
  }
}

function replayQualificationSql(adminId: string, ownerId: string): string {
  const suffix = crypto.randomUUID().replaceAll('-', '');
  const paymentNormal = `evt_oe_qual_normal_${suffix}`;
  const paymentFailure = `evt_oe_qual_failure_${suffix}`;
  const paymentNonAdmin = `evt_oe_qual_nonadmin_${suffix}`;
  const paymentStale = `evt_oe_qual_stale_${suffix}`;
  const reservationNormal = crypto.randomUUID();
  const reservationFailure = crypto.randomUUID();
  const reservationNonAdmin = crypto.randomUUID();
  const reservationStale = crypto.randomUUID();
  const deadNormal = crypto.randomUUID();
  const deadFailure = crypto.randomUUID();
  const deadNonAdmin = crypto.randomUUID();
  const deadStale = crypto.randomUUID();

  return `
begin;
set local statement_timeout = '20s';

do $qualification$
begin
  if coalesce((select raw_app_meta_data ->> 'role' from auth.users where id = '${adminId}'), '') <> 'admin' then
    raise exception 'qualification admin fixture is not currently admin';
  end if;
  if coalesce((select raw_app_meta_data ->> 'role' from auth.users where id = '${ownerId}'), '') = 'admin' then
    raise exception 'qualification non-admin fixture is unexpectedly admin';
  end if;
end;
$qualification$;

insert into public.stripe_events (
  provider_event_id, event_type, event_created_at, livemode, outcome, processing_state, event_data
) values
  ('${paymentNormal}', 'qualification.replay', now(), false, 'ignored', 'dead_letter', '{}'::jsonb),
  ('${paymentFailure}', 'qualification.replay', now(), false, 'ignored', 'dead_letter', '{}'::jsonb),
  ('${paymentNonAdmin}', 'qualification.replay', now(), false, 'ignored', 'dead_letter', '{}'::jsonb),
  ('${paymentStale}', 'qualification.replay', now(), false, 'ignored', 'dead_letter', '{}'::jsonb);

insert into public.attachment_reservations
  (id, user_id, object_key, display_name, byte_size, content_type, state)
values
  ('${reservationNormal}', '${ownerId}', '${ownerId}/qualification-normal-${suffix}', 'qualification.txt', 1, 'text/plain', 'scan_dead_letter'),
  ('${reservationFailure}', '${ownerId}', '${ownerId}/qualification-failure-${suffix}', 'qualification.txt', 1, 'text/plain', 'scan_dead_letter'),
  ('${reservationNonAdmin}', '${ownerId}', '${ownerId}/qualification-nonadmin-${suffix}', 'qualification.txt', 1, 'text/plain', 'scan_dead_letter'),
  ('${reservationStale}', '${ownerId}', '${ownerId}/qualification-stale-${suffix}', 'qualification.txt', 1, 'text/plain', 'scan_dead_letter');

insert into public.attachment_scan_dead_letters
  (id, reservation_id, user_id, object_key, state)
values
  ('${deadNormal}', '${reservationNormal}', '${ownerId}', '${ownerId}/qualification-normal-${suffix}', 'dead_letter'),
  ('${deadFailure}', '${reservationFailure}', '${ownerId}', '${ownerId}/qualification-failure-${suffix}', 'dead_letter'),
  ('${deadNonAdmin}', '${reservationNonAdmin}', '${ownerId}', '${ownerId}/qualification-nonadmin-${suffix}', 'dead_letter'),
  ('${deadStale}', '${reservationStale}', '${ownerId}', '${ownerId}/qualification-stale-${suffix}', 'dead_letter');

create temporary table oe_qualification_marker(value integer);
create function pg_temp.oe_fail_qualification_audit()
returns trigger language plpgsql as $trigger$
begin
  if new.target_id in ('${paymentFailure}', '${deadFailure}') then
    raise exception 'qualification injected audit failure';
  end if;
  return new;
end;
$trigger$;
create trigger oe_fail_qualification_audit
before insert on public.admin_audit
for each row execute function pg_temp.oe_fail_qualification_audit();

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '${adminId}', 'role', 'authenticated',
    'app_metadata', jsonb_build_object('role', 'admin')
  )::text,
  true
);

do $qualification$
declare
  rejected boolean;
begin
  perform public.request_payment_event_replay('${paymentNormal}');
  if (select processing_state from public.stripe_events where provider_event_id = '${paymentNormal}') <> 'replay_requested'
    or (select replay_requested_by from public.stripe_events where provider_event_id = '${paymentNormal}') <> '${adminId}'
    or (select count(*) from public.admin_audit where action = 'payment_event_replay_requested' and target_id = '${paymentNormal}' and actor_id = '${adminId}') <> 1
  then raise exception 'payment replay request did not atomically persist state and one actor audit'; end if;

  rejected := false;
  begin
    perform public.request_payment_event_replay('${paymentNormal}');
  exception when others then
    rejected := sqlerrm = 'payment dead-letter unavailable';
  end;
  if not rejected
    or (select count(*) from public.admin_audit where action = 'payment_event_replay_requested' and target_id = '${paymentNormal}') <> 1
  then raise exception 'duplicate payment replay did not fail without a duplicate audit'; end if;

  rejected := false;
  begin
    perform public.request_payment_event_replay('${paymentFailure}');
  exception when others then
    rejected := sqlerrm = 'qualification injected audit failure';
  end;
  if not rejected
    or (select processing_state from public.stripe_events where provider_event_id = '${paymentFailure}') <> 'dead_letter'
    or exists (select 1 from public.admin_audit where target_id = '${paymentFailure}')
  then raise exception 'payment audit failure did not roll back replay state'; end if;

  perform public.request_attachment_scan_replay('${deadNormal}');
  if (select state from public.attachment_scan_dead_letters where id = '${deadNormal}') <> 'replay_requested'
    or (select state from public.attachment_reservations where id = '${reservationNormal}') <> 'replay_requested'
    or (select count(*) from public.storage_audit where reservation_id = '${reservationNormal}' and event = 'scan_replay_requested') <> 1
    or (select count(*) from public.admin_audit where action = 'attachment_scan_replay_requested' and target_id = '${deadNormal}' and actor_id = '${adminId}') <> 1
  then raise exception 'attachment replay request did not atomically persist state and audits'; end if;

  rejected := false;
  begin
    perform public.request_attachment_scan_replay('${deadNormal}');
  exception when others then
    rejected := sqlerrm = 'dead letter is not replayable';
  end;
  if not rejected
    or (select count(*) from public.admin_audit where action = 'attachment_scan_replay_requested' and target_id = '${deadNormal}') <> 1
    or (select count(*) from public.storage_audit where reservation_id = '${reservationNormal}' and event = 'scan_replay_requested') <> 1
  then raise exception 'duplicate attachment replay did not fail without duplicate audits'; end if;

  rejected := false;
  begin
    perform public.request_attachment_scan_replay('${deadFailure}');
  exception when others then
    rejected := sqlerrm = 'qualification injected audit failure';
  end;
  if not rejected
    or (select state from public.attachment_scan_dead_letters where id = '${deadFailure}') <> 'dead_letter'
    or (select state from public.attachment_reservations where id = '${reservationFailure}') <> 'scan_dead_letter'
    or exists (select 1 from public.storage_audit where reservation_id = '${reservationFailure}' and event = 'scan_replay_requested')
    or exists (select 1 from public.admin_audit where target_id = '${deadFailure}')
  then raise exception 'attachment audit failure did not roll back replay state and storage audit'; end if;
end;
$qualification$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '${ownerId}', 'role', 'authenticated',
    'app_metadata', jsonb_build_object('role', 'member')
  )::text,
  true
);
do $qualification$
declare rejected boolean;
begin
  rejected := false;
  begin perform public.request_payment_event_replay('${paymentNonAdmin}');
  exception when others then rejected := sqlerrm = 'admin required'; end;
  if not rejected or (select processing_state from public.stripe_events where provider_event_id = '${paymentNonAdmin}') <> 'dead_letter'
  then raise exception 'non-admin payment replay did not fail closed'; end if;

  rejected := false;
  begin perform public.request_attachment_scan_replay('${deadNonAdmin}');
  exception when others then rejected := sqlerrm = 'admin role required'; end;
  if not rejected
    or (select state from public.attachment_scan_dead_letters where id = '${deadNonAdmin}') <> 'dead_letter'
    or (select state from public.attachment_reservations where id = '${reservationNonAdmin}') <> 'scan_dead_letter'
  then raise exception 'non-admin cross-user attachment replay did not fail closed'; end if;
end;
$qualification$;

-- Simulate an unexpired token whose cached claim still says admin after the
-- actor's current auth.users metadata has been downgraded.
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '${ownerId}', 'role', 'authenticated',
    'app_metadata', jsonb_build_object('role', 'admin')
  )::text,
  true
);
do $qualification$
declare rejected boolean;
begin
  rejected := false;
  begin perform public.request_payment_event_replay('${paymentStale}');
  exception when others then rejected := sqlerrm = 'admin required'; end;
  if not rejected or (select processing_state from public.stripe_events where provider_event_id = '${paymentStale}') <> 'dead_letter'
  then raise exception 'stale-admin payment replay did not fail closed'; end if;

  rejected := false;
  begin perform public.request_attachment_scan_replay('${deadStale}');
  exception when others then rejected := sqlerrm = 'admin role required'; end;
  if not rejected
    or (select state from public.attachment_scan_dead_letters where id = '${deadStale}') <> 'dead_letter'
    or (select state from public.attachment_reservations where id = '${reservationStale}') <> 'scan_dead_letter'
  then raise exception 'stale-admin attachment replay did not fail closed'; end if;
end;
$qualification$;

rollback;
select jsonb_build_object('qualification', 'replay-request-transaction-atomicity', 'result', 'pass');
`;
}

function aclQualificationSql(): string {
  return `
do $qualification$
begin
  if pg_catalog.has_function_privilege('anon', 'public.request_attachment_delete(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.request_attachment_delete(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', 'public.request_attachment_delete(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.complete_attachment_delete(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.complete_attachment_delete(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', 'public.complete_attachment_delete(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.list_pending_attachment_deletions()', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.list_pending_attachment_deletions()', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.list_pending_attachment_deletions()', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.complete_pending_attachment_delete(uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.complete_pending_attachment_delete(uuid)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.complete_pending_attachment_delete(uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.request_payment_event_replay(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.request_payment_event_replay(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', 'public.request_payment_event_replay(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.request_attachment_scan_replay(uuid)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.request_attachment_scan_replay(uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', 'public.request_attachment_scan_replay(uuid)', 'EXECUTE')
  then raise exception 'post-apply function ACL matrix differs from the reviewed call graph'; end if;
end;
$qualification$;
select jsonb_build_object('qualification', 'post-apply-function-acl', 'result', 'pass');
`;
}

function explainQualificationSql(ownerId: string): string {
  return `
begin;
set local enable_seqscan = off;
do $qualification$
declare plan json;
begin
  execute $explain$
    explain (format json)
    select id, title, body, created_at
    from public.notes
    where user_id = '${ownerId}'
      and (created_at, id) < ('infinity'::timestamptz, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
    order by created_at desc, id desc
    limit 11
  $explain$ into plan;
  if position('notes_owner_created_id_idx' in plan::text) = 0 then
    raise exception 'Notes keyset query cannot use notes_owner_created_id_idx: %', plan;
  end if;
end;
$qualification$;
rollback;
select jsonb_build_object('qualification', 'notes-keyset-explain-index-eligible', 'result', 'pass');
`;
}

if (import.meta.main) {
  const env = await loadEnv();
  requireUuid('A_ID', env.A_ID);
  requireUuid('B_ID', env.B_ID);

  const anonymous = await fetch(`${env.SUPABASE_URL}/rest/v1/notes?select=id&limit=1`, {
    headers: { apikey: env.SUPABASE_ANON_KEY },
  });
  if (![401, 403].includes(anonymous.status)) {
    throw new Error(`anonymous Notes Data API did not fail closed: HTTP ${anonymous.status}`);
  }
  await record(env, 'post-apply-anonymous-notes-denied', { status: anonymous.status });

  const token = await signIn(env, env.B_EMAIL, env.B_PASSWORD);
  await expectNoteConstraint(
    env,
    token,
    { user_id: env.B_ID, title: 'x'.repeat(121), body: 'valid' },
    'notes_title_length_check',
  );
  await record(env, 'direct-notes-title-constraint', { postgresCode: '23514' });
  await expectNoteConstraint(
    env,
    token,
    { user_id: env.B_ID, title: 'valid', body: 'x'.repeat(10_001) },
    'notes_body_length_check',
  );
  await record(env, 'direct-notes-body-constraint', { postgresCode: '23514' });

  await managementQuery(env, aclQualificationSql());
  await record(env, 'post-apply-function-acl');

  await managementQuery(env, replayQualificationSql(env.A_ID, env.B_ID));
  await record(env, 'replay-request-transaction-atomicity', {
    fixtures: 'transaction-rolled-back',
  });

  await managementQuery(env, explainQualificationSql(env.B_ID));
  await record(env, 'notes-keyset-explain-index-eligible', {
    index: 'notes_owner_created_id_idx',
    planner: 'sequential-scan-disabled-for-empty-fixture-eligibility-proof',
  });
}
