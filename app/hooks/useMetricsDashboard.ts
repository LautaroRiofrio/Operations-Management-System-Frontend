'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  getMetricsDashboardData,
  type MetricsDashboardData,
} from '@/app/services/metricsServices';

type MetricsDateRange = {
  endDate: string;
  startDate: string;
};

type UseMetricsDashboardResult = {
  data: MetricsDashboardData | null;
  dateRange: MetricsDateRange;
  error: string | null;
  loading: boolean;
  refresh: (nextRange?: Partial<MetricsDateRange>) => Promise<void>;
  setDateRange: Dispatch<SetStateAction<MetricsDateRange>>;
};

function sanitizeDateRange(range: Partial<MetricsDateRange>) {
  const nextStartDate = range.startDate?.trim() ?? '';
  const nextEndDate = range.endDate?.trim() ?? '';

  return {
    endDate: nextEndDate,
    startDate: nextStartDate,
  };
}

export function useMetricsDashboard(): UseMetricsDashboardResult {
  const [data, setData] = useState<MetricsDashboardData | null>(null);
  const [dateRange, setDateRange] = useState<MetricsDateRange>({
    endDate: '',
    startDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (nextRange?: Partial<MetricsDateRange>) => {
    const resolvedRange = sanitizeDateRange({
      ...dateRange,
      ...nextRange,
    });

    if (nextRange) {
      setDateRange(resolvedRange);
    }

    setLoading(true);
    setError(null);

    try {
      const nextData = await getMetricsDashboardData({
        endDate: resolvedRange.endDate || undefined,
        startDate: resolvedRange.startDate || undefined,
      });
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

  return { data, dateRange, error, loading, refresh, setDateRange };
}
