import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { fetchDreamById, generateDreamImage } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { getErrorMessage } from '@/utils/errors';

/** While the server is already painting (started on an earlier visit), check back this often… */
const CHECK_INTERVAL_MS = 3000;
/** …and give up after this many checks (~1 minute), so the user can retry. */
const MAX_CHECKS = 20;

/**
 * Creates the dream's AI image and tracks its progress for the Dream Detail screen.
 *
 * - Starts automatically once the reflection is done and there is no image yet.
 * - If the server was already working on it (e.g. the user left and came back),
 *   it checks the database every few seconds until the image is ready.
 * - `retry()` is for the "Try again" button.
 */
export function useDreamImage(
  dream: Dream | null,
  setDream: Dispatch<SetStateAction<Dream | null>>
) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const dreamId = dream?.id;
  const reflectionReady = dream?.analysis_status === 'completed';
  const imageStatus = dream?.image_status;

  const generate = useCallback(
    async (id: string) => {
      setGenerating(true);
      setError(null);
      try {
        setDream(await generateDreamImage(id));
      } catch (err) {
        setError(getErrorMessage(err));
        // The server has marked it 'failed' too; show the retry option.
        setDream((current) => (current ? { ...current, image_status: 'failed' } : current));
      } finally {
        setGenerating(false);
      }
    },
    [setDream]
  );

  // Start automatically: reflection is ready and no image has been started yet.
  useEffect(() => {
    if (!dreamId || !reflectionReady || imageStatus !== 'pending' || autoStarted.current) return;
    autoStarted.current = true;
    generate(dreamId);
  }, [dreamId, reflectionReady, imageStatus, generate]);

  // The server is already painting (not started by this screen): check back until it's done.
  useEffect(() => {
    if (!dreamId || imageStatus !== 'generating' || generating) return;

    let checks = 0;
    const timer = setInterval(async () => {
      checks += 1;
      try {
        const latest = await fetchDreamById(dreamId);
        if (latest && latest.image_status !== 'generating') {
          setDream(latest);
          return;
        }
      } catch {
        // Network blip: just try again on the next check.
      }
      if (checks >= MAX_CHECKS) {
        setDream((current) => (current ? { ...current, image_status: 'failed' } : current));
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [dreamId, imageStatus, generating, setDream]);

  function retry() {
    if (dreamId) generate(dreamId);
  }

  return { generating, error, retry };
}
