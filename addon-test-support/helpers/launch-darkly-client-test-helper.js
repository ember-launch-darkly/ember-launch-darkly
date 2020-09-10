import LocalClient from 'ember-launch-darkly/services/launch-darkly-client-local';

export default LocalClient.extend({
  variation(key) {
    return this._super(key, false);
  },

  _config() {
    return {};
  }
});
