#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source_dir="$repo_root/examples/supabase-cloudflare-starter/supabase"
qualification_root=$(mktemp -d)
active_workdir=''

cleanup() {
  if [ -n "$active_workdir" ]; then
    supabase stop --workdir "$active_workdir" --no-backup >/dev/null 2>&1 || true
  fi
  rm -rf "$qualification_root"
}
trap cleanup EXIT

prepare_project() {
  local workdir="$1"
  local project_id="$2"
  mkdir -p "$workdir"
  cp -R "$source_dir" "$workdir/supabase"
  sed -i.bak "s/project_id = \"openelement-supabase-cloudflare-starter\"/project_id = \"$project_id\"/" \
    "$workdir/supabase/config.toml"
  rm "$workdir/supabase/config.toml.bak"
}

start_project() {
  local workdir="$1"
  active_workdir="$workdir"
  supabase start --workdir "$workdir" \
    -x studio,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor
}

dump_schema() {
  local workdir="$1"
  local output="$2"
  supabase db dump --workdir "$workdir" --local \
    --schema public,storage --file "$output"
  # Dump banners can include tool/runtime details that are not schema state.
  sed -i.bak '/^-- Dumped /d; /^-- Started on /d; /^-- Completed on /d' "$output"
  rm "$output.bak"
}

fresh_workdir="$qualification_root/fresh"
upgrade_workdir="$qualification_root/upgrade"
fresh_dump="$qualification_root/fresh.sql"
upgrade_dump="$qualification_root/upgrade.sql"
forward_dir="$qualification_root/forward"

prepare_project "$fresh_workdir" oe-v0431-fresh
start_project "$fresh_workdir"
dump_schema "$fresh_workdir" "$fresh_dump"

# Qualify the live fresh catalog, not migration source text. `supabase db dump`
# intentionally normalizes ACL output and is not a reliable privilege oracle.
# The migration already aborts on any unexpected table/sequence/function ACL;
# this post-start probe independently proves that the reviewed table matrix
# survived full service startup.
fresh_privileges=$(docker exec supabase_db_oe-v0431-fresh \
  psql -X -qAt -v ON_ERROR_STOP=1 -U postgres -d postgres -c "
    select coalesce(
      string_agg(
        grantee || ':' || table_name || ':' || privilege_type,
        ',' order by grantee, table_name, privilege_type
      ),
      ''
    )
    from information_schema.table_privileges
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated', 'service_role')
      and table_name in (
        'notes', 'admin_audit', 'attachment_reservations', 'storage_audit',
        'attachment_scan_dead_letters', 'orders', 'stripe_events',
        'payment_products', 'workspaces', 'workspace_members', 'workspace_records'
      );")
expected_privileges='authenticated:admin_audit:SELECT,authenticated:attachment_reservations:SELECT,authenticated:notes:DELETE,authenticated:notes:INSERT,authenticated:notes:SELECT,authenticated:notes:UPDATE,authenticated:orders:SELECT,authenticated:storage_audit:SELECT,authenticated:workspace_members:SELECT,authenticated:workspace_records:DELETE,authenticated:workspace_records:INSERT,authenticated:workspace_records:SELECT,authenticated:workspace_records:UPDATE,authenticated:workspaces:SELECT,service_role:attachment_reservations:DELETE,service_role:attachment_reservations:SELECT,service_role:attachment_scan_dead_letters:SELECT,service_role:notes:INSERT,service_role:notes:SELECT'
[ "$fresh_privileges" = "$expected_privileges" ] || {
  echo 'fresh database has an unexpected Data API table privilege matrix' >&2
  exit 1
}
supabase stop --workdir "$fresh_workdir" --no-backup
active_workdir=''

prepare_project "$upgrade_workdir" oe-v0431-upgrade
mkdir -p "$forward_dir"
for migration in \
  20260823030729_postgres_index_rls_performance_floor.sql \
  20260823031500_workspace_rls_qualification.sql \
  20260823094231_replay_audit_atomicity.sql \
  20260823094232_stripe_reconciliation_index.sql \
  20260823110000_explicit_data_api_privileges.sql \
  20260823110100_replay_request_audit_atomicity.sql \
  20260823110200_attachment_delete_reconciliation.sql \
  20260823110300_notes_bounds.sql \
  20260823110400_replay_current_admin_authorization.sql; do
  mv "$upgrade_workdir/supabase/migrations/$migration" "$forward_dir/$migration"
done
start_project "$upgrade_workdir"
cp "$forward_dir"/*.sql "$upgrade_workdir/supabase/migrations/"
supabase migration up --workdir "$upgrade_workdir" --local
dump_schema "$upgrade_workdir" "$upgrade_dump"

if ! cmp -s "$fresh_dump" "$upgrade_dump"; then
  diff -u "$fresh_dump" "$upgrade_dump" | head -200 >&2 || true
  echo 'fresh and upgraded Supabase schemas differ' >&2
  exit 1
fi

mkdir -p "$repo_root/.smoke"
sha=$(shasum -a 256 "$fresh_dump" | awk '{print $1}')
migration_count=$(find "$source_dir/migrations" -type f -name '*.sql' | wc -l | tr -d ' ')
jq -n --arg sha "$sha" --argjson migrations "$migration_count" \
  '{check:"fresh-upgraded-schema-parity",result:"pass",schemaSha256:$sha,migrations:$migrations}' \
  > "$repo_root/.smoke/supabase-schema-parity.json"
echo "Supabase fresh/upgraded schema parity passed ($migration_count migrations, sha256 $sha)."
