import Route from '@ember/routing/route';

import { initialize } from 'ember-launch-darkly';

import config from 'dummy/config/environment';

export default class ApplicationRoute extends Route {
  async beforeModel() {
    let { clientSideId, ...options } = config.launchDarkly;

    let user = {
      anonymous: true
    };

    await initialize(clientSideId, user, options);
  }
}
