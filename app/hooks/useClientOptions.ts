'use client'

import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/app/services/adminServices';
import { listClientOptions } from '@/app/services/orderFormServices';
import type { OrderCustomerOption } from '@/types';

type UseClientOptionsResult = {
  clients: OrderCustomerOption[];
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useClientOptions(enabled: boolean): UseClientOptionsResult {
  const [clients, setClients] = useState<OrderCustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listClientOptions();
      setClients(response);
    } catch (requestError) {
      setClients([]);
      setError(getApiErrorMessage(requestError, 'No se pudieron cargar los clientes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || clients.length > 0 || loading) {
      return;
    }

    void loadClients();
  }, [clients.length, enabled, loading]);

  return {
    clients,
    error,
    loading,
    refresh: loadClients,
  };
}
