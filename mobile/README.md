# rosetta-mobile

Chat mobile (Expo + React Native) que desenha os componentes primitivos entregues pelo middleware. Visão geral em [../POC.md](../POC.md).

```bash
npm install
npx expo start      # abra no Expo Go (Android/iOS) pelo QR code
npx tsc --noEmit
```

O app descobre o middleware sozinho: usa o IP da máquina que roda o `expo start`, na porta 3333. O celular precisa estar na mesma rede, e o middleware já escuta em `0.0.0.0`. Para forçar outro endereço, use `EXPO_PUBLIC_API_URL=http://192.168.0.10:3333 npx expo start`.

| Caminho | O que faz |
| --- | --- |
| `src/contract.ts` | Contrato copiado do middleware (`npm run sync-contract` lá). Não edite aqui |
| `src/chat/` | Mesmo `useChat` e parser de markdown do web (copiados de `../web/src/chat/`) |
| `src/components/Primitive.tsx` | Desenho nativo de cada primitivo; o carrossel é um `ScrollView` horizontal |
| `src/config.ts` | Resolução da URL do middleware |
