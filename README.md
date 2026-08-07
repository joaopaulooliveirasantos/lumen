# Planejamento do Projeto - Aplicativo de Liturgia Diaria e Reflexoes

Data: 2026-07-28  
Base: Rascunho em PDF (Documentacao do Projeto - Aplicativo Liturgia Diaria e Reflexoes)

## 1. Objetivo do Produto
Entregar um aplicativo movel iOS/Android, com foco em oracao e estudo liturgico, que ofereca:
- Liturgia oficial diaria da Igreja no Brasil
- Reflexoes em texto e audio
- Funcionamento offline confiavel
- Navegacao por calendario liturgico
- Experiencia acessivel, rapida e simples

## 2. Escopo Funcional do MVP
- Leituras do dia: primeira leitura, salmo (com refrao destacado), segunda leitura quando houver, evangelho
- Reflexao diaria: texto + audio integrado
- Calendario: consultar datas passadas e futuras
- Offline: sincronizar proximos 7 dias automaticamente e permitir leitura sem internet
- Personalizacao: tamanho de fonte e modo de leitura (claro, escuro, sepia)
- Lembrete diario: notificacao configuravel por horario

## 3. Requisitos de Qualidade (Metas do MVP)
- Performance: abertura da tela principal em ate 1,5s offline
- Acessibilidade: contraste adequado, suporte a leitor de tela e ajuste de fonte
- Disponibilidade backend: 99,5%
- Confiabilidade de conteudo: validacao diaria dos dados liturgicos

## 4. Arquitetura Recomendada
- App mobile: Flutter (recomendado pelo equilibrio entre produtividade e performance)
- Banco local: SQLite com janela de dados (ultimos 30 + proximos 30 dias)
- Backend serverless: Node.js + TypeScript (Vercel ou Supabase Functions)
- Integracoes: API liturgica + feed RSS de reflexoes/homilias
- Estrategia: Offline-First com cache local como fonte primaria de leitura

## 5. Modelo de Dados (Resumo)
Entidade central por data contendo:
- Metadados liturgicos: data, nome liturgico, cor liturgica
- Leituras: referencias, titulos e textos
- Reflexao: autor, texto e URL de audio
- Controle de atualizacao: carimbo de atualizacao

## 6. UX/UI e Identidade Visual
- Tema dinamico por cor liturgica (verde, roxo, branco/dourado, vermelho, rosa)
- Tela principal orientada a leitura: tipografia confortavel, contraste alto, foco no conteudo
- Player de audio simples, fixo e continuo durante navegacao
- Fluxo principal em 2 toques: abrir app -> ler liturgia do dia

## 7. Roadmap por Fases
1. Fase 1 (2-3 semanas): Setup e Backend
- Criar middleware serverless
- Integrar API liturgica
- Parser de reflexoes RSS
- Entrega: API funcional e testada

2. Fase 2 (3-4 semanas): App MVP
- Estrutura mobile + navegacao
- Tela liturgia diaria
- Banco SQLite e sincronizacao
- Entrega: app rodando em simuladores/dispositivos

Status de implementacao: concluido no repositorio em `mobile/` (React Native + Expo), com consumo da API da Fase 1, cache offline SQLite por data e prefetch dos proximos 7 dias.

3. Fase 3 (2-3 semanas): Reflexoes e Midia
- Player de audio
- Personalizacao de leitura
- Notificacoes locais
- Entrega: versao beta fechada

Status de implementacao: concluido no repositorio em `mobile/`, com player de audio (play/pause/reinicio), personalizacao de fonte e tema (claro/escuro/sepia), e notificacao local diaria configuravel.

4. Fase 4 (2 semanas): Qualidade e Publicacao
- Acessibilidade e performance
- Testes com usuarios
- Publicacao Google Play e App Store
- Entrega: app em producao

Status de implementacao: concluido no repositorio com melhorias de acessibilidade (labels, hints, alvos de toque e suporte a fonte), artefatos de teste com usuarios e configuracao de release/submissao para lojas via EAS.

## 8. Backlog Priorizado (Resumo)
- Fundacional: configuracao inicial, tema, logging, analytics
- Conteudo: ingestao liturgia, normalizacao JSON, cache e invalidacao
- Experiencia: calendario, leitura do dia, destaque de refrao, player de audio
- Confiabilidade: retries de sync, fallback offline, monitoramento backend
- Operacao: pipeline CI/CD, build stores, politica de privacidade e termos

## 9. Plano de Testes
- Unitarios: parser, normalizacao de dados, regras de cache
- Integracao: app <-> backend <-> fontes externas
- E2E: fluxo diario completo (abrir, ler, ouvir, navegar data, offline)
- Aceite: bater metas de performance, acessibilidade e estabilidade

## 10. Riscos e Mitigacoes
- Instabilidade da fonte externa: cache agressivo + fallback por data
- Variacao de formato em RSS: parser tolerante + validacao
- Rejeicao em loja: adequacao antecipada de politica e conteudo
- Crescimento de dados offline: politica de retencao por janela movel

## 11. Indicadores de Sucesso (90 dias pos-lancamento)
- Retencao D7 e D30
- Leituras concluidas por usuario/semana
- Tempo medio de sessao
- Taxa de uso offline
- Taxa de falha de sincronizacao e crash-free sessions

## 12. Funcionalidades Adicionais (Pos-Roadmap)
- **Cadastro de Usuario**: login/cadastro opcional via Supabase Auth
  (e-mail/senha, Google, Apple), com sessao persistente e perfil publico.
  Login e opcional, nenhuma funcionalidade do app hoje depende de conta
  ativa. Configuracao de credenciais (Supabase/OAuth) ainda pendente antes
  de publicar. Detalhes completos em `doc/README-mobile-cadastro-usuario.md`.

## 13. Documentacao
Toda a documentacao adicional do projeto (arquitetura, deploy, fases,
politicas, changelogs) esta em [`doc/`](doc/). Destaques:
- [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md) — arquitetura completa (mobile + backend + auth), stack e funcionamento.
- [doc/README-backend-fase1.md](doc/README-backend-fase1.md) — detalhes do backend.
- [doc/README-deploy-vps.md](doc/README-deploy-vps.md) — runbook de deploy/operacao da VPS.
- [doc/README-mobile-cadastro-usuario.md](doc/README-mobile-cadastro-usuario.md) — feature de cadastro/login.
- [doc/RESUMO-IMPLEMENTACAO-E-PROXIMOS-PASSOS.md](doc/RESUMO-IMPLEMENTACAO-E-PROXIMOS-PASSOS.md) — status de entrega por fase.
