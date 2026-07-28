# Mobile Fase 2, 3 e 4 - MVP, Beta e Publicacao

## Entregas desta fase
- Aplicativo React Native (Expo) em TypeScript
- Tela principal da liturgia diaria consumindo GET /api/liturgia?date=YYYY-MM-DD
- Navegacao por data (dia anterior/proximo dia)
- Cache offline com SQLite por data
- Sincronizacao nao bloqueante dos proximos 7 dias
- Player de audio integrado para homilia/reflexao quando houver URL
- Personalizacao de leitura (modo claro, escuro e sepia)
- Ajuste de tamanho de fonte com persistencia local
- Notificacao local diaria com horario configuravel (HH:MM)
- Ajustes de acessibilidade (labels, hints, botoes com area de toque minima)
- Scripts e configuracao de build/submissao para lojas (EAS)

## Estrutura
- mobile/App.tsx: tela principal e fluxo de carregamento online/offline
- mobile/src/services/api.ts: cliente HTTP para backend da Fase 1
- mobile/src/storage/liturgyCache.ts: persistencia local com expo-sqlite
- mobile/src/components/*.tsx: blocos de UI para leituras e reflexao
- mobile/src/components/AudioPlayer.tsx: controles de reproducao/pausa/reinicio
- mobile/src/services/notifications.ts: agendamento e cancelamento de lembretes diarios
- mobile/src/storage/userSettings.ts: persistencia de preferencias do usuario

## Execucao
1. Inicie o backend no projeto raiz:
   npm run dev

2. Entre na pasta mobile e instale dependencias:
   cd mobile
   npm install

3. Inicie o app:
   npm run start

4. Abra no Android/iOS pelo Expo.

## Observacoes de notificacao
- Em alguns ambientes Expo Go, notificacoes locais podem ter limitacoes.
- Em build de desenvolvimento/producao, o lembrete diario usa canal Android `lumen-reminders`.

## Endpoint esperado
- Base URL definida em mobile/app.json -> expo.extra.apiBaseUrl
- Padrão configurado: http://10.0.2.2:3333 (Android Emulator)

## Observacoes de conectividade
- Android Emulator: usar http://10.0.2.2:3333
- iOS Simulator: usar http://localhost:3333
- Dispositivo fisico: usar IP da maquina local, por exemplo http://192.168.0.10:3333
