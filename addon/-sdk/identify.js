import { getCurrentContext } from './context';

export async function identify(user, hash = null) {
  let context = getCurrentContext();

  if (!context.isLocal) {
    let flags = await context.client.identify(user, hash);

    context.replaceFlags(flags);
  }
}
