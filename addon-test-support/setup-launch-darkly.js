import StubClient from './helpers/launch-darkly-client-test-helper';

function setupLaunchDarkly(hooks) {
  hooks.beforeEach(function() {
    if (!this.owner) {
      throw new Error(
        'You must call one of the ember-qunit setupTest(), setupRenderingTest() or setupApplicationTest() methods before calling setupLaunchDarkly()'
      );
    }

    this.owner.register('service:launch-darkly-client', StubClient)

    this.withVariation = (key, value = true) => {
      let client = this.owner.lookup('service:launch-darkly-client');
      client.setVariation(key, value);

      return value;
    }
  });

  hooks.afterEach(function() {
    delete this.withVariation;
  });
}

export default setupLaunchDarkly;
