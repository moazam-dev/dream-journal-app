/** Even line breaks for headings, so none ends on a lone word. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { balanceText } from '../balance.ts';

/** How far the longest line is from the shortest: 0 would be perfectly even. */
function spread(text: string) {
  const lengths = text.split('\n').map((line) => line.length);
  return Math.max(...lengths) - Math.min(...lengths);
}

describe('balanceText', () => {
  it('leaves a single line alone', () => {
    assert.equal(balanceText('good morning, sam.', 1), 'good morning, sam.');
  });

  it('keeps every word, in order', () => {
    const text = 'what did you dream about last night?';
    assert.equal(balanceText(text, 2).replace('\n', ' '), text);
  });

  it('breaks into the number of lines asked for', () => {
    assert.equal(balanceText('what did you dream about last night?', 2).split('\n').length, 2);
    assert.equal(balanceText('what did you dream about last night?', 3).split('\n').length, 3);
  });

  it('shares the words out rather than leaving one on its own', () => {
    // Left to itself the second line would be just "night?".
    assert.equal(balanceText('what did you dream about last night?', 2), 'what did you dream\nabout last night?');
    assert.ok(spread(balanceText('what did you dream about last night?', 2)) <= 2);
  });

  it('never ends on a line far shorter than the rest', () => {
    for (const [text, lines] of [
      ['dreams are today’s answers to tomorrow’s questions.', 3],
      ['record a message for future sam.', 2],
      ['let afterdream ask. you just answer.', 2],
      ['all that we see or seem is but a dream within a dream.', 3],
    ] as const) {
      const rows = balanceText(text, lines).split('\n');
      assert.equal(rows.length, lines, text);
      const average = rows.reduce((sum, row) => sum + row.length, 0) / lines;
      assert.ok(rows[lines - 1].length >= average * 0.6, `${text} -> ${rows.join(' | ')}`);
    }
  });

  it('never asks for more lines than there are words', () => {
    assert.equal(balanceText('hello', 3), 'hello');
    assert.equal(balanceText('hello there', 4), 'hello\nthere');
  });
});
