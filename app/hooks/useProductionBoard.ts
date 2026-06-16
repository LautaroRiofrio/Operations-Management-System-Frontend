'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import { useOrdersByState } from '@/app/hooks/useOrdersByState';
import { listStates } from '@/app/services/adminServices';
import {
  buildProductionOrderCard,
  getOrderDetailForProduction,
  getProductionRecipes,
  resolveProductionStateIds,
  transitionOrderToState,
  type ProductionOrderCard,
} from '@/app/services/productionServices';
import { syncProductionStockMovement } from '@/app/services/orderStockMovementServices';
import type { OrderListItem } from '@/types';

type ProductionProgressState = Record<string, number>;
type ExpandedLinesState = Record<string, boolean>;
type ActionType = 'start' | 'complete' | 'cancel' | null;

type BoardBanner = {
  tone: 'success' | 'error';
  text: string;
} | null;

function buildLineKey(orderId: number, lineId: number) {
  return `${orderId}:${lineId}`;
}

export function useProductionBoard() {
  const statesResource = useCrudResource(listStates, 'No se pudieron cargar los estados operativos.');
  const stateIds = useMemo(() => resolveProductionStateIds(statesResource.items), [statesResource.items]);
  const pendingOrdersQuery = useOrdersByState(stateIds.pending ?? 0);
  const inProductionOrdersQuery = useOrdersByState(stateIds.inProduction ?? 0);
  const detailsCacheRef = useRef(new Map<number, ProductionOrderCard>());

  const [recipesByProductId, setRecipesByProductId] = useState<Map<number, Awaited<ReturnType<typeof getProductionRecipes>> extends Map<number, infer T> ? T : never>>(new Map());
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [productionOrders, setProductionOrders] = useState<ProductionOrderCard[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [banner, setBanner] = useState<BoardBanner>(null);
  const [producedByLine, setProducedByLine] = useState<ProductionProgressState>({});
  const [expandedLines, setExpandedLines] = useState<ExpandedLinesState>({});

  useEffect(() => {
    let cancelled = false;

    async function loadRecipes() {
      setRecipesLoading(true);
      setRecipesError(null);

      try {
        const recipes = await getProductionRecipes();
        if (cancelled) {
          return;
        }

        setRecipesByProductId(recipes);
      } catch {
        if (cancelled) {
          return;
        }

        setRecipesError('No se pudieron cargar las recetas de los productos.');
        setRecipesByProductId(new Map());
      } finally {
        if (!cancelled) {
          setRecipesLoading(false);
        }
      }
    }

    void loadRecipes();

    return () => {
      cancelled = true;
    };
  }, []);

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
    let cancelled = false;

    async function loadProductionOrders() {
      const currentOrders = inProductionOrdersQuery.orders;
      if (recipesLoading || currentOrders.length === 0) {
        setProductionOrders([]);
        setDetailsLoading(false);
        setDetailsError(null);
        return;
      }

      setDetailsLoading(true);
      setDetailsError(null);

      const pendingIds = currentOrders
        .map((order) => order.id)
        .filter((orderId) => !detailsCacheRef.current.has(orderId));

      try {
        if (pendingIds.length > 0) {
          const details = await Promise.all(
            pendingIds.map(async (orderId) => {
              const detail = await getOrderDetailForProduction(orderId);
              return buildProductionOrderCard(detail, recipesByProductId);
            }),
          );

          if (cancelled) {
            return;
          }

          details.forEach((detail) => {
            detailsCacheRef.current.set(detail.id, detail);
          });
        }

        const nextOrders = currentOrders.flatMap((order) => {
          const cachedOrder = detailsCacheRef.current.get(order.id);

          if (!cachedOrder) {
            return [];
          }

          return [{
            ...cachedOrder,
            customerName: order.customerName,
            deliveryLabel: order.deliveryLabel,
            totalLabel: order.totalLabel,
          }];
        });

        setProductionOrders(nextOrders);
      } catch {
        if (cancelled) {
          return;
        }

        setDetailsError('No se pudieron cargar los pedidos en produccion.');
        setProductionOrders([]);
      } finally {
        if (!cancelled) {
          setDetailsLoading(false);
        }
      }
    }

    void loadProductionOrders();

    return () => {
      cancelled = true;
    };
  }, [inProductionOrdersQuery.orders, recipesByProductId, recipesLoading]);

  useEffect(() => {
    const activeIds = new Set(productionOrders.map((order) => order.id));

    detailsCacheRef.current.forEach((_, orderId) => {
      if (!activeIds.has(orderId)) {
        detailsCacheRef.current.delete(orderId);
      }
    });

    setProducedByLine((currentState) => {
      const nextState = Object.fromEntries(
        Object.entries(currentState).filter(([lineKey]) => activeIds.has(Number(lineKey.split(':')[0]))),
      );

      return Object.keys(nextState).length === Object.keys(currentState).length ? currentState : nextState;
    });

    setExpandedLines((currentState) => {
      const nextState = Object.fromEntries(
        Object.entries(currentState).filter(([lineKey]) => activeIds.has(Number(lineKey.split(':')[0]))),
      );

      return Object.keys(nextState).length === Object.keys(currentState).length ? currentState : nextState;
    });
  }, [productionOrders]);

  const pendingOrders = pendingOrdersQuery.orders;
  const isLoadingBoard =
    statesResource.loading ||
    recipesLoading ||
    pendingOrdersQuery.loading ||
    inProductionOrdersQuery.loading ||
    detailsLoading;
  const boardError =
    statesResource.error ||
    recipesError ||
    pendingOrdersQuery.error ||
    inProductionOrdersQuery.error ||
    detailsError;
  const hasStateConfigError =
    !statesResource.loading &&
    (!stateIds.pending || !stateIds.inProduction || !stateIds.ready || !stateIds.cancelled);

  const incrementProduct = (orderId: number, lineId: number, quantityRequired: number) => {
    const lineKey = buildLineKey(orderId, lineId);

    setProducedByLine((currentState) => {
      const currentValue = currentState[lineKey] ?? 0;
      const nextValue = Math.min(currentValue + 1, quantityRequired);

      return {
        ...currentState,
        [lineKey]: nextValue,
      };
    });
  };

  const toggleLine = (orderId: number, lineId: number) => {
    const lineKey = buildLineKey(orderId, lineId);

    setExpandedLines((currentState) => ({
      ...currentState,
      [lineKey]: !currentState[lineKey],
    }));
  };

  const isOrderComplete = (order: ProductionOrderCard) =>
    order.products.every((product) => {
      const lineKey = buildLineKey(order.id, product.id);
      return (producedByLine[lineKey] ?? 0) >= product.quantityRequired;
    });

  const startOrder = async (order: OrderListItem) => {
    if (!stateIds.inProduction) {
      setBanner({
        tone: 'error',
        text: 'No se encontro el estado "en produccion".',
      });
      return;
    }

    setActiveOrderId(order.id);
    setActiveAction('start');

    try {
      const detail = await transitionOrderToState(order.id, stateIds.inProduction);
      const nextOrder = buildProductionOrderCard(detail, recipesByProductId);
      detailsCacheRef.current.set(nextOrder.id, nextOrder);
      setProductionOrders((currentOrders) => {
        const alreadyExists = currentOrders.some((currentOrder) => currentOrder.id === nextOrder.id);
        if (alreadyExists) {
          return currentOrders;
        }

        return [nextOrder, ...currentOrders];
      });
      setBanner({
        tone: 'success',
        text: `El pedido ${order.orderNumber} paso a produccion.`,
      });
    } catch {
      setBanner({
        tone: 'error',
        text: `No se pudo mover ${order.orderNumber} a produccion.`,
      });
    } finally {
      setActiveOrderId(null);
      setActiveAction(null);
    }
  };

  const completeOrder = async (order: ProductionOrderCard) => {
    if (!stateIds.ready) {
      setBanner({
        tone: 'error',
        text: 'No se encontro el estado "listo".',
      });
      return;
    }

    setActiveOrderId(order.id);
    setActiveAction('complete');

    try {
      const orderDetail = await getOrderDetailForProduction(order.id);
      await syncProductionStockMovement(orderDetail);
      await transitionOrderToState(order.id, stateIds.ready);
      detailsCacheRef.current.delete(order.id);
      setProductionOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
      );
      setBanner({
        tone: 'success',
        text: `El pedido ${order.orderNumber} quedo listo.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message.trim()
          ? error.message
          : `No se pudo completar ${order.orderNumber}.`;

      setBanner({
        tone: 'error',
        text: errorMessage,
      });
    } finally {
      setActiveOrderId(null);
      setActiveAction(null);
    }
  };

  const cancelOrder = async (order: ProductionOrderCard) => {
    if (!stateIds.cancelled) {
      setBanner({
        tone: 'error',
        text: 'No se encontro el estado "cancelado".',
      });
      return;
    }

    setActiveOrderId(order.id);
    setActiveAction('cancel');

    try {
      await transitionOrderToState(order.id, stateIds.cancelled);
      detailsCacheRef.current.delete(order.id);
      setProductionOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
      );
      setBanner({
        tone: 'success',
        text: `El pedido ${order.orderNumber} fue cancelado.`,
      });
    } catch {
      setBanner({
        tone: 'error',
        text: `No se pudo cancelar ${order.orderNumber}.`,
      });
    } finally {
      setActiveOrderId(null);
      setActiveAction(null);
    }
  };

  return {
    activeAction,
    activeOrderId,
    banner,
    boardError,
    hasStateConfigError,
    incrementProduct,
    isLoadingBoard,
    isOrderComplete,
    pendingOrders,
    producedByLine,
    productionOrders,
    startOrder,
    toggleLine,
    expandedLines,
    cancelOrder,
    completeOrder,
  };
}
