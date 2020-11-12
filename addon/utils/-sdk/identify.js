import { getCurrentContext } from './context';

export async function identify(user, hash = null) {
  let context = getCurrentContext();

  let flags = await context.client.identify(user, hash);

  context.updateFlags(flags);
}
