import Route from '@ember/routing/route';

import { identify } from 'ember-launch-darkly';

export default class IdentifiedUserRoute extends Route {
  async beforeModel() {
    let user = {
      key: '666',
      email: 'joe@example.com',
      custom: {
        fullName: 'Joe Bloggs'
      }
    };

    await identify(user);
  }
}
