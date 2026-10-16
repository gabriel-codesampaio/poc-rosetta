# rosetta-middleware

Camada de tradução de componentes da POC (visão completa em [../POC.md](../POC.md)).
A IA responde em componentes primitivos; o middleware valida, adapta para cada canal e registra as decisões.

## Rodando

```bash
npm install
npm run dev        # http://localhost:3333 — painel em /debug
npm test           # regras do adapter + roteiro completo nos 3 canais
npm run typecheck
npm run sync-contract   # copia src/contract.ts para ../web e ../mobile
```

No painel de debug, envie mensagens como qualquer canal. Experimente `Oi`, `saldo`, `ofertas`, um número (`2`) ou `limites` (que força todas as regras de fallback).

## API

`POST /chat`

```json
{ "sessionId": "abc", "channel": "web" | "mobile" | "whatsapp", "text": "Oi" }
{ "sessionId": "abc", "channel": "web", "action": { "id": "offers" } }
```

Devolve `{ contractVersion, sessionId, channel, messages }`: primitivos para web/mobile e mensagens WhatsApp (`text`, `media`, `quick_reply`, `list`) para whatsapp.

## WhatsApp via Twilio

Sem credenciais, `POST /twilio/webhook` roda em **dry-run**: o turno acontece e aparece no `/debug`, mas nada é enviado. Para testar isso sem Twilio:

```bash
curl -X POST localhost:3333/twilio/webhook --data-urlencode "From=whatsapp:+5511999990000" --data-urlencode "Body=Oi"
```

Para ligar o envio real no sandbox:

1. No Console do Twilio, ative o **WhatsApp Sandbox** (Messaging → Try it out → Send a WhatsApp message) e entre nele pelo celular, mandando o código `join ...` para o número do sandbox.
2. Exponha o middleware: `ngrok http 3333`.
3. No sandbox, configure **When a message comes in** com `https://<seu-ngrok>/twilio/webhook` (POST).
4. Copie `.env.example` para `.env` e preencha `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` e `TWILIO_WEBHOOK_URL` (a URL do passo 3; ela ativa a validação de assinatura).
5. Reinicie o middleware. O log deve mostrar `twilio: live`.

Quick reply e lista são enviados como Content Templates criados na hora (`twilio/quick-reply`, `twilio/list-picker`) e reaproveitados pelo hash do conteúdo. Dentro da sessão de 24h aberta pelo usuário, eles não precisam de aprovação do WhatsApp. O número do usuário (`From`) é a sessão.

## Onde está cada coisa

| Caminho | O que faz |
| --- | --- |
| `src/contract.ts` | Contrato de primitivos (Zod), fonte da verdade |
| `src/adapter/types.ts` | `ComponentAdapter`: a fronteira trocável (regras hoje, IA orquestradora no futuro) |
| `src/adapter/capabilities.ts` | Capability matrix por canal |
| `src/adapter/degrade.ts` | Cadeias de fallback genéricas (carrossel → cards → imagem + botões…) |
| `src/adapter/renderers/whatsapp.ts` | Botões: quick reply → lista → texto numerado; markdown do WhatsApp |
| `src/events/normalize.ts` | Clique, número ou rótulo viram o mesmo evento |
| `src/ai/mockAi.ts` | IA de negócio simulada |
| `src/chat/service.ts` | Um turno: normalizar → IA → validar → adaptar → registrar |
| `src/debug/` | Painel de debug |
| `src/twilio/` | Cliente REST, sender (WhatsAppMessage → Twilio), webhook e validação de assinatura |
