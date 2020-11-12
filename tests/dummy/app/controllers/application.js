import Controller from '@ember/controller';

import { variation } from 'ember-launch-darkly';

export default class ApplicationController extends Controller {
  get example() {
    let val = variation('foo');
    let message = `application controller, JS getter:`;

    console.log(message, val);

    return `${message} ${val}`;
  }
}
