import { createTwilioClient } from './client';
import { createWhatsAppSender } from './sender';
import type { TwilioOptions } from './webhook';

/**
 * Lê a configuração do Twilio do ambiente (.env). Sem credenciais, roda em dry-run.
 *
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN  credenciais da conta
 *   TWILIO_WHATSAPP_FROM                   ex.: whatsapp:+14155238886 (sandbox)
 *   TWILIO_WEBHOOK_URL                     URL pública do webhook (ngrok), ativa a validação de assinatura
 */
export function twilioFromEnv(env: NodeJS.ProcessEnv = process.env): TwilioOptions & { mode: 'live' | 'dry-run' } {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_WHATSAPP_FROM;
  const publicUrl = env.TWILIO_WEBHOOK_URL;

  if (!accountSid || !authToken || !from) return { mode: 'dry-run' };

  return {
    mode: 'live',
    sender: createWhatsAppSender({ client: createTwilioClient({ accountSid, authToken }), from }),
    authToken,
    publicUrl,
  };
}
