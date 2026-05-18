'use client'

import { useState } from 'react';
import ConfirmationDialog from '@/app/components/confirmationDialog';
import { useConfirmationDialog } from '@/app/hooks/useConfirmationDialog';
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
  const {
    askForConfirmation,
    closeConfirmation,
    confirm,
    confirmation,
    isConfirming,
  } = useConfirmationDialog();
  const stateIds = resolveProductionStateIds(statesResource.items);
  const canEditOrder = !!order && !!stateIds.pending && order.state === stateIds.pending;
  const actionButtonClass =
    'rounded-2xl px-5 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

  const handleCancelOrder = async () => {
    if (!order || !stateIds.cancelled) {
      setCancelError('No se encontro el estado "cancelado".');
      return;
    }

    askForConfirmation({
      confirmLabel: 'Cancelar orden',
      message: `Cancelar ${order.orderNumber}?`,
      onConfirm: async () => {
        setIsCancelling(true);
        setCancelError(null);

        try {
          await transitionOrderToState(order.id, stateIds.cancelled);
          setMode('default');
        } catch {
          setCancelError('No se pudo cancelar la orden.');
          throw new Error('No se pudo cancelar la orden.');
        } finally {
          setIsCancelling(false);
        }
      },
      title: 'Confirmar cancelacion',
      tone: 'danger',
    });
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
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {cancelError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(135deg,_#171717_0%,_#404040_100%)] text-white shadow-[0_24px_60px_-40px_rgba(0,0,0,0.45)]">
            <div className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-stone-100">
                        {order.orderNumber}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-stone-100">
                        {order.stateName ?? 'Sin estado'}
                      </span>
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                      {order.customerName}
                    </h2>
                  </div>
                </div>

                <div className="min-w-[180px] rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-stone-300">Total</p>
                  <p className="mt-2 text-2xl font-semibold">{order.totalLabel}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-stone-300">Entrega estimada</p>
                  <p className="mt-2 font-medium text-white">{order.deliveryLabel}</p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-stone-300">Pago</p>
                  <p className="mt-2 font-medium text-white">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_18px_50px_-42px_rgba(0,0,0,0.45)]">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-semibold text-neutral-950">
                  Cliente
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Nombre</p>
                  <p className="mt-1 font-medium text-neutral-900">{order.customerName}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Whatsapp</p>
                  <p className="mt-1 font-medium text-neutral-900">{order.customerWhatsapp}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ),
      productsContent: (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_-40px_rgba(0,0,0,0.28)]">
          <div className="border-b border-black/10 px-5 py-5">
            <h3 className="text-2xl font-semibold text-neutral-950">Detalle del pedido</h3>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {orderLines.length > 0 ? (
              <div className="space-y-3">
                {orderLines.map((line) => (
                  <div
                    key={line.id}
                    className="rounded-3xl border border-black/10 bg-stone-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-neutral-900">
                          {line.productName}
                        </h4>
                        <p className="mt-1 text-sm text-neutral-500">
                          Cantidad solicitada: {line.quantity}
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-700 shadow-sm">
                        {line.subtotalLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-6 text-sm text-neutral-500">
                La orden no tiene lineas cargadas.
              </div>
            )}
          </div>
        </div>
      ),
    };
  })();

  return (
    <>
      <div className="h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(135deg,_#fafaf9_0%,_#f5f5f4_48%,_#fafaf9_100%)]">
        <div className="grid h-full min-h-0 gap-6 p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="flex min-h-0 flex-col gap-6 overflow-y-auto pr-1">
            {detailContent}

            <div className={`grid gap-3 ${canEditOrder ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {canEditOrder ? (
                <button
                  type="button"
                  className={`${actionButtonClass} border border-black/10 bg-white text-neutral-900 hover:bg-stone-100`}
                  disabled={isCancelling}
                  onClick={() => {
                    setMode('editar');
                  }}
                >
                  Editar pedido
                </button>
              ) : null}
              <button
                type="button"
                disabled={!order || isCancelling || statesResource.loading}
                onClick={() => {
                  void handleCancelOrder();
                }}
                className={`${actionButtonClass} bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300`}
              >
                {isCancelling ? 'Cancelando...' : 'Cancelar orden'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('default');
                }}
                className={`${actionButtonClass} border border-black/10 bg-white text-neutral-900 hover:bg-stone-100`}
              >
                Volver
              </button>
            </div>
          </div>

          <div className="min-h-0 overflow-hidden">{productsContent}</div>
        </div>
      </div>

      <ConfirmationDialog
        cancelLabel={confirmation?.cancelLabel}
        confirmLabel={confirmation?.confirmLabel}
        isConfirming={isConfirming}
        isOpen={confirmation !== null}
        message={confirmation?.message ?? ''}
        onCancel={closeConfirmation}
        onConfirm={() => void confirm()}
        title={confirmation?.title}
        tone={confirmation?.tone}
      />
    </>
  );
};

export default ViewOrder;
