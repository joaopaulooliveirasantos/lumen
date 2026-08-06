# Ficha da loja — Google Play (pt-BR)

## Descrição curta (máx. 80 caracteres)

Liturgia diária, terço, orações e Bíblia — sua fé no bolso.

(59/80 caracteres)

## Descrição completa (máx. 4000 caracteres)

Lumen Liturgia é o seu companheiro diário de oração católica: leituras da
liturgia, terço guiado, orações e Bíblia, tudo em um só lugar — com ou sem
internet.

📖 LITURGIA DIÁRIA
Acesse a primeira leitura, salmo, segunda leitura (quando houver), Evangelho
e uma homilia/reflexão para cada dia. Navegue por qualquer data no
calendário e volte a qualquer leitura já publicada. As leituras ficam
salvas no aparelho, então você consegue reler mesmo sem conexão.

🎧 PLAYER DE LEITURA
Ouça as leituras do dia narradas por voz, com navegação entre trechos,
copiar texto e compartilhar com um toque.

✦ SANTO DO DIA
Conheça o santo ou santa celebrado em cada data, com a história completa
de vida, obra e legado.

🌹 TERÇO GUIADO
Reze o terço com a condução completa: escolha do mistério (com sugestão
automática conforme o dia da semana), passo a passo de cada Ave-Maria e
Pai-Nosso, e acompanhamento do seu progresso de oração na semana.

🙏 ORAÇÕES
Um repertório de orações católicas tradicionais, sempre à mão.

✝️ BÍBLIA
Consulte a Bíblia Ave-Maria ou a Bíblia Pastoral (Paulus) — você escolhe a
tradução preferida nas configurações.

🔔 LEMBRETE DIÁRIO
Configure um horário para receber um lembrete e não perder sua leitura do
dia.

🎨 PERSONALIZAÇÃO
Ajuste o tamanho da fonte e escolha entre os modos de leitura claro, escuro
e sépia, para ler com o máximo de conforto.

📶 FUNCIONA OFFLINE
As leituras da liturgia ficam salvas no seu aparelho, para consulta mesmo
sem internet.

Lumen Liturgia não exige cadastro para usar o conteúdo principal e não
exibe anúncios. Tudo o que você configura ou marca como lido fica salvo
apenas no seu próprio aparelho. Criar conta é opcional (e-mail/senha,
Google ou Apple) e serve apenas para identificar o usuário — nenhuma
funcionalidade hoje depende de estar logado.

---

## Categoria sugerida
Estilo de vida (Lifestyle) ou Livros e referência

## Palavras-chave sugeridas (para a busca)
liturgia, missa, católico, oração, terço, rosário, bíblia, santo do dia,
evangelho, homilia, leitura diária

## Notas para o formulário "Data safety" (Segurança de dados)
Com base no código atual do app (atualizado após a funcionalidade de
Cadastro de Usuário via Supabase Auth):
- **Cadastro é opcional.** Sem conta, o app não coleta nenhum dado
  pessoal — tudo fica local (AsyncStorage/SQLite): configurações,
  histórico de leitura, progresso do terço, marcadores da Bíblia.
- **Com conta**, o app coleta e-mail (sempre) e senha (cadastro por
  e-mail) ou nome/foto de perfil (login social). Isso provavelmente marca
  "sim" para a categoria **Informações pessoais → E-mail** (e **Nome**,
  se o login social fornecer) no questionário do Play Console.
- **Finalidade declarada:** funcionalidade do app / gerenciamento de
  conta. Não é usado para publicidade, e não sai do provedor de
  autenticação (Supabase) e dos provedores de login social (Google/Apple).
- **Terceiros com acesso aos dados de conta:** Supabase (processa
  autenticação e hospeda o banco), Google e Apple (apenas quando o
  usuário escolhe login social com eles).
- **Criptografia em trânsito:** sim (HTTPS/TLS, gerenciado pelo SDK do
  Supabase).
- **Exclusão de dados:** ainda não há um botão de exclusão de conta no
  app (pendência registrada em `README-mobile-cadastro-usuario.md`) —
  até lá, o Play Console pode exigir informar um processo manual (e-mail
  de contato) para o usuário solicitar a exclusão.
- Notificações de lembrete continuam sendo agendadas localmente (não usa
  push remoto).
- As chamadas de rede ao backend próprio (`api/liturgia`) continuam
  enviando apenas a data solicitada — nenhum identificador pessoal.
- Não compartilha dados com terceiros para fins de publicidade.

Revise você mesmo o questionário antes de enviar — só quem publica o app
pode confirmar oficialmente essa declaração no Play Console.
