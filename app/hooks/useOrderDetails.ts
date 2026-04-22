'use client'

import { useEffect, useRef, useState } from 'react';
import { normalizeOrderDetail } from '@/app/lib/orderAdapters';
import { getOrderById } from '@/app/services/orderServices';
import type { OrderDetail } from '@/types';

type UseOrderDetailsResult = {
  error: string | null;
  loading: boolean;
  order: OrderDetail | null;
};

export function useOrderDetails(orderId: number | null): UseOrderDetailsResult {
  const cacheRef = useRef(new Map<number, OrderDetail>());
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const handleOrdersChanged = () => {
      if (orderId === null) {
        return;
      }

      cacheRef.current.delete(orderId);
      setRefreshTick((currentValue) => currentValue + 1);
    };

    window.addEventListener('orders:changed', handleOrdersChanged);

    return () => {
      window.removeEventListener('orders:changed', handleOrdersChanged);
    };
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;

    if (orderId === null) {
      setOrder(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cachedOrder = cacheRef.current.get(orderId);
    if (cachedOrder) {
      setOrder(cachedOrder);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchOrder() {
      setLoading(true);
      setError(null);

      try {
        const response = await getOrderById(orderId);
        if (cancelled) {
          return;
        }

        const normalizedOrder = normalizeOrderDetail(response);
        if (!normalizedOrder) {
          throw new Error('Invalid order payload');
        }

        cacheRef.current.set(orderId, normalizedOrder);
        setOrder(normalizedOrder);
      } catch {
        if (cancelled) {
          return;
        }

        setError('No se pudo cargar el detalle de la orden.');
        setOrder(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, refreshTick]);

  return { error, loading, order };
}
