import { useCallback, useEffect, useRef, useState } from 'react';

import { readDreamPatterns } from '@/services/dreams';
import { getErrorMessage } from '@/utils/errors';
import type { PatternReading } from '@/utils/patterns';

/** The reading stays "in progress" at least this long, so the reading moment never flashes. */
const MIN_READING_MS = 1600;

/** The last reading, kept while the app is open, and which dreams it was read from. */
let cached: { key: string; reading: PatternReading } | null = null;
/** The dreams "dive deeper" was last opened for. */
let seenKey: string | null = null;

export type ReadingStatus = 'idle' | 'reading' | 'ready' | 'failed';

type ReadingState = { key: string | null; status: ReadingStatus; reading: PatternReading | null; error: string | null };

/**
 * The Groq reading of the dreams (the thread, the dream cast, symbols and a question).
 * `key` names the dreams it should be read from (it changes when a dream is added); a
 * reading for the same key is reused instead of asking Groq again. `fresh` is true until
 * "dive deeper" has been opened for these dreams (`markSeen`).
 */
export function usePatternReading(key: string | null) {
  const [state, setState] = useState<ReadingState>({ key: null, status: 'idle', reading: null, error: null });
  const [, setSeen] = useState<string | null>(seenKey);
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
      if (alive.current) setState((now) => (now.key === key ? { key, status: 'ready', reading, error: null } : now));
    } catch (err) {
      if (alive.current) setState((now) => (now.key === key ? { key, status: 'failed', reading: null, error: getErrorMessage(err) } : now));
    }
  }, [key]);

  const markSeen = useCallback(() => {
    if (key === null || seenKey === key) return;
    seenKey = key;
    setSeen(key);
  }, [key]);

  return { ...current, start, markSeen, fresh: key !== null && seenKey !== key };
}
