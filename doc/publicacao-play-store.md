# Publicação na Play Store (Fase 9)

Roteiro para publicar o novo app (`lumen/web`) em produção, no lugar do app React Native. Os passos marcados com **Play Console** são feitos manualmente no navegador. O restante já está no repositório.

Pacote: `com.joaopaulosantos.lumen`. Assinatura de upload: SHA1 `C3:33:81:45:6C:64:EF:45:38:9B:81:7D:7B:5B:01:65:E3:1C:22:8F`.

## 1. Antes de enviar à produção

| Item | Onde | Estado |
|---|---|---|
| Política de privacidade atualizada (login obrigatório, telefone, LGPD) | `src/static/privacy-policy.html`, servida em `/privacy-policy` | Pronta no repositório. **Publicar na VPS** junto com o lançamento (`bash scripts/deploy-vps.sh`) |
| Página de exclusão de conta sem o app (exigência da Play) | `src/static/excluir-conta.html`, servida em `/excluir-conta` | Pronta no repositório. Publicar junto com a política |
| Termos de Uso | `doc/Termos-de-Uso.md` (embutido no app) | Pronto. Revisar o texto |
| SMTP próprio no Supabase | Supabase › Authentication › SMTP | **Pendente.** O SMTP padrão do Supabase envia poucos e-mails por hora; com o cadastro obrigatório, confirmações e recuperações de senha podem travar. Sugestão: Resend (plano gratuito), com um domínio próprio |
| HTTPS na VPS | Nginx + Certbot | **Pendente**, depende de um domínio apontando para `147.15.109.185`. Não bloqueia a Play (o app não envia dados pessoais à VPS), mas é recomendado. Ao trocar, atualizar `VITE_API_BASE_URL` no workflow e as URLs da Play Console |
| Conta de teste para o revisor | Play Console › Acesso ao app | **Pendente** (seção 3) |
| Formulário de Segurança dos dados | Play Console › Conteúdo do app | **Pendente** (seção 4) |

## 2. Envio pelo CI (opcional, recomendado)

O workflow `web-android.yml` tem a opção `track`:
- `nenhuma` (padrão): só gera o AAB como artefato, como antes;
- `internal`: gera e libera na trilha interna;
- `production`: gera e inicia um lançamento em etapas com a fração `rollout` (padrão 0.1 = 10%).

As notas da versão saem de `web/android/whatsnew/whatsnew-pt-BR` (até 500 caracteres).

Configuração (uma vez):
1. No Google Cloud Console, no projeto ligado à Play Console (ou num projeto novo), ative a **Google Play Android Developer API**.
2. Crie uma **conta de serviço** e gere uma chave **JSON**.
3. **Play Console** › Usuários e permissões › Convidar novos usuários: use o e-mail da conta de serviço e dê, só para este app, as permissões de **lançar em trilhas de teste** e **lançar em produção**.
4. No GitHub, crie o segredo `PLAY_SERVICE_ACCOUNT_JSON` com o conteúdo do JSON. Depois apague o arquivo do computador.

```bash
gh secret set PLAY_SERVICE_ACCOUNT_JSON < chave.json
gh workflow run web-android.yml -f version_code=22 -f version_name=1.1.0 -f track=internal
```

Sem o segredo, os envios com `track` diferente de `nenhuma` falham no último passo, mas o AAB continua disponível como artefato.

## 3. Acesso ao app (conta do revisor)

Com login obrigatório, o revisor da Google precisa de uma conta pronta.
1. No app, crie uma conta com um e-mail exclusivo para isso (ex.: um alias do seu e-mail), uma senha forte, nome "Revisor Google Play" e um telefone qualquer válido. Confirme o e-mail.
2. Entre com essa conta e conclua o cadastro, para o revisor cair direto na Home.
3. **Play Console** › Conteúdo do app › **Acesso ao app** › "Todas ou algumas funcionalidades estão restritas" › adicione as instruções:
   - nome: "Conta de teste";
   - e-mail e senha da conta criada;
   - observação: "Login com e-mail e senha na tela inicial. Não há verificação por SMS nem código adicional."
