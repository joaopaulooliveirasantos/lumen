# Fase 4 - Qualidade e Publicacao

Esta fase consolida:
- Ajustes de acessibilidade e melhorias de usabilidade no app mobile.
- Processo de testes com usuarios para validacao de experiencia.
- Preparacao de build e submissao para Google Play e App Store.

## Arquivos principais desta fase
- [mobile/eas.json](mobile/eas.json)
- [mobile/app.json](mobile/app.json)
- [mobile/package.json](mobile/package.json)
- [Fase4-checklist-publicacao.md](Fase4-checklist-publicacao.md)
- [Fase4-protocolo-teste-usuarios.md](Fase4-protocolo-teste-usuarios.md)
- [Politica-de-Privacidade.md](Politica-de-Privacidade.md)
- [Termos-de-Uso.md](Termos-de-Uso.md)

## Comandos de release
Executar em [mobile/package.json](mobile/package.json):
- `npm run release:android`
- `npm run release:ios`
- `npm run submit:android`
- `npm run submit:ios`

## Observacao
Antes da submissao final, publique Politica de Privacidade e Termos em URLs publicas e atualize os links nas lojas.
