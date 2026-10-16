import { existsSync } from 'node:fs';
import { createApp } from './app';
import { twilioFromEnv } from './twilio/config';

if (existsSync('.env')) process.loadEnvFile('.env');

const PORT = Number(process.env.PORT ?? 3333);
const twilio = twilioFromEnv();

const { app } = createApp({ twilio });

// 0.0.0.0 para o app mobile (Expo) alcançar o middleware pela rede local.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`rosetta middleware ouvindo em http://localhost:${PORT}`);
  console.log(`painel de debug:    http://localhost:${PORT}/debug`);
  console.log(`twilio:             ${twilio.mode}${twilio.publicUrl ? ' · assinatura validada' : ''}`);
});