4. Não guarde a senha no repositório. Não exclua essa conta enquanto o app estiver publicado.

## 4. Segurança dos dados (Play Console › Conteúdo do app)

Respostas conforme o que o app faz hoje (conferido no código em 2026-11-20):

**Coleta e compartilhamento**
- O app coleta ou compartilha dados do usuário? **Sim.**
- Todos os dados são criptografados em trânsito? **Sim.** Os dados pessoais só vão ao Supabase, por HTTPS. A VPS (HTTP) recebe apenas a data da liturgia e serve textos públicos, sem dados do usuário.
- O usuário pode pedir a exclusão dos dados? **Sim.** URL de exclusão de conta: `http://147.15.109.185/excluir-conta` (trocar pelo domínio com HTTPS quando houver).

**Tipos de dados coletados** (nenhum é compartilhado: o Supabase e o Google atuam como provedores de serviço, o que a Play não conta como compartilhamento)

| Categoria › tipo | Obrigatório? | Finalidade | Processado só temporariamente? |
|---|---|---|---|
| Informações pessoais › Nome | Obrigatório | Gerenciamento da conta | Não |
| Informações pessoais › Endereço de e-mail | Obrigatório | Gerenciamento da conta | Não |
| Informações pessoais › Número de telefone | Obrigatório | Gerenciamento da conta | Não |
| Informações pessoais › IDs do usuário | Obrigatório | Gerenciamento da conta | Não |

- **Foto de perfil do Google**: o Supabase guarda o *endereço* da foto que o Google informa no login com Google, e o app a mostra no Perfil. Não há envio de fotos pelo usuário. Se quiser ser conservador, declare também "Fotos e vídeos › Fotos", opcional, finalidade "Gerenciamento da conta".
- **Não declarar**: localização, contatos, atividade no app, histórico de navegação, IDs do dispositivo, diagnósticos ou registros de falhas. Não há analytics nem SDK de falhas. Preferências, histórico de leitura, versículos marcados e progresso ficam só no aparelho, e dados que não saem do aparelho não contam como coletados.

**Outras seções da Play Console**
- Política de privacidade: `http://147.15.109.185/privacy-policy`.
- Anúncios: **não** contém anúncios.
- Público-alvo: manter o atual (o app não é direcionado a crianças).
- Exclusão de conta: a mesma URL `/excluir-conta`, e "Sim, os usuários podem excluir a conta no app".

## 5. Lançamento

1. **Trilha interna**: AAB testado no aparelho (feito até o build 21).
2. Publicar a política e a página de exclusão na VPS: `bash scripts/deploy-vps.sh`. Conferir `http://147.15.109.185/privacy-policy` e `/excluir-conta`.
3. Preencher as seções 3 e 4 na Play Console.
4. **Produção em etapas**: promover o último AAB da trilha interna para produção com 10% (Play Console › Produção › Criar versão › "Adicionar da biblioteca"), ou gerar um novo pelo CI com `track=production`.
5. Acompanhar por 2 a 3 dias: Play Console › Qualidade (falhas e ANRs), avaliações e o e-mail de contato. Subir para 50% e depois para 100%.
6. Se houver problema grave: Play Console › Produção › **Interromper lançamento**, corrigir e enviar um `versionCode` maior. Não dá para voltar a um AAB anterior com `versionCode` menor.

Quem já usa o app RN recebe o novo como atualização normal. No primeiro acesso, precisa criar uma conta ou entrar. Os dados locais do RN são copiados automaticamente na primeira abertura: configurações, versículos marcados com comentários, progresso dos planos e históricos de liturgia e terço. O lembrete diário é reagendado se a permissão de notificação já estava concedida. Só a voz escolhida para a leitura em voz alta não é migrada. Detalhes em `web/src/storage/legacyMigration.ts`.
