import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { assert, warn } from '@ember/debug';
import { run } from '@ember/runloop';
import Evented from '@ember/object/evented';
import { initialize } from 'launchdarkly-js-client-sdk';

import RSVP from 'rsvp';

import NullClient from 'ember-launch-darkly/lib/null-client';

export default Service.extend(Evented, {
  _client: null,

  init() {
    this._super(...arguments);
  },

  initialize(user = {}, options = {}) {
    let { clientSideId, streaming = false } = this._config();

    if (!clientSideId) {
      clientSideId = options.clientSideId; // let this be deferred, maybe an API provided it
      delete options.clientSideId;
    }

    if (!clientSideId) {
      warn('ENV.launchDarkly.clientSideId not specified or provided via user hash. Defaulting all feature flags to "false"', false, { id: 'ember-launch-darkly.client-id-not-specified' });

      this.set('_client', NullClient);

      return RSVP.resolve();
    }
    
    if (!user.anonymous) {
      assert('user.key must be specified in initilize payload if not anonymous ', user.key );

      if (!user.key) {
        warn('user.key not specified in initialize payload. Defaulting all feature flags to "false"', false, { id: 'ember-launch-darkly.user-key-not-specified' });

        this.set('_client', NullClient);

        return RSVP.resolve();
      }
    }

    return this._initialize(clientSideId, user, streaming, options);
  },

  identify(user) {
    return this._identify(user);
  },

  allFlags() {
    return this.get('_client').allFlags();
  },

  variation(key, defaultValue) {
    return this.get('_client').variation(key, defaultValue);
  },

  _config() {
    let appConfig = getOwner(this).resolveRegistration('config:environment');

    return appConfig.launchDarkly || {};
  },

  _initialize(id, user, streamingOptions, options = {}) {
    return new RSVP.Promise((resolve, reject) => {

      let client = initialize(id, user, options);

      client.on('ready', () => {
        this.set('_client', client);
        run(null, resolve);
      });

      client.on('change', settings => {
        Object.keys(settings).forEach(key => {
          if (this._shouldTriggerEvent(key, streamingOptions)) {
            this.trigger(key);
          }
        });
      });

      run.later(this, () => {
        if (!this.get('_client')) {
          run(null, reject);
        }
      }, 10000);
    })
  },

  _identify(user) {
    return new RSVP.Promise(resolve => {
      this.get('_client').identify(user, null, resolve);
    })
  },

  _shouldTriggerEvent(key, streamingOptions) {
    if (streamingOptions === true) {
      return true;
    }

    if (typeof streamingOptions === 'object') {
      if (streamingOptions.allExcept && Array.isArray(streamingOptions.allExcept)) {
        return streamingOptions.allExcept.indexOf(key) === -1;
      }

      return streamingOptions[key];
    }

    return false;
  }
});
