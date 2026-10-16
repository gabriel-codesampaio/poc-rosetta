import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * URL do middleware. Ordem: EXPO_PUBLIC_API_URL → IP da máquina que roda o Expo (dev) → localhost.
 * No celular físico, "localhost" é o próprio celular; por isso usamos o host do dev server.
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && Platform.OS !== 'web') return `http://${host}:3333`;
  return 'http://localhost:3333';
}

export const API_URL = resolveApiUrl();
