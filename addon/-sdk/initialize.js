import { isNone, typeOf } from '@ember/utils';
import { warn } from '@ember/debug';

import * as LDClient from 'launchdarkly-js-client-sdk';

import Context, { getCurrentContext, setCurrentContext } from './context';

export function shouldUpdateFlag(key, streamingConfig) {
  if (streamingConfig === true) {
    return true;
  }

  if (typeOf(streamingConfig) === 'object') {
    if (!isNone(streamingConfig.allExcept)) {
      if (typeOf(streamingConfig.allExcept) === 'array') {
        return !streamingConfig.allExcept.includes(key);
      }

      return false;
    }

    if (typeOf(streamingConfig[key]) === 'boolean') {
      return streamingConfig[key];
    }
  }

  return false;
}

export async function initialize(clientSideId, user = {}, options = {}) {
  try {
    if (getCurrentContext()) {
      return;
    }
  } catch (_) {
    // `initialize` has not been run yet and so the current context doesn't
    // exist. Let's go ahead and create one.
  }

  let {
    streamingFlags = false,
    localFlags = {},
    mode = 'local',
    ...rest
  } = options;

  if (!['local', 'remote'].includes(mode)) {
    warn(
      `"config.mode" must be set to either "local" or "remote". Defaulting to "local". (Invalid value: "${mode}")`,
      false,
      { id: 'ember-launch-darkly.invalid-config-property.mode' }
    );

    mode = 'local';
  }

  if (mode === 'local') {
    let context = new Context(localFlags);
    setCurrentContext(context);

    return;
  }

  options = {
    sendEventsOnlyForVariation: true,
    ...rest
  };

  if (options.bootstrap === 'localFlags' && !isNone(localFlags)) {
    options.bootstrap = localFlags;
  }

  let client = LDClient.initialize(clientSideId, user, options);

  await client.waitForInitialization();

  client.on('change', updates => {
    let context = getCurrentContext();
    let flagsToUpdate = {};
    for (let [key, { current }] of Object.entries(updates)) {
      if (shouldUpdateFlag(key, streamingFlags)) {
        flagsToUpdate[key] = current;
      }
    }

    context.updateFlags(flagsToUpdate);
  });

  let flags = client.allFlags();

  let context = new Context(flags, client);

  setCurrentContext(context);
}
