'use client'

import { useEffect, useMemo, useState } from 'react';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import { useOrderDetails } from '@/app/hooks/useOrderDetails';
import { useOrdersByState } from '@/app/hooks/useOrdersByState';
import { listStates } from '@/app/services/adminServices';
import {
  getOrderDetailForProduction,
  resolveProductionStateIds,
  transitionOrderToState,
} from '@/app/services/productionServices';
import { syncDeliveryStockMovement } from '@/app/services/orderStockMovementServices';
import type { OrderListItem } from '@/types';

type DeliveryBanner = {
  tone: 'success' | 'error';
  text: string;
} | null;

type DeliveryAction = 'deliver' | 'cancel' | null;

export function useDeliveryBoard() {
  const statesResource = useCrudResource(listStates, 'No se pudieron cargar los estados operativos.');
  const stateIds = useMemo(() => resolveProductionStateIds(statesResource.items), [statesResource.items]);
  const readyOrdersQuery = useOrdersByState(stateIds.ready ?? 0);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<DeliveryAction>(null);
  const [banner, setBanner] = useState<DeliveryBanner>(null);
  const { order, loading: detailLoading, error: detailError } = useOrderDetails(selectedOrderId);

  useEffect(() => {
    if (banner === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBanner(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [banner]);

  useEffect(() => {
    const readyOrders = readyOrdersQuery.orders;

    if (readyOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }

    setSelectedOrderId((currentOrderId) => {
      if (currentOrderId && readyOrders.some((readyOrder) => readyOrder.id === currentOrderId)) {
        return currentOrderId;
      }

      return readyOrders[0]?.id ?? null;
    });
  }, [readyOrdersQuery.orders]);

  const handleTransition = async (
    orderItem: OrderListItem,
    nextStateId: number | null,
    action: Exclude<DeliveryAction, null>,
    stockStatus: 'entregado' | 'cancelado_con_perdida',
    successText: string,
    errorText: string,
  ) => {
    if (!nextStateId) {
      setBanner({
        tone: 'error',
        text: errorText,
      });
      return;
    }

    setActiveOrderId(orderItem.id);
    setActiveAction(action);

    try {
      const orderDetail = await getOrderDetailForProduction(orderItem.id);
      await syncDeliveryStockMovement(orderDetail, stockStatus);
      await transitionOrderToState(orderItem.id, nextStateId);
      setBanner({
        tone: 'success',
        text: successText,
      });
    } catch (error) {
      const resolvedErrorText =
        error instanceof Error && error.message.trim() ? error.message : errorText;

      setBanner({
        tone: 'error',
        text: resolvedErrorText,
      });
    } finally {
      setActiveOrderId(null);
      setActiveAction(null);
    }
  };

  const deliverOrder = async (orderItem: OrderListItem) =>
    handleTransition(
      orderItem,
      stateIds.delivered,
      'deliver',
      'entregado',
      `El pedido ${orderItem.orderNumber} fue marcado como entregado.`,
      `No se pudo entregar ${orderItem.orderNumber}.`,
    );

  const cancelOrder = async (orderItem: OrderListItem) =>
    handleTransition(
      orderItem,
      stateIds.cancelled,
      'cancel',
      'cancelado_con_perdida',
      `El pedido ${orderItem.orderNumber} fue cancelado.`,
      `No se pudo cancelar ${orderItem.orderNumber}.`,
    );

  const hasStateConfigError =
    !statesResource.loading &&
    (!stateIds.ready || !stateIds.delivered || !stateIds.cancelled);

  const selectedOrderListItem =
    readyOrdersQuery.orders.find((readyOrder) => readyOrder.id === selectedOrderId) ?? null;

  return {
    activeAction,
    activeOrderId,
    banner,
    cancelOrder,
    deliverOrder,
    detailError,
    detailLoading,
    hasStateConfigError,
    order,
    readyOrders: readyOrdersQuery.orders,
    readyOrdersError: readyOrdersQuery.error,
    readyOrdersLoading: readyOrdersQuery.loading,
    selectedOrderId,
    selectedOrderListItem,
    setSelectedOrderId,
    statesLoading: statesResource.loading,
  };
}
