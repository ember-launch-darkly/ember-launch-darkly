# Ember Launch Darkly

[![Build Status](https://travis-ci.org/adopted-ember-addons/ember-launch-darkly.svg?branch=master)](https://travis-ci.org/adopted-ember-addons/ember-launch-darkly)

This addon wraps the [Launch Darkly](https://launchdarkly.com/) feature flagging service and provides helpers to implement feature flagging in your application

<hr/>

_**Warning**: This version of the addon is built of Ember Octane (>= v3.15) and beyond. It contains breaking changes from the previous releases. If you would like to migrate from a previous version to this one, please following the instructions in the [MIGRATING.md](MIGRATING.md) file._

<hr/>

## Installation

```bash
$ ember install ember-launch-darkly
```

## Configuration

ember-launch-darkly can be configured from `config/environment.js` as follows:

```js
module.exports = function (environment) {
  let ENV = {
    launchDarkly: {
      // options
    },
  };

  return ENV;
};
```

ember-launch-darkly supports the following configuration options:

### `clientSideId` (required)

The client-side ID generated by Launch Darkly which is available in your [account settings page](https://app.launchdarkly.com/settings#/projects). See the Launch Darkly docs for [more information on how the client side ID is used](https://docs.launchdarkly.com/docs/js-sdk-reference#section-initializing-the-client).

### `mode`

The mode in which the Launch Darkly client will run, either `local` or `remote`. When running in `remote` mode, feature flags will be fetched from the Launch Darkly service as you'd expect. This is the mode you want to be running in in production.

When running in `local` mode, feature flags will be fetched from the `localFlags` defined in the config. This is likely appropriate when running the app locally, or in an external environment for which you don't have Launch Darkly setup. It allows you to have a sandboxed feature flag set that is not dependent on the Launch Darkly service or the state of the flags stored in Launch Darkly itself.

_Default_: `local`
_Possible Values_: `local`, `remote`

### `localFlags`

A list of initial values for your feature flags. This property is only used when `mode: 'local'` to populate the list of feature flags for environments such as local development where it's not desired to fetch the flags from Launch Darkly.

_Default_: `null`

### `streamingFlags`

Streaming options for the feature flags for which you'd like to subscribe to realtime updates. See the [Streaming Feature Flags section](#streaming-feature-flags) for more detailed info on what the possible options are for streaming flags.

_Default_: `false`

### `bootstrap`

The Launch Darkly client supports the idea of [bootstrapping your feature flags with an initial set of values](https://docs.launchdarkly.com/sdk/client-side/javascript#bootstrapping) so that the `variation` function can be called before the flags have been fetched frm Launch Darkly.

If the `bootstrap` propery is set to `localFlags`, ember-launch-darkly will use the flags specified in `localFlags` as the bootstrap flag values passed to Launch Darkly. Other than that, the `bootstrap` property will be passed directly through to Launch Darkly.

_Default_: `null`
_Possible Values_: `localFlags` otherwise whatever LaunchDarkly expects based on it's [Bootstrapping documentation](https://docs.launchdarkly.com/sdk/client-side/javascript#bootstrapping).

### Launch Darkly specific config

Any other properties passed in as configuration will be passed straight through to LaunchDarkly.

_Possible Values_: [As documented in the section titled "Customizing your client" in the Launch Darkly documentation](https://docs.launchdarkly.com/sdk/client-side/javascript#customizing-your-client).

> A note on `sendEventsOnlyForVariation`. When this flag is set to `false`, then events are sent, for every single feature flag, to Launch Darkly when `client.allFlags()` is called. An event is what tells Launch Darkly when a flag was last requested, which is how you can tell on the feature flags list, which flags were requested and when. This can be misleading because a user didn't actually request a flag, it was ember-launch-darkly that requested `allFlags` which is needed to know which flags exist. This could be confusing if a version of your code no longer has references to a feature flag but it still exists in Launch Darkly. You may see that the flag was requested even though there is no code in the wild that actually should be requesting it. Therefore, ember-launch-darkly sets this flag to `true` to avoid sending those events when we fetch `allFlags`. You are, however, welcome to set it back to `false` in the config if you wish - just know that this means you'll be seeing "Requested at" times for flags that you may not expect.

## Usage

### Initialize

Before being used, Launch Darkly must be initialized. This should happen early so choose an appropriate place to make the call such as an application initializer or the application route.

The `initialize()` function returns a promise that resolves when the Launch Darkly client is ready so Ember will wait until this happens before proceeding.

The user `key` is the only required attribute.

See the [Launch Darkly User documentation](https://docs.launchdarkly.com/sdk/client-side/javascript#users) for the other attributes you can provide.

```js
// /app/application/route.js

import Route from '@ember/routing/route';

import { initialize } from 'ember-launch-darkly';

export default class ApplicationRoute extends Route {
  async model() {
    let user = {
      key: 'aa0ceb',
    };

    return await nitialize(user);
  }
}
```

### Identify

If you initialized Launch Darkly with an anonymous user and want to re-initialize it for a specific user to receive the flags for that user, you can use `identify`. This must be called after `initialize` has been called.

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
      key: session.get('user.id'),
      firstName: session.get('user.firstName'),
      email: session.get('user.email')
    };

    return await identify(user);
  }
}
```

### variation (template helper)

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

### variation (javascript helper)

If your feature flag is a boolean based flag, you might use it in a function like so:

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

If your feature flag is a multivariate based flag, you might use it in a function like so:

```js
// /app/components/login-page/component.js

import Component from '@ember/component';

import { variation } from 'ember-launch-darkly';

export default class LoginPageComponent extends Component {
  get price() {
    switch (variation('new-pricing-plan')) {
      case 'plan-a':
        return 99.00;
      case 'plan-b':
        return 89.00
      case 'plan-c':
        return 79.00
      default:
        return 199.00;
    }
  }
});
```

Because ember-launch-darkly is built for Ember Octane, it's feature flags are tracked. This means that when using the `variation` helper, if a flag value changes, code that references it will be automatically recomputed.

## Local feature flags

When `mode: 'local'` is set in the Launch Darkly configuration, ember-launch-darkly will retrieve the feature flags and their values from `config/environment.js` instead of the Launch Darkly service. This is useful for development purposes so you don't need to set up a new environment in Launch Darkly, your app doesn't need to make a request for the flags, and you can easily change the value of the flags from the browser console.

The local feature flags are defined in `config/environment.js` like so:

```js
let ENV = {
  launchDarkly: {
    mode: 'local',
    localFlags: {
      'apply-discount': true,
      'new-pricing-plan': 'plan-a',
    },
  },
};
```

When `mode: 'local'`, the Launch Darkly flags context is available in the JS console via `window.__LD__`. The context object provides the following helper methods to manipulate feature flags:

```js
> window.__LD__.get('new-pricing-plan', 'plan-a') // return the current value of the feature flag providing a default ('plan-a' if it doesn't exist (the default is optional)

> window.__LD__.set('new-pricing-plan', 'plan-x') // set the variation value

> window.__LD__.enable('apply-discount') // helper to set the return value to `true`
> window.__LD__.disable('apply-discount') // helper to set the return value to `false`

> window.__LD__.allFlags // return the current list of feature flags and their values

> window.__LD__.user // return the user that the client has been initialized with
```

## Streaming Feature Flags

Launch Darkly supports the ability to subscribe to changes to feature flags so that apps can react in real-time to these changes. The [`streamingFlags` configuration option](#streaming-flags) allows you to specify, in a couple of ways, which flags you'd like to stream.

To disable streaming completely, use the following configuration:

```js
launchDarkly: {
  streamingFlags: false;
}
```

_Note, this is the default behaviour if the `streamingFlags` option is not specified._

To stream all flags, use the following configuration:

```js
launchDarkly: {
  streamingFlags: true;
}
```

To get more specific, you can select to stream all flags except those specified:

```js
launchDarkly: {
  streamingFlags: {
    allExcept: ['apply-discount', 'new-login'];
  }
}
```

And, finally, you can specify only which flags you would like to stream:

```js
launchDarkly: {
  streamingFlags: {
    'apply-discount': true
  }
}
```

As Launch Darkly's realtime updates to flags uses the [Event Source API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource), certain browsers will require a polyfill to be included. ember-launch-darkly uses [EmberCLI targets](http://rwjblue.com/2017/04/21/ember-cli-targets/) to automatically decide whether or not to include the polyfill. Ensure your project contains a valid `config/targets.js` file if you require this functionality.

## Content Security Policy

If you have CSP enabled in your ember application, you will need to add Launch Darkly to the `connect-src` like so:

```js
// config/environment.js

module.exports = function (environment) {
  let ENV = {
    //snip

    contentSecurityPolicy: {
      'connect-src': ['https://*.launchdarkly.com'],
    },

    //snip
  };
};
```

## Test Helpers

### Acceptance Tests

Add the `setupLaunchDarkly` hook to the top of your test file. This will ensure that Launch Darkly uses defaults your feature flags to
`false` instead of using what is defined in the `localFlags` config. This allows your tests to start off in a known default state.

```js
import { module, test } from 'qunit';
import { visit, currentURL, click } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

import { setupLaunchDarkly } from 'ember-launch-darkly/test-support';

module('Acceptance | Homepage', function (hooks) {
  setupApplicationTest(hooks);
  setupLaunchDarkly(hooks);

  test('links go to the new homepage', async function (assert) {
    await visit('/');
    await click('a.pricing');

    assert.equal(
      currentRoute(),
      'pricing',
      'Should be on the old pricing page'
    );
  });
});
```

ember-launch-darkly provides a test helper, `withVariation`, to make it easy to turn feature flags on and off in acceptance tests.

```js
module('Acceptance | Homepage', function (hooks) {
  setupApplicationTest(hooks);
  setupLaunchDarkly(hooks);

  test('links go to the new homepage', async function (assert) {
    this.withVariation('new-pricing-plan', 'plan-a');

    await visit('/');
    await click('a.pricing');

    assert.equal(
      currentRoute(),
      'pricing',
      'Should be on the old pricing page'
    );
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

module('Integration | Component | foo', function (hooks) {
  setupRenderingTest(hooks);
  setupLaunchDarkly(hooks);

  test('new pricing', async function (assert) {
    await render(hbs`
      {{#if (variation "new-pricing-page")}}
        <h1 class="price">£ 99</h1>
      {{else}}
        <h1 class="price">£ 199</h1>
      {{/if}}
    `);

    this.withVariation('new-pricing-page');

    assert.equal(
      this.element.querySelector('.price').textContent.trim(),
      '£ 99',
      'New pricing displayed'
    );
  });
});
```

<p align="center"><sub>Made with :heart: by The Ember Launch Darkly Team</sub></p>
