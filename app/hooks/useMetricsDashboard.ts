'use client'

import { useEffect, useState } from 'react';
import {
  getMetricsDashboardData,
  type MetricsDashboardData,
} from '@/app/services/metricsServices';

type UseMetricsDashboardResult = {
  data: MetricsDashboardData | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useMetricsDashboard(): UseMetricsDashboardResult {
  const [data, setData] = useState<MetricsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await getMetricsDashboardData();
      setData(nextData);
    } catch {
      setError('No se pudieron cargar las metricas.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const nextData = await getMetricsDashboardData();
        if (cancelled) {
          return;
        }

        setData(nextData);
      } catch {
        if (cancelled) {
          return;
        }

        setError('No se pudieron cargar las metricas.');
        setData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading, refresh };
}
