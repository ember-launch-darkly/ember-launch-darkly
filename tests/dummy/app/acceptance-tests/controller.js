import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { variation, computedWithVariation as computed } from 'ember-launch-darkly';

export default class AcceptanceTests extends Controller {
  @service launchDarkly;
  @service launchDarklyClient;

  @computed
  get singleVariationComputed () {
    return variation('foobar');
  }

  @computed
  multipleVariationComputed () {
    if (variation('boobaz')) {
      //Do something here
    }

    return variation('foobar');
  }

  @action
  toggleVariation(flag) {
    let currentValue = this.launchDarkly.variation(flag);
    this.launchDarklyClient.setVariation(flag, !currentValue);
  }

}
