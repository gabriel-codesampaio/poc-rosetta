# rosetta-web

Chat web (Vite + React) que desenha os componentes primitivos entregues pelo middleware. Visão geral em [../POC.md](../POC.md).

```bash
npm install
npm run dev     # http://localhost:5173 (precisa do middleware em http://localhost:3333)
npm run build
```

Para apontar para outro middleware, use `VITE_API_URL=http://host:3333 npm run dev`.

| Caminho | O que faz |
| --- | --- |
| `src/contract.ts` | Contrato copiado do middleware (`npm run sync-contract` lá). Não edite aqui |
| `src/chat/useChat.ts` | Estado do chat sem UI; o mesmo arquivo é usado no mobile |
| `src/chat/markdown.ts` | Markdown leve → trechos neutros de plataforma (sem injetar HTML) |
| `src/components/Primitive.tsx` | Desenho de cada primitivo: text, image, buttons, card, carousel |

`src/chat/` é compartilhado com o mobile por cópia. Se mudar aqui, copie para `../mobile/src/chat/`.
