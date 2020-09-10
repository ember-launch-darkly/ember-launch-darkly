import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  launchDarkly: service(),

  model() {
    return {
      key: '1',
      anonymous: false,
      email: 'dave@foos.com',
      custom: {
        fullName: 'Dave Grohl'
      }
    };
  },

  afterModel(user) {
    return this.launchDarkly.identify(user);
  }
});
