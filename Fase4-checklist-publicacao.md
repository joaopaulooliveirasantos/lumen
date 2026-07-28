# Fase 4 - Checklist de Publicacao

## 1. Acessibilidade e Qualidade
- [ ] Validar contraste dos 3 modos de leitura (claro, escuro, sepia).
- [ ] Confirmar leitura por leitor de tela nos controles principais.
- [ ] Garantir areas de toque minimas (44x44) nos botoes do app.
- [ ] Executar fluxo offline (abrir app sem internet com cache existente).
- [ ] Executar fluxo de notificacao local (ativar, desativar e reagendar).
- [ ] Executar fluxo de audio (play, pause, reiniciar, URL invalida).

## 2. Testes com Usuarios
- [ ] Rodar protocolo de teste em [Fase4-protocolo-teste-usuarios.md](Fase4-protocolo-teste-usuarios.md).
- [ ] Coletar pelo menos 8 participantes (4 praticantes frequentes e 4 ocasionais).
- [ ] Registrar taxa de conclusao das tarefas e tempo medio por tarefa.
- [ ] Consolidar principais dores e ajustes antes da publicacao.

## 3. Preparacao para Lojas
- [ ] Revisar identificadores de pacote no [mobile/app.json](mobile/app.json).
- [ ] Definir icone, splash e capturas de tela oficiais.
- [ ] Revisar descricao curta e longa da loja.
- [ ] Publicar politica de privacidade em URL publica.
- [ ] Publicar termos de uso em URL publica.

## 4. Build e Submissao
- [ ] Login no Expo e EAS configurado.
- [ ] Executar `npm run release:android` em [mobile/package.json](mobile/package.json).
- [ ] Executar `npm run release:ios` em [mobile/package.json](mobile/package.json).
- [ ] Executar submissao com `npm run submit:android` e `npm run submit:ios`.
- [ ] Monitorar status de revisao nas lojas.
