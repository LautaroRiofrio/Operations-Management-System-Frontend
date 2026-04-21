'use client'

import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/app/services/adminServices';

type UseCrudResourceResult<T> = {
  error: string | null;
  items: T[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useCrudResource<T>(
  fetcher: () => Promise<T[]>,
  fallbackMessage: string,
): UseCrudResourceResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetcher();
      setItems(response);
    } catch (requestError) {
      setItems([]);
      setError(getApiErrorMessage(requestError, fallbackMessage));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOnMount() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetcher();
        if (cancelled) {
          return;
        }

        setItems(response);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setItems([]);
        setError(getApiErrorMessage(requestError, fallbackMessage));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOnMount();

    return () => {
      cancelled = true;
    };
  }, [fallbackMessage, fetcher]);

  return { error, items, loading, refresh };
}
