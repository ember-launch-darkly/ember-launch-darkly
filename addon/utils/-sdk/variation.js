import { getCurrentContext } from './context';

export function variation(key) {
  let context = getCurrentContext();

  if (!context.isLocal) {
    context.client.variation(key);
  }

  return context.get(key);
}
