# Publicação na Play Store (Fase 9)

Roteiro para publicar o novo app (`lumen/web`) em produção, no lugar do app React Native. Os passos marcados com **Play Console** são feitos manualmente no navegador. O restante já está no repositório.

Pacote: `com.joaopaulosantos.lumen`. Assinatura de upload: SHA1 `C3:33:81:45:6C:64:EF:45:38:9B:81:7D:7B:5B:01:65:E3:1C:22:8F`.

## 1. Antes de enviar à produção

| Item | Onde | Estado |
|---|---|---|
| Política de privacidade atualizada (login obrigatório, telefone, LGPD) | `src/static/privacy-policy.html`, servida em `/privacy-policy` | Publicada na VPS em 2026-11-20 |
| Página de exclusão de conta sem o app (exigência da Play) | `src/static/excluir-conta.html`, servida em `/excluir-conta` | Publicada na VPS em 2026-11-20 |
| Termos de Uso | `doc/Termos-de-Uso.md` (embutido no app) | Pronto. Revisar o texto |
| SMTP próprio no Supabase | Supabase › Authentication › SMTP | Configurado em 2026-11-20 (Resend com domínio próprio). Conferir o limite de e-mails por hora em Authentication › Rate Limits e acompanhar os envios em Resend › Logs |
| HTTPS na VPS | Nginx + Certbot | Feito em 2026-11-20: `https://api.lumenliturgia.com.br`, certificado do Let's Encrypt com renovação automática. O app usa esse endereço a partir do build 23. O HTTP pelo IP continua ativo para os builds antigos |
| Conta de teste para o revisor | Play Console › Acesso ao app | Feito em 2026-11-20 |
| Formulário de Segurança dos dados | Play Console › Conteúdo do app | Feito em 2026-11-20 |

## 2. Envio pelo CI (opcional, recomendado)

O workflow `web-android.yml` tem a opção `track`:
- `nenhuma` (padrão): só gera o AAB como artefato, como antes;
- `internal`: gera e libera na trilha interna;
- `production`: gera e inicia um lançamento em etapas com a fração `rollout` (padrão 0.1 = 10%).

As notas da versão saem de `web/android/whatsnew/whatsnew-pt-BR` (até 500 caracteres).

Configuração (uma vez, cerca de 10 minutos):

**A. Google Cloud: projeto e API**
1. Abra console.cloud.google.com com a mesma conta Google da Play Console.
2. No seletor de projetos (topo), crie um projeto novo, por exemplo `lumen-play-ci`. Pode reaproveitar um existente, mas um projeto só para isso é mais fácil de controlar.
3. Menu › **APIs e serviços › Biblioteca** › busque **Google Play Android Developer API** › **Ativar**.

**B. Conta de serviço e chave JSON**
1. Menu › **IAM e administrador › Contas de serviço** › **Criar conta de serviço**.
2. Nome: `github-play-upload`. Clique em **Criar e continuar**.
3. Nas etapas de papéis e acesso, **não escolha nada** (as permissões são dadas na Play Console) e clique em **Concluir**.
4. Copie o e-mail da conta criada (algo como `github-play-upload@lumen-play-ci.iam.gserviceaccount.com`).
5. Abra a conta › aba **Chaves** › **Adicionar chave › Criar nova chave** › **JSON** › **Criar**. O arquivo `.json` é baixado. Ele dá acesso de publicação: não envie por e-mail nem coloque no repositório.

**C. Play Console: permissões**
1. Play Console › **Usuários e permissões** (menu da esquerda, no nível da conta, fora do app) › **Convidar novos usuários**.
2. E-mail: o da conta de serviço.
3. Aba **Permissões do app** › **Adicionar app** › Lumen › marque:
   - **Lançar apps em trilhas de teste**;
   - **Gerenciar trilhas de teste e editar listas de testadores**;
   - **Lançar em produção, excluir dispositivos e usar a Assinatura de apps do Google Play**.
   Deixe as permissões da conta (aba **Permissões da conta**) desmarcadas.
