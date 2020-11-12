import { helper } from '@ember/component/helper';
import { variation } from 'ember-launch-darkly';

function variationHelper([key]) {
  return variation(key);
}

export default helper(variationHelper);
