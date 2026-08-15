#!/usr/bin/env bash
# Deploy/atualiza o backend do Lumen no VPS.
# Uso: bash scripts/deploy-vps.sh
#
# Requisitos locais: bash, ssh, scp, tar (Git Bash no Windows serve).
# Pode ser rodado tanto para o primeiro deploy quanto para atualizacoes
# seguintes: os passos de instalacao/configuracao sao idempotentes
# (nao quebram nada se ja estiverem feitos).
#
# Tambem roda via CI (.github/workflows/backend-deploy.yml, Fase 3 do
# plano de CI/CD) — nesse caso VPS_HOST/VPS_USER/SSH_KEY vem de
# variaveis/segredos do GitHub Actions em vez do ambiente local.

set -euo pipefail

# ---- Configuracao ----------------------------------------------------
VPS_HOST="${VPS_HOST:-147.15.109.185}"
VPS_USER="${VPS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ssh-key-2026-07-31.key}"
REMOTE_DIR="${REMOTE_DIR:-/opt/lumen-backend}"
SERVICE_NAME="lumen-backend"
# ------------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_TAR="$(mktemp -u /tmp/lumen-backend-XXXXXX.tar.gz)"

SSH="ssh -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
SCP="scp -i $SSH_KEY -o StrictHostKeyChecking=accept-new"

echo "==> Empacotando arquivos do backend..."
tar -czf "$TMP_TAR" -C "$REPO_ROOT" package.json package-lock.json tsconfig.json src

echo "==> Garantindo diretorio remoto e dependencias do sistema..."
$SSH "$VPS_USER@$VPS_HOST" bash -s <<REMOTE_SETUP
set -euo pipefail

sudo mkdir -p "$REMOTE_DIR"
sudo chown "\$(whoami)":"\$(whoami)" "$REMOTE_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Instalando Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "Instalando Nginx..."
  sudo apt-get update -y
  sudo apt-get install -y nginx
fi
REMOTE_SETUP

echo "==> Enviando pacote para o servidor..."
$SCP "$TMP_TAR" "$VPS_USER@$VPS_HOST:$REMOTE_DIR/deploy.tar.gz"
rm -f "$TMP_TAR"

echo "==> Extraindo, instalando dependencias e buildando (com backup/rollback)..."
$SSH "$VPS_USER@$VPS_HOST" bash -s <<REMOTE_BUILD
set -euo pipefail
cd "$REMOTE_DIR"

# Backup do dist/ atual antes de sobrescrever — se o build novo falhar,
# restauramos o dist anterior para o systemd continuar tendo algo
# funcional em disco (ele nao reinicia sozinho aqui, entao o processo
# em memoria nao muda, mas o proximo restart manual nao quebra tudo).
if [ -d dist ]; then
  echo "Fazendo backup do dist/ atual em dist.previous/..."
  rm -rf dist.previous
  cp -r dist dist.previous
fi

tar -xzf deploy.tar.gz
rm -f deploy.tar.gz

if [ ! -f .env ]; then
  echo "Criando .env padrao (edite $REMOTE_DIR/.env no servidor se precisar mudar algo)..."
  cat > .env <<'ENV'
LITURGY_API_URL_TEMPLATE=https://feed.evangelizo.org/v2/reader.php
EVANGELIZO_LANG=PT
EVANGELIZO_CONTENT=GSP
PORT=3333
ENV
fi

npm ci

if ! npm run build; then
  echo "Build falhou! Restaurando dist/ anterior a partir do backup..."
  rm -rf dist
  if [ -d dist.previous ]; then
    mv dist.previous dist
    echo "dist/ anterior restaurado. O servico systemd nao sera reiniciado com codigo quebrado."
  else
    echo "Nao havia dist.previous (provavelmente e o primeiro deploy) — nada para restaurar."
  fi
  exit 1
fi
REMOTE_BUILD

echo "==> Configurando systemd (lumen-backend)..."
$SSH "$VPS_USER@$VPS_HOST" bash -s <<REMOTE_SYSTEMD
set -euo pipefail

sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<'UNIT'
[Unit]
Description=Lumen Backend API
After=network.target

[Service]
Type=simple
User=$VPS_USER
WorkingDirectory=$REMOTE_DIR
EnvironmentFile=$REMOTE_DIR/.env
ExecStart=/usr/bin/node dist/devServer.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
REMOTE_SYSTEMD

echo "==> Configurando Nginx (reverse proxy :80 -> :3333)..."
$SSH "$VPS_USER@$VPS_HOST" bash -s <<'REMOTE_NGINX'
set -euo pipefail

sudo tee /etc/nginx/sites-available/lumen-backend > /dev/null <<'CONF'
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
CONF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/lumen-backend /etc/nginx/sites-enabled/lumen-backend
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
REMOTE_NGINX

echo "==> Liberando portas 80/443 no firewall local (iptables)..."
$SSH "$VPS_USER@$VPS_HOST" bash -s <<'REMOTE_FW'
set -euo pipefail

if ! sudo iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 5 -p tcp -m tcp --dport 80 -j ACCEPT
fi
if ! sudo iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 6 -p tcp -m tcp --dport 443 -j ACCEPT
fi
sudo netfilter-persistent save
REMOTE_FW

echo "==> Testando endpoint..."
sleep 1
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://$VPS_HOST/api/liturgia?date=$(date +%Y-%m-%d)" || true

cat <<EOF

Deploy concluido.

Se o comando de teste acima nao retornar HTTP 200, confira se a porta 80
esta liberada na Security List / Network Security Group do provedor de
nuvem (isso o script nao consegue fazer, precisa ser feito no console web).
EOF
