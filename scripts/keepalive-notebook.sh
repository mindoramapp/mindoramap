#!/bin/bash
# Keeps the Mindora Supabase project active from the owner's notebook: calls keepalive(), which
# writes one row (migration 20261101000000_keepalive.sql). Second source besides the GitHub
# workflow, which GitHub disables after 60 days without commits.
# Usage: keepalive-notebook.sh [--avisar]   (--avisar shows a desktop notification on failure)
set -u
source "$HOME/.config/mindora-keepalive/env"
log="$HOME/.local/state/mindora-keepalive.log"
mkdir -p "$(dirname "$log")"

call() {
  curl -sS -o /dev/null -w "%{http_code}" --retry 3 --retry-delay 20 -m 30 "$@" \
    -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" 2>/dev/null || echo "sem-resposta"
}

status=$(call -X POST "$VITE_SUPABASE_URL/rest/v1/rpc/keepalive" \
  -H "Content-Type: application/json" -d '{}')
# Before the keepalive migration exists, fall back to a read.
[ "$status" = "404" ] && status="$(call "$VITE_SUPABASE_URL/rest/v1/plans?select=id&limit=1")-leitura"

echo "$(date '+%F %T') $status" >> "$log"
tail -n 60 "$log" > "$log.tmp" && mv "$log.tmp" "$log"

case "$status" in
  200* | 204*) exit 0 ;;
esac
if [ "${1:-}" = "--avisar" ]; then
  notify-send -u critical -i dialog-warning "Mindora fora do ar" \
    "O Supabase não respondeu ($status). Se estiver pausado, clique em Resume em supabase.com/dashboard."
fi
exit 1
