import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  launchDarkly: service(),

  beforeModel() {
    const user = {
      key: 'aa0ceb',
      anonymous: true
    };

    return this.launchDarkly.initialize(user);
  }
});
