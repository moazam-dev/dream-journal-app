import { useCallback, useEffect, useRef, useState } from 'react';

import { readDreamPatterns } from '@/services/dreams';
import { getErrorMessage } from '@/utils/errors';
import type { PatternReading } from '@/utils/patterns';

/** The reading stays on screen at least this long, so the "reading…" moment never flashes. */
const MIN_READING_MS = 2600;

/** The last reading, kept while the app is open, and which dreams it was read from. */
let cached: { key: string; reading: PatternReading } | null = null;

export type ReadingStatus = 'idle' | 'reading' | 'ready' | 'failed';

type ReadingState = { key: string | null; status: ReadingStatus; reading: PatternReading | null; error: string | null };

/**
 * The "dive deeper" reading of the dreams. `key` names the dreams it should be read from
 * (it changes when a dream is added); a reading for the same key is reused instead of
 * asking Groq again. `fresh` is true while there is a reading waiting to be made.
 */
export function usePatternReading(key: string | null) {
  const [state, setState] = useState<ReadingState>({ key: null, status: 'idle', reading: null, error: null });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // State left over from other dreams is stale: start from the cache (or nothing) instead.
  const hit = key !== null && cached?.key === key ? cached.reading : null;
  const current: ReadingState =
    state.key === key ? state : { key, status: hit ? 'ready' : 'idle', reading: hit, error: null };

  const start = useCallback(async () => {
    if (key === null) return;
    if (cached?.key === key) {
      setState({ key, status: 'ready', reading: cached.reading, error: null });
      return;
    }
    setState({ key, status: 'reading', reading: null, error: null });
    const started = Date.now();
    try {
      const reading = await readDreamPatterns();
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_READING_MS - (Date.now() - started))));
      cached = { key, reading };
      if (alive.current) setState({ key, status: 'ready', reading, error: null });
    } catch (err) {
      if (alive.current) setState({ key, status: 'failed', reading: null, error: getErrorMessage(err) });
    }
  }, [key]);

  return { ...current, start, fresh: key !== null && cached?.key !== key };
}
