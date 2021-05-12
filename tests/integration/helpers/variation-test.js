import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import { setupLaunchDarkly } from 'ember-launch-darkly/test-support';

module('Integration | Helper | variation', function(hooks) {
  setupRenderingTest(hooks);
  setupLaunchDarkly(hooks);

  test('it returns a variation', async function(assert) {
    assert.expect(2);

    await render(hbs`
      {{#if (variation "foo-bar")}}
        <h1>YAY</h1>
      {{else}}
        <h1>BOO</h1>
      {{/if}}
    `);

    assert.dom('h1').hasText('BOO', 'Feature flag is disabled');

    await this.withVariation('foo-bar');

    assert.dom('h1').hasText('YAY', 'Feature flag is enabled');
  });

  test('it returns the default value if variation is unknown', async function(assert) {
    assert.expect(2);

    await render(hbs`<h1>{{variation "cheese" defaultValue="bacon"}}</h1>`);

    assert.dom('h1').hasText('bacon', 'Feature flag default value returned');

    await this.withVariation('cheese', 'tomato');

    assert.dom('h1').hasText('tomato', 'Feature flag value returned');
  });
});
