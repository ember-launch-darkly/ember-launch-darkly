import { module, test } from 'qunit';

import Context, {
  setCurrentContext,
  removeCurrentContext
} from 'ember-launch-darkly/-sdk/context';
import { identify } from 'ember-launch-darkly/-sdk/identify';

module('Unit | SDK | Identify', function(hooks) {
  hooks.afterEach(function() {
    removeCurrentContext();
  });

  test('identifying a user - local', async function(assert) {
    assert.expect(1);

    let flags = {
      cheese: 'bacon'
    };

    let context = new Context(flags);

    setCurrentContext(context);

    await identify({ key: 'cheese' });

    assert.deepEqual(
      context.allFlags,
      flags,
      'User identified and flags updated'
    );
  });

  test('identifying a user - remote', async function(assert) {
    assert.expect(2);

    let flags = {
      cheese: 'bacon'
    };

    let client = {
      identify(user) {
        assert.deepEqual(
          user,
          {
            key: 'cheese'
          },
          'Identify on LD client called'
        );

        return {
          foo: true,
          bar: false
        };
      }
    };

    let context = new Context(flags, client);

    setCurrentContext(context);

    await identify({ key: 'cheese' });

    assert.deepEqual(
      context.allFlags,
      {
        foo: true,
        bar: false
      },
      'User identified and flags updated'
    );
  });
});
