import { module, test } from 'qunit';

import Context from 'ember-launch-darkly/utils/-sdk/context';

module('Unit | Utility | SDK | Context', function() {
  test('constructor', function(assert) {
    let context = new Context({});
    assert.equal(
      Object.keys(context.allFlags).length,
      0,
      'Initialize with no flags'
    );

    context = new Context({ foo: true });
    assert.equal(
      Object.keys(context.allFlags).length,
      1,
      'Initialize with flags'
    );
  });

  test('#updateFlags', function(assert) {
    let context = new Context({ foo: true });

    assert.equal(
      Object.keys(context.allFlags).length,
      1,
      'Initialize with flags'
    );

    context.updateFlags({ foo: false, bar: false });

    assert.equal(Object.keys(context.allFlags).length, 2, 'Update flags');
  });

  test('#enable', function(assert) {
    let context = new Context({ foo: true, bar: false });

    assert.deepEqual(
      context.allFlags,
      { foo: true, bar: false },
      'Initial flag state'
    );

    context.enable('bar');

    assert.deepEqual(
      context.allFlags,
      { foo: true, bar: true },
      'Updated flag state'
    );
  });

  test('#disable', function(assert) {
    let context = new Context({ foo: true, bar: false });

    assert.deepEqual(
      context.allFlags,
      { foo: true, bar: false },
      'Initial flag state'
    );

    context.disable('foo');

    assert.deepEqual(
      context.allFlags,
      { foo: false, bar: false },
      'Updated flag state'
    );
  });

  test('#set', function(assert) {
    let context = new Context({ foo: true, bar: false });

    assert.deepEqual(
      context.allFlags,
      { foo: true, bar: false },
      'Initial flag state'
    );

    context.set('foo', 'baz');

    assert.deepEqual(
      context.allFlags,
      { foo: 'baz', bar: false },
      'Updated flag state'
    );
  });

  test('#get', function(assert) {
    let context = new Context({ foo: true, bar: false });

    assert.equal(context.get('foo'), true, 'Initial flag state');
    assert.equal(
      context.get('moo', 'bah'),
      'bah',
      `Return default value if flag doesn't exist`
    );
  });

  test('allFlags', function(assert) {
    let context = new Context({ foo: true, bar: false });

    let flags = context.allFlags;

    assert.deepEqual(
      flags,
      { foo: true, bar: false },
      'All flags accounted for'
    );
  });

  test('isLocal', function(assert) {
    assert.equal(new Context({}).isLocal, true, 'Operating in local mode');
    assert.equal(
      new Context({}, {}).isLocal,
      false,
      'Operating in remote mode'
    );
  });

  test('user', function(assert) {
    let client = {
      getUser() {
        return { key: 'foo' };
      }
    };

    assert.deepEqual(new Context({}).user, {
      key: 'local-mode-no-user-specified'
    });
    assert.deepEqual(new Context({}, client).user, { key: 'foo' });
  });
});
