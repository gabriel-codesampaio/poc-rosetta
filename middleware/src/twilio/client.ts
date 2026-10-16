/**
 * Cliente mínimo da API REST do Twilio (sem SDK): o necessário para a POC.
 * - Content API: cria Content Templates de quick reply e list picker.
 * - Messages API: envia texto, mídia ou um ContentSid.
 */
export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
}

export interface SendParams {
  to: string;
  from: string;
  body?: string;
  mediaUrl?: string;
  contentSid?: string;
}

export interface TwilioClient {
  createContent(friendlyName: string, types: Record<string, unknown>): Promise<string>;
  sendMessage(params: SendParams): Promise<string>;
}

export function createTwilioClient({ accountSid, authToken }: TwilioCredentials): TwilioClient {
  const auth = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

  async function call(url: string, init: RequestInit): Promise<{ sid: string }> {
    const res = await fetch(url, { ...init, headers: { authorization: auth, ...init.headers } });
    const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    if (!res.ok || !json.sid) {
      throw new Error(`Twilio ${res.status}${json.code ? ` (${json.code})` : ''}: ${json.message ?? 'erro desconhecido'}`);
    }
    return { sid: json.sid };
  }

  return {
    async createContent(friendlyName, types) {
      const { sid } = await call('https://content.twilio.com/v1/Content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ friendly_name: friendlyName, language: 'pt_BR', types }),
      });
      return sid;
    },

    async sendMessage({ to, from, body, mediaUrl, contentSid }) {
      const form = new URLSearchParams({ To: to, From: from });
      if (contentSid) form.set('ContentSid', contentSid);
      else if (body) form.set('Body', body);
      if (mediaUrl) form.set('MediaUrl', mediaUrl);
      const { sid } = await call(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form,
      });
      return sid;
    },
  };
}
