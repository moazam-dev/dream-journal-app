/** Title wording for the gender onboarding screen. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { genderSlot } from '../gender.ts';

describe('genderSlot', () => {
  it('is empty until something is picked', () => {
    assert.equal(genderSlot(null, ''), '');
    assert.equal(genderSlot(null, 'ignored'), '');
  });

  it('uses the chip wording for the fixed answers', () => {
    assert.equal(genderSlot('woman', ''), 'a woman');
    assert.equal(genderSlot('man', ''), 'a man');
    assert.equal(genderSlot('non-binary', ''), 'non-binary');
  });

  it('keeps "rather not say" playful', () => {
    assert.equal(genderSlot('rather-not-say', ''), 'a mystery');
  });

  it('uses their own words, trimmed, and stays empty until they type', () => {
    assert.equal(genderSlot('self-describe', '  '), '');
    assert.equal(genderSlot('self-describe', ' a moth person '), 'a moth person');
  });
});
