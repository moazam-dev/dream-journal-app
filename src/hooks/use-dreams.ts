import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { fetchDreamById, fetchDreams } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { getErrorMessage } from '@/utils/errors';

/**
 * Loads all dreams and tracks loading / error state for a screen.
 * Reloads every time the screen comes into view, so newly saved dreams appear.
 */
export function useDreams() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    // Ignore the result if the user leaves the screen before it arrives.
    let isActive = true;

    fetchDreams()
      .then((result) => {
        if (!isActive) return;
        setDreams(result);
        setError(null);
      })
      .catch((err) => {
        if (isActive) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  // Runs `load` each time this screen is focused (opened or returned to).
  useFocusEffect(load);

  /** Used by the "Try again" button. */
  function reload() {
    setLoading(true);
    setError(null);
    load();
  }

  return { dreams, loading, error, reload };
}

/** Loads a single dream by id and tracks loading / error state. */
export function useDream(id: string) {
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let isActive = true;

    fetchDreamById(id)
      .then((result) => {
        if (!isActive) return;
        setDream(result);
        setError(null);
      })
      .catch((err) => {
        if (isActive) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  // Runs `load` when the screen opens (and again if the id changes).
  useEffect(load, [load]);

  /** Used by the "Try again" button. */
  function reload() {
    setLoading(true);
    setError(null);
    load();
  }

  // `setDream` lets the screen show an updated dream (e.g. after a retried AI reflection)
  // without loading it again.
  return { dream, loading, error, reload, setDream };
}
