import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import { join } from '@ember/runloop';
import { buildWaiter } from 'ember-test-waiters';

let recomputeWaiter = buildWaiter('recompute-waiter');

export default Helper.extend({
  launchDarkly: service(),

  recompute() {
    let token = recomputeWaiter.beginAsync();

    this._super();

    join(() => recomputeWaiter.endAsync(token));
  },

  compute([key]) {
    let service = this.launchDarkly;

    if (!this._key) {
      this._key = key;
      // eslint-disable-next-line ember/no-observers
      service.addObserver(key, this, 'recompute');
    }

    return service.get(key);
  },

  destroy() {
    let service = this.launchDarkly;

    if (this._key) {
      service.removeObserver(this._key, this, 'recompute');
    }

    return this._super();
  }
});
