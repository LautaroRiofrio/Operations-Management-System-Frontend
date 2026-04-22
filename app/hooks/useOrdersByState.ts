'use client'

import { useEffect, useRef, useState } from 'react';
import { normalizeOrdersResponse } from '@/app/lib/orderAdapters';
import { getOrderByState } from '@/app/services/orderServices';
import type { OrderListItem } from '@/types';

type UseOrdersByStateResult = {
  error: string | null;
  loading: boolean;
  orders: OrderListItem[];
};

export function useOrdersByState(state: number): UseOrdersByStateResult {
  const cacheRef = useRef(new Map<number, OrderListItem[]>());
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const handleOrdersChanged = () => {
      cacheRef.current.delete(state);
      setRefreshTick((currentValue) => currentValue + 1);
    };

    window.addEventListener('orders:changed', handleOrdersChanged);

    return () => {
      window.removeEventListener('orders:changed', handleOrdersChanged);
    };
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    const cachedOrders = cacheRef.current.get(state);

    if (cachedOrders) {
      setOrders(cachedOrders);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchOrders() {
      setLoading(true);
      setError(null);

      try {
        const response = await getOrderByState(state);
        if (cancelled) {
          return;
        }

        const normalizedOrders = normalizeOrdersResponse(response);
        cacheRef.current.set(state, normalizedOrders);
        setOrders(normalizedOrders);
      } catch {
        if (cancelled) {
          return;
        }

        setError('No se pudieron cargar las órdenes.');
        setOrders([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [refreshTick, state]);

  return { error, loading, orders };
}
