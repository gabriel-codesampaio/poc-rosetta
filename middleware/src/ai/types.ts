import type { NormalizedEvent } from '../events/normalize';

/**
 * A IA de negócio (pontos, ofertas, resgates). Ela devolve `unknown` de propósito:
 * o middleware trata a saída como externa e valida contra o contrato antes de adaptar.
 */
export interface BusinessAi {
  readonly name: string;
  respond(event: NormalizedEvent, ctx: { sessionId: string }): Promise<unknown>;
}