4. **Convidar usuário**. A conta de serviço não precisa aceitar o convite.
5. A permissão pode levar de alguns minutos a 24 horas para valer. Antes disso, o envio falha com "The caller does not have permission".

**D. GitHub: segredo**
- Pelo terminal (na pasta `lumen`):
  ```bash
  gh secret set PLAY_SERVICE_ACCOUNT_JSON < "C:/Users/jposr/Downloads/lumen-play-ci-xxxx.json"
  ```
- Ou pelo site: repositório › **Settings › Secrets and variables › Actions › New repository secret**, nome `PLAY_SERVICE_ACCOUNT_JSON`, valor = todo o conteúdo do arquivo.
- Depois apague o arquivo `.json` do computador (e da lixeira). Se precisar de novo, gere outra chave e exclua a antiga na aba Chaves.

**E. Primeiro envio de teste**
```bash
gh workflow run web-android.yml -f version_code=27 -f version_name=1.1.0 -f track=internal
```
- Use sempre um `version_code` maior que o último enviado à Play.
- `track=internal` publica na trilha interna na hora. `track=production` inicia o lançamento em etapas com `rollout` (padrão `0.1` = 10%); para outro valor, `-f rollout=0.5`.
- As notas da versão vão junto, de `web/android/whatsnew/whatsnew-pt-BR`.
- Se falhar, o AAB continua disponível como artefato do run, e dá para enviar manualmente.

**Erros comuns**
- "The caller does not have permission": a permissão do passo C ainda não valeu ou faltou marcar o app.
- "Package not found": o `packageName` não bate ou o app não foi escolhido no passo C.3.
- "APK specifies a version code that has already been used": aumente o `version_code`.
- "Only releases with status draft may be created on draft app": não se aplica ao Lumen, que já está publicado.

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
- Todos os dados são criptografados em trânsito? **Sim.** Os dados pessoais só vão ao Supabase, por HTTPS. A VPS (também HTTPS a partir do build 23) recebe apenas a data da liturgia e serve textos públicos, sem dados do usuário.
- O usuário pode pedir a exclusão dos dados? **Sim.** URL de exclusão de conta: `https://api.lumenliturgia.com.br/excluir-conta`.

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
- Política de privacidade: `https://api.lumenliturgia.com.br/privacy-policy`.
- Anúncios: **não** contém anúncios.
- Público-alvo: manter o atual (o app não é direcionado a crianças).
- Exclusão de conta: a mesma URL `/excluir-conta`, e "Sim, os usuários podem excluir a conta no app".

## 5. Lançamento

1. **Trilha interna**: AAB testado no aparelho (feito até o build 23).
2. ~~Publicar a política e a página de exclusão na VPS~~ (feito em 2026-11-20). Conferir `https://api.lumenliturgia.com.br/privacy-policy` e `/excluir-conta`.
3. Preencher as seções 3 e 4 na Play Console.
4. **Produção em etapas**: promover o último AAB da trilha interna para produção com 10% (Play Console › Produção › Criar versão › "Adicionar da biblioteca"), ou gerar um novo pelo CI com `track=production`.
5. Acompanhar por 2 a 3 dias: Play Console › Qualidade (falhas e ANRs), avaliações e o e-mail de contato. Subir para 50% e depois para 100%.
6. Se houver problema grave: Play Console › Produção › **Interromper lançamento**, corrigir e enviar um `versionCode` maior. Não dá para voltar a um AAB anterior com `versionCode` menor.

Quem já usa o app RN recebe o novo como atualização normal. No primeiro acesso, precisa criar uma conta ou entrar. Os dados locais do RN são copiados automaticamente na primeira abertura: configurações, versículos marcados com comentários, progresso dos planos e históricos de liturgia e terço. O lembrete diário é reagendado se a permissão de notificação já estava concedida. Só a voz escolhida para a leitura em voz alta não é migrada. Detalhes em `web/src/storage/legacyMigration.ts`.
