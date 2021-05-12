import { module, test } from 'qunit';

import { shouldUpdateFlag } from 'ember-launch-darkly/-sdk/initialize';

module('Unit | SDK | Initialize', function() {
  module('#shouldUpdateFlag', function() {
    test('it works', async function(assert) {
      assert.equal(shouldUpdateFlag('foo'), false, 'Config not provided');
      assert.equal(shouldUpdateFlag('foo', {}), false, 'Empty object provided');

      assert.equal(shouldUpdateFlag('foo', false), false, 'Stream no flags');
      assert.equal(
        shouldUpdateFlag('foo', { allExcept: ['foo'] }),
        false,
        'Stream all flags except this flag'
      );
      assert.equal(
        shouldUpdateFlag('foo', { foo: false }),
        false,
        'Specifically do not stream this flag'
      );
      assert.equal(
        shouldUpdateFlag('foo', { foo: 666 }),
        false,
        'Invalid value for specific flag'
      );
      assert.equal(
        shouldUpdateFlag('foo', { allExcept: true }),
        false,
        'Invalid value for allExcept'
      );

      assert.equal(shouldUpdateFlag('foo', true), true, 'Stream all flags');
      assert.equal(
        shouldUpdateFlag('foo', { allExcept: ['bar'] }),
        true,
        'Stream all flags except another flag'
      );
      assert.equal(
        shouldUpdateFlag('foo', { foo: true }),
        true,
        'Specifically stream this flag'
      );
    });
  });
});
