'use strict';

/* eslint-disable node/no-unpublished-require */

const path = require('path');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const browserslist = require('browserslist');

const EVENT_SOURCE_NON_SUPPORTED_BROWSERS = [
  'Chrome < 6',
  'Edge > 0',
  'Firefox < 6.0',
  'ie > 0',
  'Safari < 5'
];

module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  included() {
    this._super.included.apply(this, arguments);

    if (this._shouldIncludePolyfill()) {
      this.import('vendor/eventsource.js');
    }
  },

  treeForVendor(vendorTree) {
    let trees = vendorTree ? [vendorTree] : [];

    if (this._shouldIncludePolyfill()) {
      trees.push(this._eventSourceTree());
    }

    return new MergeTrees(trees);
  },

  _eventSourceTree() {
    return new Funnel(
      path.dirname(require.resolve('event-source-polyfill/src/eventsource.js')),
      {
        files: ['eventsource.js']
      }
    );
  },

  _shouldIncludePolyfill() {
    if (this.project.targets && this.project.targets.browsers) {
      let browsers = browserslist(this.project.targets.browsers);
      let prohibitedBrowsers = browserslist(
        EVENT_SOURCE_NON_SUPPORTED_BROWSERS
      );

      return prohibitedBrowsers.filter(version => browsers.includes(version))
        .length;
    }

    return false;
  }
};
