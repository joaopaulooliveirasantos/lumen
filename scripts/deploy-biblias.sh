#!/usr/bin/env bash
# Publica as Bíblias estáticas na VPS (Fase 3 da migração do frontend).
# Uso: bash scripts/deploy-biblias.sh
#
# 1. Gera dist-biblias/ com scripts/bible/build-bible-assets.mjs (valida as traduções).
# 2. Envia os arquivos para /var/www/lumen-static/biblias, sem apagar versões antigas
#    (apps que ainda têm o índice anterior continuam funcionando). O manifest.json é
#    trocado por último, para nunca apontar para uma versão que ainda não chegou.
# 3. Garante a config do Nginx (scripts/nginx/lumen-backend.conf) e testa as URLs.
#
# Requisitos locais: node, bash, ssh, scp, tar, curl (Git Bash no Windows serve).

set -euo pipefail

VPS_HOST="${VPS_HOST:-147.15.109.185}"
VPS_USER="${VPS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ssh-key-2026-07-31.key}"
STATIC_DIR="/var/www/lumen-static/biblias"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$REPO_ROOT/dist-biblias/biblias"
TMP_TAR="$(mktemp -u /tmp/lumen-biblias-XXXXXX.tar.gz)"

SSH="ssh -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
SCP="scp -i $SSH_KEY -o StrictHostKeyChecking=accept-new"

echo "==> Gerando arquivos das Bíblias..."
node "$REPO_ROOT/scripts/bible/build-bible-assets.mjs" --out "$OUT_DIR"

echo "==> Empacotando..."
tar -czf "$TMP_TAR" -C "$OUT_DIR" .

echo "==> Enviando para o servidor..."
$SCP "$TMP_TAR" "$VPS_USER@$VPS_HOST:/tmp/lumen-biblias.tar.gz"
$SCP "$REPO_ROOT/scripts/nginx/lumen-backend.conf" "$VPS_USER@$VPS_HOST:/tmp/lumen-backend.conf"
rm -f "$TMP_TAR"

$SSH "$VPS_USER@$VPS_HOST" bash -s <<REMOTE
set -euo pipefail

STAGE="\$(mktemp -d)"
tar -xzf /tmp/lumen-biblias.tar.gz -C "\$STAGE"
rm -f /tmp/lumen-biblias.tar.gz

sudo mkdir -p "$STATIC_DIR"
# Versões novas primeiro (diretórios <traducao>/<versao>), manifest por último.
sudo cp -rn "\$STAGE"/*/ "$STATIC_DIR"/
sudo cp "\$STAGE"/manifest.json "\$STAGE"/manifest.json.gz "$STATIC_DIR"/
sudo chmod -R a+rX /var/www/lumen-static
rm -rf "\$STAGE"

sudo cp /etc/nginx/sites-available/lumen-backend /tmp/lumen-backend.conf.previous 2>/dev/null || true
sudo mv /tmp/lumen-backend.conf /etc/nginx/sites-available/lumen-backend
sudo ln -sf /etc/nginx/sites-available/lumen-backend /etc/nginx/sites-enabled/lumen-backend
if ! sudo nginx -t; then
  echo "Config do Nginx inválida; restaurando a anterior."
  sudo cp /tmp/lumen-backend.conf.previous /etc/nginx/sites-available/lumen-backend
  exit 1
fi
sudo systemctl reload nginx
REMOTE

echo "==> Testando..."
sleep 1
curl -s -o /dev/null -w "manifest: HTTP %{http_code}\n" "http://$VPS_HOST/biblias/manifest.json"
PAULUS_VER="$(node -e 'const m=require(process.argv[1]);console.log(m.traducoes.find(t=>t.id==="paulus").versao)' "$OUT_DIR/manifest.json")"
curl -s -o /dev/null -H "Accept-Encoding: gzip" -w "Gênesis (gzip): HTTP %{http_code}, %{size_download} bytes\n" \
  "http://$VPS_HOST/biblias/paulus/$PAULUS_VER/01-genesis.json"
curl -s -o /dev/null -w "API: HTTP %{http_code}\n" "http://$VPS_HOST/api/liturgia?date=$(date +%Y-%m-%d)" || true

echo "Concluído."
