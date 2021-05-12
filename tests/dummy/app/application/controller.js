import Controller from '@ember/controller';

import { getCurrentContext } from 'ember-launch-darkly/-sdk/context';

export default class ApplicationController extends Controller {
  get allFlags() {
    let context = getCurrentContext();

    return context.allFlags;
  }
}
