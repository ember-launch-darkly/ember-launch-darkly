import { getCurrentContext } from './context';

export function variation(key, defaultValue = null) {
  let context = getCurrentContext();

  if (!context.isLocal) {
    context.client.variation(key);
  }

  return context.get(key, defaultValue);
}
