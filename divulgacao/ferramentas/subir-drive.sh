#!/bin/bash
# Espelha divulgacao/ no Google Drive, legível (sem criptografia), para abrir no celular na hora
# de postar: Meu Drive/Mindora/divulgacao. Sentido único, do HD para o Drive: editar lá não volta
# para cá. O que muda ou é apagado aqui vai para Mindora/_versoes/<data> no Drive, não some.
# Usa o mesmo rclone do backup-drive (remoto gdrive:, senha do rclone.conf no chaveiro).
# Uso: divulgacao/ferramentas/subir-drive.sh [--simular]
set -euo pipefail

ORIGEM="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="gdrive:Mindora/divulgacao"
VERSOES="gdrive:Mindora/_versoes/$(date +%F_%H%M)"
export RCLONE_PASSWORD_COMMAND="$HOME/.local/bin/rclone-senha-config"

EXTRA=()
[ "${1:-}" = "--simular" ] && EXTRA+=(--dry-run)

# brutos/: gravações cruas (centenas de MB, regeráveis com gravar.mjs).
rclone sync "$ORIGEM" "$DESTINO" \
  --exclude "brutos/**" \
  --backup-dir "$VERSOES" \
  --fast-list --transfers 4 --stats-one-line --stats 10s \
  "${EXTRA[@]}"

echo "Drive atualizado: Meu Drive/Mindora/divulgacao"
