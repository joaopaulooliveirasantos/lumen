#!/usr/bin/env bash
# Publica o site de divulgação (site/) em https://lumenliturgia.com.br na VPS.
# Uso: bash scripts/deploy-site.sh            (PLAY_LIVE=1 bash ... depois do lançamento na Play)
#
# Pré-requisitos: registros DNS A de lumenliturgia.com.br e www apontando para a VPS.
# Idempotente: na primeira vez emite o certificado; nas seguintes só troca os arquivos.
# Cada deploy vai para uma pasta nova em /var/www/lumen-site/releases e o link "current" é trocado
# no fim, então o site nunca fica pela metade. As 3 versões mais recentes ficam guardadas para rollback.

set -euo pipefail

# ---- Configuração (igual a deploy-vps.sh) ----------------------------
VPS_HOST="${VPS_HOST:-147.15.109.185}"
VPS_USER="${VPS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ssh-key-2026-07-31.key}"
SITE_ROOT="/var/www/lumen-site"
DOMAIN="lumenliturgia.com.br"
# ------------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE="$(date +%Y%m%d-%H%M%S)"
TMP_TAR="$(mktemp -u /tmp/lumen-site-XXXXXX.tar.gz)"
SSH="ssh -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
SCP="scp -i $SSH_KEY -o StrictHostKeyChecking=accept-new"

echo "==> Build do site..."
# npm ci só quando falta node_modules: no Windows ele falha se um dev server do site estiver aberto.
(cd "$REPO_ROOT/site" && { [ -d node_modules ] || npm ci --no-audit --no-fund; } && npm run build)
tar -czf "$TMP_TAR" -C "$REPO_ROOT/site/dist" .

echo "==> Enviando release $RELEASE..."
$SCP "$TMP_TAR" "$VPS_USER@$VPS_HOST:/tmp/lumen-site.tar.gz"
$SCP "$REPO_ROOT/scripts/nginx/lumen-site.conf" "$VPS_USER@$VPS_HOST:/tmp/lumen-site.conf"
rm -f "$TMP_TAR"

$SSH "$VPS_USER@$VPS_HOST" bash -s <<REMOTE
set -euo pipefail

sudo mkdir -p "$SITE_ROOT/releases/$RELEASE" /var/www/letsencrypt
sudo tar -xzf /tmp/lumen-site.tar.gz -C "$SITE_ROOT/releases/$RELEASE"
rm -f /tmp/lumen-site.tar.gz
sudo chown -R root:root "$SITE_ROOT/releases/$RELEASE"
sudo chmod -R a+rX "$SITE_ROOT/releases/$RELEASE"

# Certificado: só na primeira vez. O desafio HTTP é atendido pelo default_server da API, que já
# serve /var/www/letsencrypt na porta 80. A conta do certbot já existe na VPS (sem e-mail).
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
  echo "Emitindo certificado para $DOMAIN e www.$DOMAIN..."
  sudo certbot certonly --webroot -w /var/www/letsencrypt -d $DOMAIN -d www.$DOMAIN \
    --non-interactive --agree-tos --register-unsafely-without-email
fi

# Troca atômica do link "current".
sudo ln -sfn "$SITE_ROOT/releases/$RELEASE" "$SITE_ROOT/current.tmp"
sudo mv -T "$SITE_ROOT/current.tmp" "$SITE_ROOT/current"

# Config do Nginx com rollback se o teste falhar.
sudo cp /etc/nginx/sites-available/lumen-site /tmp/lumen-site.conf.previous 2>/dev/null || true
sudo mv /tmp/lumen-site.conf /etc/nginx/sites-available/lumen-site
sudo ln -sf /etc/nginx/sites-available/lumen-site /etc/nginx/sites-enabled/lumen-site
if ! sudo nginx -t; then
  echo "Config do Nginx inválida; restaurando a anterior."
  if [ -f /tmp/lumen-site.conf.previous ]; then
    sudo cp /tmp/lumen-site.conf.previous /etc/nginx/sites-available/lumen-site
  else
    sudo rm -f /etc/nginx/sites-enabled/lumen-site
  fi
  exit 1
fi
sudo systemctl reload nginx

# Mantém só as 3 releases mais recentes.
cd "$SITE_ROOT/releases" && ls -1t | tail -n +4 | xargs -r sudo rm -rf
REMOTE

echo "==> Conferindo..."
for path in / /privacidade /termos /excluir-conta; do
  printf '%-16s %s\n' "$path" "$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN$path")"
done
echo "Pronto: https://$DOMAIN"
