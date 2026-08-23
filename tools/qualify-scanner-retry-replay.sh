#!/usr/bin/env bash
set -euo pipefail

for required in GITHUB_WORKSPACE WORKER_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY METADEFENDER_CORE_URL SCANNER_SERVICE; do
  [ -n "${!required:-}" ] || { echo "$required is required" >&2; exit 1; }
done

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
scanner_config="$repo_root/examples/supabase-cloudflare-starter/scanner-wrangler.jsonc"
cookie_jar=$(mktemp)
fixture=$(mktemp)
user_id=''
object_key=''
engine_restored=false

deploy_scanner() {
  local origin="$1"
  deno run -A npm:wrangler@4.123.0 deploy --config "$scanner_config" \
    --name "$SCANNER_SERVICE" \
    --var "SUPABASE_URL:$SUPABASE_URL" "METADEFENDER_CORE_URL:$origin" >/dev/null
}

cleanup() {
  if [ "$engine_restored" != true ]; then
    deploy_scanner "$METADEFENDER_CORE_URL" || \
      echo 'URGENT: scanner restoration failed; keep the application fail-closed' >&2
  fi
  if [ -n "$object_key" ]; then
    encoded=$(printf '%s' "$object_key" | jq -sRr @uri | sed 's|%2F|/|g')
    curl -s -o /dev/null -X DELETE \
      "$SUPABASE_URL/storage/v1/object/notes-attachments/$encoded" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" || true
  fi
  if [ -n "$user_id" ]; then
    curl -s -o /dev/null -X DELETE "$SUPABASE_URL/auth/v1/admin/users/$user_id" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" || true
  fi
  rm -f "$cookie_jar" "$fixture"
}
trap cleanup EXIT

suffix="$(date +%s)-$RANDOM"
email="scanner-replay-$suffix@example.com"
password="Scanner-Replay-$suffix-$RANDOM"
display_name="scanner-replay-$suffix.txt"
printf 'OpenElement scanner retry and replay fixture.\n' > "$fixture"

user_id=$(curl -sf --max-time 20 -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"$password\",\"email_confirm\":true,\"app_metadata\":{\"role\":\"admin\"}}" \
  | jq -er .id)
curl -sf --max-time 20 -c "$cookie_jar" -o /dev/null -X POST "$WORKER_URL/login" \
  -H "Origin: $WORKER_URL" -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "email=$email" --data-urlencode "password=$password"

# The .invalid origin is guaranteed non-resolving. The scanner remains
# fail-closed and Queue retries the 503 response; the trap restores the real
# engine even when any subsequent assertion fails.
deploy_scanner 'https://scanner-qualification.invalid'
curl -sf --max-time 30 -b "$cookie_jar" -o /dev/null -X POST \
  "$WORKER_URL/upload?/upload" -H "Origin: $WORKER_URL" \
  -F "file=@$fixture;filename=$display_name;type=text/plain"

reservation() {
  curl -sf --max-time 20 \
    "$SUPABASE_URL/rest/v1/attachment_reservations?select=id,object_key,state&user_id=eq.$user_id&display_name=eq.$display_name" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
}

state='missing'
for _ in $(seq 1 72); do
  row=$(reservation)
  state=$(printf '%s' "$row" | jq -r '.[0].state // "missing"')
  object_key=$(printf '%s' "$row" | jq -r '.[0].object_key // ""')
  [ "$state" = 'scan_dead_letter' ] && break
  case "$state" in pending_scan|reserved|missing) sleep 5 ;; *) exit 1 ;; esac
done
[ "$state" = 'scan_dead_letter' ]
reservation_id=$(printf '%s' "$row" | jq -er '.[0].id')
dead_letter_id=$(curl -sf --max-time 20 \
  "$SUPABASE_URL/rest/v1/attachment_scan_dead_letters?select=id,state,delivery_count&reservation_id=eq.$reservation_id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | \
  jq -er '.[0] | select(.state == "dead_letter" and .delivery_count >= 1) | .id')

deploy_scanner "$METADEFENDER_CORE_URL"
engine_restored=true
curl -sf --max-time 20 -b "$cookie_jar" -o /dev/null -X POST \
  "$WORKER_URL/admin?/replay" -H "Origin: $WORKER_URL" \
  -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode "id=$dead_letter_id"

# Five-minute Cron performs the durable replay handoff; Queue then invokes the
# restored real engine. Allow two Cron windows without loosening the verdict.
for _ in $(seq 1 144); do
  state=$(reservation | jq -r '.[0].state // "missing"')
  [ "$state" = 'clean' ] && break
  case "$state" in replay_requested|pending_scan|scan_dead_letter) sleep 5 ;; *) exit 1 ;; esac
done
[ "$state" = 'clean' ]
owner_html=$(curl -sf --max-time 20 -b "$cookie_jar" "$WORKER_URL/upload")
printf '%s' "$owner_html" | grep -q "$display_name"

mkdir -p "$GITHUB_WORKSPACE/.smoke"
echo '{"check":"attachment-scanner-real-retry-dlq","result":"pass"}' \
  >> "$GITHUB_WORKSPACE/.smoke/results.jsonl"
echo '{"check":"attachment-scanner-authenticated-admin-replay","result":"pass"}' \
  >> "$GITHUB_WORKSPACE/.smoke/results.jsonl"
echo 'real scanner retry/DLQ/authenticated replay qualification -> OK (redacted)'
