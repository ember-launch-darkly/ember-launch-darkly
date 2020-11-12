# Upgrading to 1.x

## Overview

The approach taken in [v2.0](https://github.com/adopted-ember-addons/ember-launch-darkly/releases/tag/v2.0.0) of this addon has changed drastically from versions [<= v1.0](https://github.com/adopted-ember-addons/ember-launch-darkly/releases/tag/v1.0.0)
and will require some modifications to config and code in order to upgrade. The steps below outline the things you will need to change in order to upgrade to [v2.0](https://github.com/adopted-ember-addons/ember-launch-darkly/releases/tag/v2.0.0).

## Migrate config

Mirgate config from this:

```js
// config/environment.js

module.exports = function (environment) {
  let ENV = {
    launchDarkly: {
      clientSideId: '1234',
      local: true,
      localFeatureFlags: {
        foo: true,
      },
      streaming: {
        foo: true,
      },
    },
  };
};
```

to this:

```js
module.exports = function (environment) {
  let ENV = {
    launchDarkly: {
      clientSideId: '1234',
      mode: 'local',
      localFlags: {
        foo: true,
      },
      streamingFlags: {
        foo: true,
      },
    },
  };
};
```

## Migrate `this.launchDarkly.initialize`

Ember Launch Darkly no longer uses services and so the initialization should change from this:

```js
// /app/application/route.js

import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    let user = {
      key: 'aa0ceb',
      anonymous: true,
    };

    return this.launchDarkly.initialize(user);
  },
});
```

to this:

```js
// /app/application/route.js

import Route from '@ember/routing/route';

import { initialize } from 'ember-launch-darkly';

export default class ApplicationRoute extends Route {
  async model() {
    let user = {
      key: 'aa0ceb',
    };

    return await initialize(user);
  }
}
```

## Migrate `this.launchDarkly.identify`

Ember Launch Darkly no longer uses services and so the identification should change from this:

```js
// /app/session/route.js

import Route from '@ember/routing/route';

export default Route.extend({
  session: service(),

  model() {
    return this.session.getSession();
  },

  afterModel(session) {
    let user = {
      key: session.get('user.id'),
      firstName: session.get('user.firstName'),
      email: session.get('user.email'),
    };

    return this.launchDarkly.identify(user);
  },
});
```

to this:

```js
// /app/session/route.js

import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import { identify } from 'ember-launch-darkly';

export default class SessionRoute extends Route {
  @service session;

  model() {
    return this.session.getSession();
  },

  async afterModel(session) {
    let user = {
      key: session.user.id,
      firstName: session.user.firstName,
      email: session.user.email
    };

    return await identify(user);
  }
}
```

## Migrate `this.launchDarkly.variation`

Ember Launch Darkly no longer uses services and so checking of variations should change from this:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  actions: {
    getPrice() {
      if (this.launchDarkly.variation('new-price-plan')) {
        return 99.0;
      }

      return 199.0;
    },
  },
});
```

to this:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';

import { variation } from 'ember-launch-darkly';

export default class LoginPageComponent extends Component {
  get price() {
    if (variation('new-price-plan')) {
      return 99.0;
    }

    return 199.0;
  }
}
```

## A note on the experimental `variation` Javascript helper

Versions of this addon pre `v2.0` included [an experimental Babel transform that allowed users to import a `variation` function](https://github.com/adopted-ember-addons/ember-launch-darkly/tree/v0.7.0#javascript) in to Javascript instead of
referencing `this.launchDarkly.variation`. It was more than a shorthand for the variation function - it also tried to be a bit clever and, when used inside
a computed property, attempted to add the feature flags as dependent keys of the computed property so as to ensure the computed property was re-computed if
the flag changed.

While this helper was useful, it was infinitely problematic. Thankfully, in an Ember Octane world, or more specifically, an `@tracked` world, this is totally unnecessary.
Any code that checks for feature flags will re-computed if they change based on the fact that the flags our now tracked in v2.0.

Because the import of the `variation` function in v2.0 is the same as the import of the old babel transform helper, no changes should need to be made here.

However, if you are using [v1.0.0](https://github.com/adopted-ember-addons/ember-launch-darkly/releases/tag/v1.0.0) specifically there are likely a
couple of changes you will need to make.

No doubt you will have stopped using the `computedWithVariation` helper ([DOC](https://github.com/adopted-ember-addons/ember-launch-darkly/tree/v1.0.0#experimental-variation-javascript-helper)) as you won't be using computed properties in Octane any more and it doesn't work with
the `@computed` decorator.

However, you should also remove the code in your `ember-cli-build.js` that enables the Babel transform. So, remove this:

```js
// ember-cli-build.js

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    babel: {
      plugins: [require.resolve('ember-launch-darkly/babel-plugin')], // <---- Remove this plugin.
    },
  });

  return app.toTree();
};
```

## Accessing local feature flags from the JS console

If you want to access and modify local feature flags from the JS console you will need to change from doing this:

```js
ld.variation('new-pricing-plan', 'plan-a'); // return the current value of the feature flag providing a default if it doesn't exist
ld.setVariation('new-pricing-plan', 'plan-x'); // set the variation value
ld.enable('apply-discount'); // helper to set the return value to `true`
ld.disable('apply-discount'); // helper to set the return value to `false`
ld.allFlags(); // return the current list of feature flags and their values
ld.user();
```

to this:

```js
> window.__LD__.get('new-pricing-plan', 'plan-a') // return the current value of the feature flag providing a default ('plan-a' if it doesn't exist (the default is optional)
> window.__LD__.set('new-pricing-plan', 'plan-x') // set the variation value
> window.__LD__.enable('apply-discount') // helper to set the return value to `true`
> window.__LD__.disable('apply-discount') // helper to set the return value to `false`
> window.__LD__.allFlags // return the current list of feature flags and their values
> window.__LD__.user // return the user that the client has been initialized with
```
