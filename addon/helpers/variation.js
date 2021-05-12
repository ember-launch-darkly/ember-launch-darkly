import { helper } from '@ember/component/helper';
import { variation } from 'ember-launch-darkly/-sdk/variation';

function variationHelper([key], { defaultValue = null }) {
  return variation(key, defaultValue);
}

export default helper(variationHelper);
