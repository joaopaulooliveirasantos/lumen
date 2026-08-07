# Deploy do Backend em VPS

Documentacao da publicacao do backend (API de liturgia) em um VPS, fora do
Vercel usado anteriormente.

## Servidor

- **IP:** 147.15.109.185
- **Provedor:** Oracle Cloud Infrastructure (OCI)
- **SO:** Ubuntu 24.04 LTS (arm64)
- **Usuario SSH:** `ubuntu` (nao usar `root`, o login e bloqueado)
- **Chave SSH:** `~/.ssh/ssh-key-2026-07-31.key`
- **Sudo:** sem senha (`NOPASSWD`) para o usuario `ubuntu`

Conectar:
```bash
ssh -i ~/.ssh/ssh-key-2026-07-31.key ubuntu@147.15.109.185
```

## Arquitetura

```
Internet ──80/tcp──> Nginx (reverse proxy) ──127.0.0.1:3333──> Node.js (systemd)
```

- **App:** `/opt/lumen-backend` — codigo do backend (`package.json`,
  `tsconfig.json`, `src/`), buildado com `npm run build` para `dist/`.
- **Processo:** roda `dist/devServer.js` (servidor HTTP nativo em Node, o
  mesmo usado em desenvolvimento local), escutando na porta 3333.
- **Servico systemd:** `lumen-backend`
  (`/etc/systemd/system/lumen-backend.service`) — mantem o processo no ar,
  reinicia sozinho se cair (`Restart=always`) e inicia no boot.
- **Nginx:** proxy reverso ouvindo na porta 80, repassando tudo para
  `127.0.0.1:3333`. Config em `/etc/nginx/sites-available/lumen-backend`.
- **Variaveis de ambiente:** `/opt/lumen-backend/.env`, carregado pelo
  systemd via `EnvironmentFile`. Mesmas chaves do `.env.example` do repo
  (`LITURGY_API_URL_TEMPLATE`, `EVANGELIZO_LANG`, `EVANGELIZO_CONTENT`) mais
  `PORT=3333`.

## Endpoint publico

```
GET http://147.15.109.185/api/liturgia?date=YYYY-MM-DD
GET http://147.15.109.185/api/liturgia?date=YYYY-MM-DD&type=saint
GET http://147.15.109.185/api/liturgia?date=YYYY-MM-DD&type=saint-story
```

O `type=saint-story` busca a historia do santo do dia raspada do site
[santo.cancaonova.com](https://santo.cancaonova.com/), usado pela tela de
historia do santo no app mobile.

Sem HTTPS por enquanto (nao ha dominio apontando para o IP). Para adicionar
HTTPS no futuro: apontar um dominio para o IP e configurar Certbot
(`sudo apt install certbot python3-certbot-nginx`).

## Firewall

Existem duas camadas, as duas precisam liberar a porta:

1. **iptables no SO** — ja liberado (portas 80 e 443), persistido com
   `netfilter-persistent save` (pacote `iptables-persistent`), sobrevive a
   reboot.
2. **Security List / Network Security Group da OCI** — regra de entrada
   (ingress) para TCP 80 (e 443) liberada manualmente no console web da
   Oracle Cloud. **Isso nao pode ser automatizado por SSH**, precisa ser
   feito no console:
   - `Networking > Virtual Cloud Networks > <VCN> > Security Lists` (ou
     `Network Security Groups`, dependendo de como a instancia foi criada)
   - `Add Ingress Rules`: Source `0.0.0.0/0`, Protocolo TCP, porta 80 (e 443)

Por padrao, a OCI so libera a porta 22 (SSH). Se o backend parar de responder
externamente depois de recriar a instancia ou trocar de VCN, comece
verificando esta regra.

## App mobile

O app aponta para o backend publicado via `mobile/app.json`, campo
`expo.extra.apiBaseUrl`. Hoje esta configurado para
`http://147.15.109.185`. Para testar contra outro ambiente (ex: backend
local), trocar esse valor.

## Redeploy / atualizacao

Use o script `scripts/deploy-vps.sh` (ver secao abaixo) para reenviar o
codigo, rebuildar e reiniciar o servico. Ele e idempotente: pode ser rodado
tanto para o primeiro setup em um servidor novo quanto para atualizacoes de
rotina.

## Comandos uteis no servidor

```bash
# status do servico
sudo systemctl status lumen-backend

# logs em tempo real
sudo journalctl -u lumen-backend -f

# reiniciar so o backend
sudo systemctl restart lumen-backend

# testar nginx e recarregar config
sudo nginx -t && sudo systemctl reload nginx

# testar localmente no servidor (sem depender do firewall externo)
curl http://127.0.0.1:3333/api/liturgia?date=2026-08-01
curl http://127.0.0.1/api/liturgia?date=2026-08-01
```

## Limitacoes conhecidas / proximos passos

- Sem HTTPS (precisa de dominio).
- Sem monitoramento/alertas (so restart automatico via systemd).
- Deploy manual via script — sem CI/CD automatico a partir do GitHub.
- `.env` do servidor e mantido manualmente; o script de deploy nao sobrescreve
  um `.env` ja existente, entao mudancas feitas direto no servidor sao
  preservadas entre deploys.
