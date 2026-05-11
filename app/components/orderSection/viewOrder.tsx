'use client'

import { useState } from 'react';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import { useOrderDetails } from '@/app/hooks/useOrderDetails';
import { listStates } from '@/app/services/adminServices';
import {
  resolveProductionStateIds,
  transitionOrderToState,
} from '@/app/services/productionServices';
import type { OrderSectionProps } from '@/types';

const ViewOrder = ({ selectedOrderId, setMode }: OrderSectionProps) => {
  const resolvedOrderId = selectedOrderId ?? null;
  const { order, loading, error } = useOrderDetails(resolvedOrderId);
  const statesResource = useCrudResource(listStates, 'No se pudieron cargar los estados.');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const stateIds = resolveProductionStateIds(statesResource.items);

  const handleCancelOrder = async () => {
    if (!order || !stateIds.cancelled) {
      setCancelError('No se encontro el estado "cancelado".');
      return;
    }

    const shouldCancel = window.confirm(`Cancelar ${order.orderNumber}?`);
    if (!shouldCancel) {
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      await transitionOrderToState(order.id, stateIds.cancelled);
      setMode('default');
    } catch {
      setCancelError('No se pudo cancelar la orden.');
    } finally {
      setIsCancelling(false);
    }
  };

  const { detailContent, productsContent } = (() => {
    if (resolvedOrderId === null) {
      return {
        detailContent: (
          <p className="text-sm text-neutral-600">
            Selecciona una orden para ver el detalle.
          </p>
        ),
        productsContent: (
          <p className="text-sm text-neutral-500">
            Los productos de la orden se veran aca.
          </p>
        ),
      };
    }

    if (loading) {
      return {
        detailContent: <p className="text-sm text-neutral-600">Cargando detalle de la orden...</p>,
        productsContent: <p className="text-sm text-neutral-500">Cargando productos...</p>,
      };
    }

    if (error) {
      return {
        detailContent: <p className="text-sm text-red-600">{error}</p>,
        productsContent: <p className="text-sm text-red-600">{error}</p>,
      };
    }

    if (!order) {
      return {
        detailContent: (
          <p className="text-sm text-neutral-600">
            No se encontro informacion para esta orden.
          </p>
        ),
        productsContent: (
          <p className="text-sm text-neutral-500">No hay productos para mostrar.</p>
        ),
      };
    }

    const orderLines = Array.isArray(order.lines) ? order.lines : [];

    return {
      detailContent: (
        <div className="flex h-full flex-col gap-5">
          {cancelError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {cancelError}
            </div>
          ) : null}

          <div>
            <h2 className="text-2xl font-bold">Cliente</h2>
            <div className="flex flex-col gap-3 rounded-xl bg-white px-2 py-2">
              <div className="flex gap-2">
                <span className="font-bold">Nombre:</span>
                <span className="w-full">{order.customerName}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold">Whatsapp:</span>
                <span>{order.customerWhatsapp}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Estado</h2>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-white py-3 text-center">
                {order.stateName ?? 'Sin estado'}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Metodo de pago</h2>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-white py-3 text-center">
                {order.paymentMethod}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Fecha de entrega</h2>
            <div className="grid gap-4 rounded-2xl bg-white p-5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Entrega estimada</span>
                <span>{order.deliveryLabel}</span>
              </div>
              {order.actualDeliveryLabel ? (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Entrega real</span>
                  <span>{order.actualDeliveryLabel}</span>
                </div>
              ) : null}
              {order.notes ? (
                <div className="grid gap-2">
                  <span className="text-neutral-500">Notas</span>
                  <p>{order.notes}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ),
      productsContent: (
        <div className="grid gap-3 rounded-2xl bg-white p-5">
          <h3 className="text-lg font-semibold">Productos</h3>
          {orderLines.length > 0 ? (
            orderLines.map((line) => (
              <div
                key={line.id}
                className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{line.productName}</p>
                  <p className="text-sm text-neutral-500">Cantidad: {line.quantity}</p>
                </div>
                <span>{line.subtotalLabel}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500">La orden no tiene lineas cargadas.</p>
          )}
        </div>
      ),
    };
  })();

  return (
    <div className="grid h-full min-h-0 grid-cols-2 gap-5 p-5">
      <div className="flex min-h-0 flex-col gap-10 overflow-hidden">
        {detailContent}

        <div className="grid gap-2 md:grid-cols-3">
          <button
            type="button"
            className="h-full max-h-15 rounded-xl bg-white py-3 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!order || isCancelling}
            onClick={() => {
              setMode('editar');
            }}
          >
            Editar pedido
          </button>
          <button
            type="button"
            disabled={!order || isCancelling || statesResource.loading}
            onClick={() => {
              void handleCancelOrder();
            }}
            className="h-full max-h-15 rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isCancelling ? 'Cancelando...' : 'Cancelar orden'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('default');
            }}
            className="h-full max-h-15 rounded-xl bg-white py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto">{productsContent}</div>
    </div>
  );
};

export default ViewOrder;
