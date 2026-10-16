# Rosetta

POC de uma camada de tradução de componentes: uma IA responde **uma vez**, em componentes primitivos, e o Rosetta adapta essa resposta para cada canal (Web, Mobile e WhatsApp) sem perder conteúdo.

```
IA (primitivos) → Rosetta: validar → adaptar → registrar → Web · Mobile · WhatsApp
```

A motivação, a arquitetura, as regras de fallback e os próximos passos estão em **[POC.md](POC.md)**.

## Projetos

| Pasta | Stack | O que é |
| --- | --- | --- |
| [`middleware/`](middleware) | Node + Express + Zod | Contrato, IA mock, filtro por canal, painel de debug e integração com o Twilio |
| [`web/`](web) | Vite + React | Chat web que desenha os primitivos |
| [`mobile/`](mobile) | Expo + React Native | O mesmo chat no celular |

## Rodando

```bash
cd middleware && npm install && npm run dev   # http://localhost:3333 · painel em /debug
cd web && npm install && npm run dev          # http://localhost:5173
cd mobile && npm install && npx expo start    # Expo Go, mesma rede
```

No painel de debug, mande `Oi` e siga pelos botões, ou mande `limites` para ver todas as regras de fallback agindo ao mesmo tempo.

Os dados (saldo, ofertas, imagens) são fictícios.
