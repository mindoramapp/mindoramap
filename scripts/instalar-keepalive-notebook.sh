#!/bin/bash
# Installs the daily Supabase ping on this notebook (systemd user timer, 10h and 20 min after
# login). Copies the URL and publishable key from .env.local into a private file; prints neither.
# To undo: systemctl --user disable --now mindora-keepalive.timer
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$HOME/bin" "$HOME/.config/mindora-keepalive" "$HOME/.config/systemd/user"
(umask 077 && grep -E '^VITE_SUPABASE_(URL|PUBLISHABLE_KEY)=' "$repo/.env.local" \
  > "$HOME/.config/mindora-keepalive/env")
install -m 755 "$repo/scripts/keepalive-notebook.sh" "$HOME/bin/mindora-keepalive"

cat > "$HOME/.config/systemd/user/mindora-keepalive.service" <<'EOF'
[Unit]
Description=Mantém o Supabase do Mindora ativo (grava no banco)
After=network-online.target

[Service]
Type=oneshot
ExecStart=%h/bin/mindora-keepalive --avisar
EOF

cat > "$HOME/.config/systemd/user/mindora-keepalive.timer" <<'EOF'
[Unit]
Description=Ping diário no Supabase do Mindora, às 10h e 20 min após o login

[Timer]
OnCalendar=*-*-* 10:00
OnStartupSec=20min
Persistent=true
RandomizedDelaySec=15min

[Install]
WantedBy=timers.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now mindora-keepalive.timer
echo "Instalado. Próxima execução:"
systemctl --user list-timers mindora-keepalive.timer --no-pager | sed -n 2p
