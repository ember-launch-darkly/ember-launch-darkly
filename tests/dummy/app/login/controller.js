import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computedWithVariation as computed } from 'ember-launch-darkly';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  launchDarkly: service(),

  // BEGIN-SNIPPET as-cp-dependent-key
  price: computed('launchDarkly.apply-discount', function() {
    if (this.launchDarkly.variation['apply-discount']) {
      return '99';
    }

    return '199';
  }),
  // END-SNIPPET

  // BEGIN-SNIPPET as-variation-call
  anotherPrice: computed(function() {
    if (this.launchDarkly.variation('apply-discount')) {
      return '99';
    }

    return '199';
  }),
  // END-SNIPPET

  // BEGIN-SNIPPET as-cp-alias
  shouldApplyDiscount: computed.alias('launchDarkly.apply-discount'),

  yetAnotherPrice: computed('shouldApplyDiscount', function() {
    if (this.shouldApplyDiscount) {
      return '99';
    }

    return '199';
  }),
  // END-SNIPPET

  // BEGIN-SNIPPET as-js-variation-helper
  foo: computed(function () {
    if (variation('apply-discount')) {
      return '99';
    }

    return '199';
  })
  // END-SNIPPET
});
