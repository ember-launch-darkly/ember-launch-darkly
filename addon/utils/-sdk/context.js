import { isNone } from '@ember/utils';
import { TrackedMap } from 'tracked-maps-and-sets';

export function setCurrentContext(context) {
  window.__LD__ = context;
}

export function getCurrentContext() {
  let context = window.__LD__;

  if (!context) {
    throw new Error(
      'Launch Darkly has not been initialized. Ensure that you run the `initialize` function before `varitaion`.'
    );
  }

  return context;
}

export function removeCurrentContext() {
  delete window.__LD__;
}

export default class Context {
  _flags = new TrackedMap();
  _client = null;

  constructor(flags = {}, client) {
    this._client = client;

    this.updateFlags(flags);
  }

  updateFlags(flags) {
    for (let [key, value] of Object.entries(flags)) {
      this._flags.set(key, value);
    }
  }

  enable(key) {
    this._flags.set(key, true);
  }

  disable(key) {
    this._flags.set(key, false);
  }

  set(key, value) {
    this._flags.set(key, value);
  }

  get(key, defaultValue) {
    if (!this._flags.has(key) && !isNone(defaultValue)) {
      return defaultValue;
    }

    return this._flags.get(key);
  }

  get allFlags() {
    let allFlags = {};

    for (let [key, value] of this._flags.entries()) {
      allFlags[key] = value;
    }

    return allFlags;
  }

  get isLocal() {
    return isNone(this.client);
  }

  get client() {
    return this._client;
  }

  get user() {
    if (this.isLocal) {
      return { key: 'local-mode-no-user-specified' };
    }

    return this.client.getUser();
  }
}
