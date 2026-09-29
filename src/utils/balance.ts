/**
 * Shares a heading's words out evenly over the lines it takes, so it never trails off with
 * one word on its own. React Native has no `text-wrap: balance`, so the breaks are worked
 * out here and put in by hand.
 */

/** Words never split, so a line can't be shorter than the longest word in it. */
function widths(words: string[]) {
  const upto = [0];
  for (const word of words) upto.push(upto[upto.length - 1] + word.length);
  // Characters in words `from`..`to - 1`, with one space between them.
  return (from: number, to: number) => upto[to] - upto[from] + (to - from - 1);
}

/**
 * Breaks `text` into `lines` lines of as near the same length as possible, keeping the words
 * in order. Every way of splitting is scored by how far each line falls from the even share
 * (squared, so one very short line costs more than two slightly short ones) and the best
 * one wins. Returns the text with newlines in it; unchanged when there is nothing to balance.
 */
export function balanceText(text: string, lines: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  const rows = Math.min(lines, words.length);
  if (rows < 2) return text;

  const width = widths(words);
  const share = width(0, words.length) / rows;
  // A short last line is the thing worth avoiding — it is what leaves a heading hanging on
  // one word — so falling short there counts twice.
  const cost = (from: number, to: number, row: number) => {
    const line = width(from, to);
    const short = row === rows ? Math.max(0, share - line) : 0;
    return (line - share) ** 2 + short ** 2;
  };

  // best[r][i]: the lowest cost of putting the first i words on r lines, and where that line started.
  const best: number[][] = [new Array(words.length + 1).fill(Infinity)];
  const start: number[][] = [new Array(words.length + 1).fill(0)];
  best[0][0] = 0;
  for (let r = 1; r <= rows; r++) {
    best.push(new Array(words.length + 1).fill(Infinity));
    start.push(new Array(words.length + 1).fill(0));
    for (let to = r; to <= words.length; to++) {
      for (let from = r - 1; from < to; from++) {
        const total = best[r - 1][from] + cost(from, to, r);
        if (total < best[r][to]) {
          best[r][to] = total;
          start[r][to] = from;
        }
      }
    }
  }

  // Walk the choices back from the last line to the first.
  const out: string[] = [];
  let to = words.length;
  for (let r = rows; r > 0; r--) {
    const from = start[r][to];
    out.unshift(words.slice(from, to).join(' '));
    to = from;
  }
  return out.join('\n');
}
