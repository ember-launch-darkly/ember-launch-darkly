import { module, test } from 'qunit';

import Context, {
  setCurrentContext,
  removeCurrentContext
} from 'ember-launch-darkly/-sdk/context';

import { variation } from 'ember-launch-darkly/-sdk/variation';

module('Unit | SDK | Variation', function(hooks) {
  hooks.afterEach(function() {
    removeCurrentContext();
  });

  test('evaluating a variation - local', async function(assert) {
    assert.expect(1);

    let flags = {
      foo: 'bar'
    };

    let context = new Context(flags);

    setCurrentContext(context);

    let result = variation('foo');

    assert.equal(result, 'bar', 'Variation value returned');
  });

  test('evaluating a variation - remote', async function(assert) {
    assert.expect(2);

    let flags = {
      cheese: 'bacon'
    };

    let client = {
      variation(key) {
        assert.equal(key, 'cheese', 'Variation event sent to LD');
      }
    };

    let context = new Context(flags, client);

    setCurrentContext(context);

    let result = variation('cheese');

    assert.equal(result, 'bacon', 'Variation value returned');
  });

  test('default variation value', async function(assert) {
    assert.expect(2);

    let flags = {};
    let context = new Context(flags);

    setCurrentContext(context);

    let result = variation('foo');

    assert.equal(result, undefined);

    result = variation('foo', 'cheese');

    assert.equal(result, 'cheese');
  });
});
