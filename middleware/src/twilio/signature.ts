import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Valida o header X-Twilio-Signature: HMAC-SHA1 (auth token) da URL pública do webhook
 * seguida dos parâmetros POST ordenados por nome (chave + valor), em base64.
 */
export function isValidTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string | undefined,
): boolean {
  if (!signature) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac('sha1', authToken).update(data, 'utf8').digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
