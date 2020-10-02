# ember-launch-darkly
[![Build Status](https://travis-ci.org/adopted-ember-addons/ember-launch-darkly.svg?branch=master)](https://travis-ci.org/adopted-ember-addons/ember-launch-darkly)

This addon wraps the [Launch Darkly](https://launchdarkly.com/) feature flagging service and provides helpers to implement feature flagging in your application

## Installation

```bash
$ ember install ember-launch-darkly
```

## Configuration

ember-launch-darkly can be configured from `config/environment.js` as follows:

```js
module.exports = function(environment) {
  let ENV = {
    launchDarkly: {
      // options
    }
  };

  return ENV
};
```

ember-launch-darkly supports the following configuration options:

### `clientSideId` (required)

The client side ID generated by Launch Darkly which is available in your [account settings page](https://app.launchdarkly.com/settings#/projects). See the Launch Darkly docs for [more information on how the client side ID is used](https://docs.launchdarkly.com/docs/js-sdk-reference#section-initializing-the-client).

### `local`

Specify that you'd like to pull feature flags from your local config instead of remotely from Launch Darkly. This is likely appropriate when running in the `development` environment or an external environment for which you don't have Launch Darkly set up.

This option will also make the launch darkly service available in the browser console so that feature flags can be enabled/disabled manually.

_Default_: `false` in production, `true` in all other environments

### `localFeatureFlags`

A list of initial values for your feature flags. This property is only used when `local: true` to populate the list of feature flags for environments such as local development where it's not desired to store the flags in Launch Darkly.

_Default_: `null`

### `streaming`

Streaming options for the feature flags for which you'd like to subscribe to realtime updates. See the [Streaming Feature Flags section](#streaming-feature-flags) for more detailed info on what the possible options are for streaming flags.

_Default_: `false`

## Content Security Policy

If you have CSP enabled in your ember application, you will need to add Launch Darkly to the `connect-src` like so:

```js
// config/environment.js

module.exports = function(environment) {
  let ENV = {
    //snip

    contentSecurityPolicy: {
      'connect-src': ['https://*.launchdarkly.com']
    }

    //snip
  };
};
```

## Usage

### Launch Darkly Service

ember-launch-darkly automatically injects the launch darkly service, as `launchDarkly` in to the following Ember objects:

- all `route`s
- all `controller`s
- all `component`s
- `router:main`

This means that it can be accessed without an explicit injection, like so:

```js
// /app/application/route.js

import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    let user = {
      key: 'aa0ceb',
      anonymous: true
    };

    return this.launchDarkly.initialize(user);
  }
});
```

Due to Ember not allowing auto injection of a service in to another service, we are currently unable to auto inject `launchDarkly` in to other services. This means that if you would like to check for Launch Darkly flags in your service, you will need to explicitly inject the `launchDarkly` service yourself.

### Initialize

Before being used, Launch Darkly must be initialized. This should happen early so choose an appropriate place to make the call such as an application initializer or the application route.

The `initialize()` function returns a promise that resolves when the Launch Darkly client is ready so Ember will wait until this happens before proceeding.

The user `key` is the only required attribute. 

See the [Launch Darkly User documentation](https://docs.launchdarkly.com/sdk/client-side/javascript#users) for the other attributes you can provide.

```js
// /app/application/route.js

import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    let user = {
      key: 'aa0ceb'
    };

    return this.launchDarkly.initialize(user);
  }
});
```

If you set the `anonymous` flag to true, then the key is not required.

See the [Launch Darkly Anonymous User documentation](https://docs.launchdarkly.com/sdk/client-side/javascript#users) for more on the `anonymous` flag.

```js
// /app/application/route.js

import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    let user = {
      anonymous: true
    };

    return this.launchDarkly.initialize(user);
  }
});
```

### Identify

If you initialized Launch Darkly with an anonymous user and want to re-initialize it for a specific user to receive the flags for that user, you can use `identify`. This can only be called after `initialize` has been called.

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
      email: session.get('user.email')
    };

    return this.launchDarkly.identify(user);
  }
});
```

### Templates

ember-launch-darkly provides a `variation` helper to check your feature flags in your handlebars templates.

If your feature flag is a boolean based flag, you might use it in an `{{if}}` like so:

```hbs
{{#if (variation "new-login-screen")}}
  {{login-screen}}
{{else}}
  {{old-login-screen}}
{{/if}}
```

If your feature flag is a multivariate based flag, you might use it in an `{{with}}` like so:

```hbs
{{#with (variation "new-login-screen") as |variant|}}
  {{#if (eq variant "login-screen-a")}
    {{login-screen-a}}
  {{else if (eq variant "login-screen-b")}}
    {{login-screen-b}}
  {{/if}}
{{else}}
  {{login-screen}}
{{/with}}
```

### Javascript

If your feature flag is a boolean based flag, you might use it in a function like so:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  actions: {
    getPrice() {
      if (this.launchDarkly.variation('new-price-plan')) {
        return 99.00;
      }

      return 199.00;
    },
  }
});
```

If your feature flag is a multivariate based flag, you might use it in a function like so:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  actions: {
    getPrice() {
      switch (this.launchDarkly.variation('new-pricing-plan')) {
        case 'plan-a':
          return 99.00;
        case 'plan-b':
          return 89.00
        case 'plan-c':
          return 79.00
      }

      return 199.00;
    }
  }
});
```

And if you want to check a flag in a computed property, and have it recompute when the flag changes, you'll want to make sure you add the flag as a dependent key to the CP, as follows:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  price: computed('launchDarkly.new-price-plan', function() {
    if (this.launchDarkly['new-price-plan']) {
      return 99.00;
    }

    return 199.00;
  })
});
```

### [EXPERIMENTAL] `variation` Javascript helper

ember-launch-darkly provides a special, _experimental_, `variation` import that can be used in Javascript files such as Components, to make the invocation and checking of feature flags a little nicer in the JS code.

This helper is backed by a Babel transform that essentially replaces the helper with the code above in the [Javascript](#javascript) section. The main benefits this helper provides is:

- Automatically adds feature flags as dependent keys to computed properties so they are recalculated when flags change
- Removes boiler plate launch darkly code (injection of service, referencing service in functions, etc)
- Provide a syntax that is parallel to the `variation` helper used in templates

The babel transform that replaces this `variation` helper in the JS code is experimental. YMMV.

If you would like to try it out, simply enable it in your `ember-cli-build.js` as follows:

```js
// ember-cli-build.js

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    babel: {
      plugins: [ require.resolve('ember-launch-darkly/babel-plugin') ]
    }
  });

  return app.toTree();
};
```

Then import the helper from `ember-launch-darkly` and use it as follows:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';

import { variation } from 'ember-launch-darkly';

export default Component.extend({
  price() {
    if (variation('new-pricing-plan')) {
      return 99.00;
    }

    return 199.00;
  }
});
```

If you would like the feature flag to recompute a computed property when it
changes, you will need to also use the `computedWithVariation` import, like so:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';
import { variation, computedWithVariation as computed } from 'ember-launch-darkly';

export default Component.extend({
  price: computed(function() {
    if (variation('new-pricing-plan')) {
      return 99.00;
    }

    return 199.00;
  })
});
```

The `computedWithvariation` import is literally a direct re-export of the `@ember/object` computed. We need to re-export it so that we can signal to the babel transform where to auto insert the feature flag dependent keys. Because `computedWithVariation` is a re-export you can alias it as `computed` (like above) and use it anywhere you would use a normal `computed`.

For reference, the babel transform should transform the above code in to, _roughly_, the following:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  price: computed('launchDarkly.new-pricing-plan', function() {
    if (this.launchDarkly['new-pricing-plan']) {
      return 99.00;
    }

    return 199.00;
  })
});
```

It's important to note that the `variation` helper will only work when used
inside objects that have an `owner`. This is because the helper is transformed
in to a call to `this.launchDarkly` which is an injected service. Therefore, the
`variation` helper will not work in a computed returned from, say, a function.
Like so:

```js
export default function myCoolFn() {
  if (variation('foo')) {
    return 'I love cheese';
  }

  return 'I love bacon';
}
```

For the reason above, if you would like to use the variation helper in one of your own objects that
extends `EmberObject`, you will need to create the `EmberObject` instance with
an owner injection, like so:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';
import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';

const MyFoo = EmberObject.extend({
  price() {
    return variation('my-price');
  }
});

export default Component.extend({
  createFoo() {
    let owner = getOwner(this);

    return MyFoo.create(owner.ownerInjection(), {
      someProp: 'bar'
    });
  }
});

```

As this babel transform is experimental, it does not currently support the
following:

- Native classes
- Decorators

We will endeavour to add support for these things in the future.

## Local feature flags

When `local: true` is set in the Launch Darkly configuration, ember-launch-darkly will retrieve the feature flags and their values from `config/environment.js` instead of the Launch Darkly service. This is useful for development purposes so you don't need to set up a new environment in Launch Darkly, your app doesn't need to make a request for the flags, and you can easily change the value of the flags from the browser console.

The local feature flags are defined in `config/environment.js` like so:

```js
let ENV = {
  launchDarkly: {
    local: true,
    localFeatureFlags: {
      'apply-discount': true,
      'new-pricing-plan': 'plan-a'
    }
  }
}
```

When `local: true`, the Launch Darkly feature service is available in the browser console via `window.ld`. The service provides the following helper methods to manipulate feature flags:

```js
> ld.variation('new-pricing-plan', 'plan-a') // return the current value of the feature flag providing a default if it doesn't exist

> ld.setVariation('new-pricing-plan', 'plan-x') // set the variation value

> ld.enable('apply-discount') // helper to set the return value to `true`
> ld.disable('apply-discount') // helper to set the return value to `false`

> ld.allFlags() // return the current list of feature flags and their values

> ld.user() // return the user that the client has been initialized with
```

## Streaming Feature Flags

Launch Darkly supports the ability to subscribe to changes to feature flags so that apps can react in real-time to these changes. The [`streaming` configuration option](#streaming) allows you to specify, in a couple of ways, which flags you'd like to stream.

To disable streaming completely, use the following configuration:

```js
launchDarkly: {
  streaming: false
}
```

_Note, this is the default behaviour if the `streaming` option is not specified._

To stream all flags, use the following configuration:

```js
launchDarkly: {
  streaming: true
}
```

To get more specific, you can select to stream all flags except those specified:

```js
launchDarkly: {
  streaming: {
    allExcept: ['apply-discount', 'new-login']
  }
}
```

And, finally, you can specify only which flags you would like to stream:

```js
launchDarkly: {
  streaming: {
    'apply-discount': true
  }
}
```

As Launch Darkly's realtime updates to flags uses the [Event Source API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource), certain browsers will require a polyfill to be included. ember-launch-darkly uses [EmberCLI targets](http://rwjblue.com/2017/04/21/ember-cli-targets/) to automatically decide whether or not to include the polyfill. Ensure your project contains a valid `config/targets.js` file if you require this functionality.

## Test Helpers

### Acceptance Tests

Add the `setupLaunchDarkly` hook to the top of your test file. This will ensure that Launch Darkly uses a test stub client which defaults your feature flags to
`false` instead of using what is defined in the `localFeatureFlags` config.  This allows your tests to start off in a known default state.

```js
import { module, test } from 'qunit';
import { visit, currentURL, click } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

import { setupLaunchDarkly } from 'ember-launch-darkly/test-support';

module('Acceptance | Homepage', function(hooks) {
  setupApplicationTest(hooks);
  setupLaunchDarkly(hooks);

  test('links go to the new homepage', async function(assert) {
    await visit('/');
    await click('a.pricing');

    assert.equal(currentRoute(), 'pricing', 'Should be on the old pricing page');
  });
});
```

ember-launch-darkly provides a test helper, `withVariation`, to make it easy to turn feature flags on and off in acceptance tests.

```js
module('Acceptance | Homepage', function(hooks) {
  setupApplicationTest(hooks);
  setupLaunchDarkly(hooks);

  test('links go to the new homepage', async function(assert) {
    this.withVariation('new-pricing-plan', 'plan-a');

    await visit('/');
    await click('a.pricing');

    assert.equal(currentRoute(), 'pricing', 'Should be on the old pricing page');
  });
});
```

### Integration Tests

Use the `setupLaunchDarkly` hook and `withVariation` helper in component tests to control feature flags as well.

```js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import { setupLaunchDarkly } from 'ember-launch-darkly/test-support';

module('Integration | Component | foo', function(hooks) {
  setupRenderingTest(hooks);
  setupLaunchDarkly(hooks);

  test('new pricing', async function(assert) {
    await render(hbs`
      {{#if (variation "new-pricing-page")}}
        <h1 class="price">£ 99</h1>
      {{else}}
        <h1 class="price">£ 199</h1>
      {{/if}}
    `);

    this.withVariation('new-pricing-page');

    assert.equal(this.element.querySelector('.price').textContent.trim(), '£ 99', 'New pricing displayed');
  });
});
```

## TODO

- Implement support for `secure` mode ([#9](https://github.com/ember-launch-darkly/ember-launch-darkly/issues/9))

<p align="center"><sub>Made with :heart: by The Ember Launch Darkly Team</sub></p>
