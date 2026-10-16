/** Dados fictícios da POC. */

export const BALANCE = 12400;

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  points: number;
  image: string;
}

const img = (seed: string) => `https://picsum.photos/seed/${seed}/640/400`;

export const OFFERS: Offer[] = [
  {
    id: 'offer_rio',
    title: 'Voo São Paulo → Rio',
    subtitle: 'Ida e volta, classe econômica',
    points: 8500,
    image: img('poc-rio'),
  },
  {
    id: 'offer_fone',
    title: 'Fone Bluetooth',
    subtitle: 'Cancelamento de ruído, entrega em 5 dias',
    points: 6200,
    image: img('poc-fone'),
  },
  {
    id: 'offer_hotel',
    title: 'Diária em hotel',
    subtitle: 'Rede parceira, 1 noite para 2 pessoas',
    points: 11900,
    image: img('poc-hotel'),
  },
];

/** Ofertas extras usadas só no cenário de teste de limites. */
export const EXTRA_OFFERS: Offer[] = [
  { id: 'offer_lis', title: 'Voo São Paulo → Lisboa', subtitle: 'Só ida, classe econômica', points: 45000, image: img('poc-lisboa') },
  { id: 'offer_cafe', title: 'Cafeteira expresso', subtitle: 'Entrega em 7 dias', points: 9800, image: img('poc-cafe') },
];

export const BANNER = img('poc-saldo');
