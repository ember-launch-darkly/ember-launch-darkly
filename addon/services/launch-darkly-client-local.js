import Service from '@ember/service';
import { getOwner } from '@ember/application';
import Evented from '@ember/object/evented';

import RSVP from 'rsvp';

export default Service.extend(Evented, {
  _allFlags: null,
  _user: null,

  init() {
    this._super(...arguments);

    let { localFeatureFlags } = this._config();
    localFeatureFlags = localFeatureFlags || {}

    this._allFlags = localFeatureFlags;
  },

  initialize(user) {
    return this.identify(user);
  },

  identify(user) {
    this._user = user;
    return RSVP.resolve();
  },

  allFlags() {
    return { ...this._allFlags };
  },

  variation(key, defaultValue = false) {
    if (Object.prototype.hasOwnProperty.call(this._allFlags, key)) {
      return this._allFlags[key];
    }

    return defaultValue;
  },

  enable(key) {
    this.setVariation(key, true);
  },

  disable(key) {
    this.setVariation(key, false);
  },

  setVariation(key, value) {
    this._allFlags[key] = value;
    this.trigger(key);
  },

  user() {
    return this._user;
  },

  _config() {
    let appConfig = getOwner(this).resolveRegistration('config:environment');
    let config = appConfig.launchDarkly || {};

    return { ...config };
  }
});
