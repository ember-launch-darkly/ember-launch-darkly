import { settled } from '@ember/test-helpers';

import {
  default as Context,
  getCurrentContext,
  setCurrentContext,
  removeCurrentContext
} from 'ember-launch-darkly/-sdk/context';

export default function setupLaunchDarkly(hooks) {
  hooks.beforeEach(function() {
    if (!this.owner) {
      throw new Error(
        'You must call one of the ember-qunit setupTest(), setupRenderingTest() or setupApplicationTest() methods before calling setupLaunchDarkly()'
      );
    }

    let config = this.owner.resolveRegistration('config:environment');
    let { localFlags } = {
      localFlags: {},
      ...config.launchDarkly
    };

    localFlags = Object.keys(localFlags).reduce((acc, key) => {
      acc[key] = false;

      return acc;
    }, {});

    let context = new Context(localFlags);

    setCurrentContext(context);

    this.withVariation = (key, value = true) => {
      let context = getCurrentContext();

      context.set(key, value);

      return settled();
    };
  });

  hooks.afterEach(function() {
    delete this.withVariation;
    removeCurrentContext();
  });
}
