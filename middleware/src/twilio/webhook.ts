import express, { Router } from 'express';
import type { WhatsAppMessage } from '../adapter/renderers/whatsapp';
import type { ChatService } from '../chat/service';
import { isValidTwilioSignature } from './signature';
import type { WhatsAppSender } from './sender';

export interface TwilioOptions {
  /** Ausente = dry-run: o turno roda e aparece no painel, mas nada é enviado ao Twilio. */
  sender?: WhatsAppSender;
  /** Com os dois preenchidos, o webhook recusa requisições sem assinatura válida. */
  authToken?: string;
  publicUrl?: string;
}

/** Parâmetros relevantes do webhook de mensagem recebida do Twilio. */
export type InboundParams = Record<string, string>;

/**
 * Entrada do WhatsApp. O número do usuário (`From`) é a sessão.
 * Botão de quick reply chega em `ButtonPayload`, item de lista em `ListId`;
 * os dois já são o actionId. Texto livre (inclusive "2") segue para a normalização.
 */
export function createInboundHandler(chat: ChatService, opts: TwilioOptions) {
  return async function handleInbound(params: InboundParams): Promise<WhatsAppMessage[] | undefined> {
    const from = params.From;
    const actionId = params.ButtonPayload || params.ListId;
    const text = params.Body?.trim();
    if (!from || (!actionId && !text)) return undefined;

    const result = await chat.handle({
      sessionId: from,
      channel: 'whatsapp',
      ...(actionId ? { action: { id: actionId } } : { text }),
    });
    const messages = result.messages as WhatsAppMessage[];

    if (opts.sender) await opts.sender.send(from, messages);
    else console.log(`[twilio dry-run] ${messages.length} mensagens para ${from} (veja /debug)`);
    return messages;
  };
}

export function createTwilioRouter(chat: ChatService, opts: TwilioOptions): Router {
  const router = Router();
  const handleInbound = createInboundHandler(chat, opts);

  router.post('/twilio/webhook', express.urlencoded({ extended: false }), (req, res) => {
    const params = req.body as InboundParams;

    if (opts.authToken && opts.publicUrl) {
      const ok = isValidTwilioSignature(opts.authToken, opts.publicUrl, params, req.header('x-twilio-signature'));
      if (!ok) {
        res.status(403).send('assinatura inválida');
        return;
      }
    }

    // Responde logo (o Twilio espera até 15 s) e envia as mensagens pela API REST,
    // porque quick reply e lista exigem ContentSid, que o TwiML não suporta.
    res.type('text/xml').send('<Response></Response>');
    handleInbound(params).catch((err) => console.error('[twilio] falha ao responder:', err));
  });

  return router;
}
