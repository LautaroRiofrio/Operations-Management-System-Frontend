'use client'

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmationDialog from '@/app/components/confirmationDialog';
import { useConfirmationDialog } from '@/app/hooks/useConfirmationDialog';
import { useDeliveryBoard } from '@/app/hooks/useDeliveryBoard';

export default function DeliverySection() {
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const {
    activeAction,
    activeOrderId,
    banner,
    cancelOrder,
    deliverOrder,
    detailError,
    detailLoading,
    hasStateConfigError,
    order,
    readyOrders,
    readyOrdersError,
    readyOrdersLoading,
    selectedOrderId,
    selectedOrderListItem,
    setSelectedOrderId,
    statesLoading,
  } = useDeliveryBoard();

  const isBusy = readyOrdersLoading || statesLoading;
  const currentProducts = order?.lines ?? [];
  const currentOrderIsDelivering =
    selectedOrderListItem && activeOrderId === selectedOrderListItem.id && activeAction === 'deliver';
  const currentOrderIsCancelling =
    selectedOrderListItem && activeOrderId === selectedOrderListItem.id && activeAction === 'cancel';
  const {
    askForConfirmation,
    closeConfirmation,
    confirm,
    confirmation,
    isConfirming,
  } = useConfirmationDialog();

  const detailPanel = (
    <section className="flex min-h-0 flex-col rounded-[32px] border border-black/10 bg-white/90 p-4 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.24)] sm:p-6 lg:overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Detalle</h2>
          {order ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {order.orderNumber}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {order.stateName ?? 'Listo'}
              </span>
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="space-y-1">
          </div>
        </div>

        {selectedOrderListItem !== null ? (
          <button
            type="button"
            onClick={() => setSelectedOrderId(null)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-stone-100 lg:hidden"
          >
            Cerrar
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {banner ? (
          <motion.div
            key={banner.text}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              banner.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {banner.text}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {hasStateConfigError ? (
        <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Faltan estados operativos configurados. La vista necesita reconocer `listo`,
          `entregado` y `cancelado` por nombre para funcionar.
        </div>
      ) : null}

      {selectedOrderListItem === null && !readyOrdersLoading ? (
        <div className="mt-6 flex min-h-[320px] flex-1 items-center justify-center rounded-[28px] border border-dashed border-black/10 bg-stone-50/80 p-8 text-center">
          <div className="max-w-md space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
              <span className="text-2xl">+</span>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900">
              Selecciona un pedido listo
            </h3>
            <p className="text-sm leading-6 text-neutral-500">
              Al abrir una orden vas a poder inspeccionar sus datos, revisar sus lineas y
              cerrarla como entregada o cancelada.
            </p>
          </div>
        </div>
      ) : null}

      {selectedOrderListItem !== null ? (
        <div className="mt-6 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col gap-5">
            <div className="rounded-[28px] border border-black/10 bg-stone-50 p-5">
              {detailLoading ? (
                <div className="space-y-3">
                  <div className="h-5 w-28 animate-pulse rounded-full bg-neutral-200" />
                  <div className="h-24 animate-pulse rounded-3xl bg-white" />
                </div>
              ) : detailError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {detailError}
                </div>
              ) : order ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="mt-4 text-2xl font-semibold text-neutral-950">
                      {order.customerName}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">{order.deliveryLabel}</p>
                  </div>

                  <div className="grid gap-2.5">
                    <div className="rounded-2xl bg-white px-4 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Whatsapp</p>
                      <p className="mt-1 font-medium text-neutral-900">{order.customerWhatsapp}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Pago</p>
                      <p className="mt-1 font-medium text-neutral-900">{order.paymentMethod}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Total</p>
                      <p className="mt-1 font-medium text-neutral-900">{order.totalLabel}</p>
                    </div>
                  </div>

                  {order.notes ? (
                    <div className="rounded-2xl bg-white px-4 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Notas</p>
                      <p className="mt-2 text-sm leading-6 text-neutral-700">{order.notes}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">No se pudo cargar la orden.</div>
              )}
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white lg:hidden">
              <button
                type="button"
                onClick={() => setIsProductsOpen((currentValue) => !currentValue)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <h3 className="text-lg font-semibold text-neutral-950">Productos</h3>
                <span className="text-xl leading-none text-neutral-500">
                  {isProductsOpen ? '−' : '+'}
                </span>
              </button>

              {isProductsOpen ? (
                <div className="border-t border-black/10 p-5">
                  {detailLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-24 animate-pulse rounded-3xl bg-stone-100" />
                      ))}
                    </div>
                  ) : detailError ? (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {detailError}
                    </div>
                  ) : currentProducts.length > 0 ? (
                    <div className="space-y-3">
                      {currentProducts.map((line) => (
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
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!selectedOrderListItem || detailLoading || !!detailError || !!currentOrderIsCancelling}
                onClick={() => {
                  if (!selectedOrderListItem) {
                    return;
                  }

                  askForConfirmation({
                    confirmLabel: 'Marcar como entregado',
                    message: `Marcar ${selectedOrderListItem.orderNumber} como entregado?`,
                    onConfirm: async () => {
                      await deliverOrder(selectedOrderListItem);
                    },
                    title: 'Confirmar entrega',
                  });
                }}
                className="rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {currentOrderIsDelivering ? 'Marcando entrega...' : 'Marcar como entregado'}
              </button>

              <button
                type="button"
                disabled={!selectedOrderListItem || detailLoading || !!detailError || !!currentOrderIsDelivering}
                onClick={() => {
                  if (!selectedOrderListItem) {
                    return;
                  }

                  askForConfirmation({
                    confirmLabel: 'Cancelar orden',
                    message: `Cancelar ${selectedOrderListItem.orderNumber}?`,
                    onConfirm: async () => {
                      await cancelOrder(selectedOrderListItem);
                    },
                    title: 'Confirmar cancelacion',
                    tone: 'danger',
                  });
                }}
                className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {currentOrderIsCancelling ? 'Cancelando...' : 'Cancelar orden'}
              </button>
            </div>
          </div>

          <div className="hidden min-h-0 rounded-[28px] border border-black/10 bg-white lg:block lg:overflow-hidden">
            <div className="border-b border-black/10 px-5 py-4">
              <h3 className="text-lg font-semibold text-neutral-950">Detalle de productos</h3>
            </div>

            <div className="min-h-0 max-h-full p-5 lg:overflow-y-auto">
              {detailLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-3xl bg-stone-100" />
                  ))}
                </div>
              ) : detailError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {detailError}
                </div>
              ) : currentProducts.length > 0 ? (
                <div className="space-y-3">
                  {currentProducts.map((line) => (
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
        </div>
      ) : null}
    </section>
  );

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_30%),linear-gradient(135deg,_#fafaf9_0%,_#f5f5f4_45%,_#fafaf9_100%)] lg:h-full lg:overflow-hidden">
      <div className="grid min-h-full gap-6 p-4 sm:p-6 lg:h-full lg:min-h-0 xl:grid-cols-[minmax(0,40%)_minmax(0,60%)]">
        <aside className="flex min-h-0 flex-col rounded-[32px] border border-black/10 bg-neutral-950 text-white shadow-[0_24px_80px_-36px_rgba(0,0,0,0.55)] lg:overflow-hidden">
          <div className="border-b border-white/10 px-5 py-5">
            <h1 className="text-2xl font-semibold">Despacho</h1>
          </div>

          <div className="min-h-0 flex-1 px-4 py-4 lg:overflow-y-auto">
            {isBusy && readyOrders.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-3xl bg-white/8" />
                ))}
              </div>
            ) : null}

            {!isBusy && !readyOrdersError && readyOrders.length === 0 ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/5 p-6 text-center">
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl">
                    0
                  </div>
                  <h2 className="text-lg font-semibold">No hay pedidos listos</h2>
                  <p className="text-sm leading-6 text-neutral-400">
                    Los pedidos que terminen Produccion apareceran aca para su entrega final.
                  </p>
                </div>
              </div>
            ) : null}

            {readyOrdersError ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {readyOrdersError}
              </div>
            ) : null}

            <div className="grid gap-3 2xl:grid-cols-2">
              <AnimatePresence initial={false}>
                {readyOrders.map((readyOrder) => {
                  const isSelected = readyOrder.id === selectedOrderId;
                  const isWorking = activeOrderId === readyOrder.id;

                  return (
                    <motion.button
                      key={readyOrder.id}
                      type="button"
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      onClick={() => setSelectedOrderId(readyOrder.id)}
                      className={`w-full rounded-[28px] border p-4 text-left transition ${
                        isSelected
                          ? 'border-white/30 bg-white/12'
                          : 'border-white/10 bg-white/6 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-200">
                            {readyOrder.orderNumber}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold">{readyOrder.customerName}</h3>
                            <p className="mt-1 text-sm text-neutral-300">{readyOrder.deliveryLabel}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide text-neutral-500">Total</p>
                          <p className="mt-1 font-medium text-neutral-100">{readyOrder.totalLabel}</p>
                        </div>
                      </div>

                      {isWorking ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <span className="text-sm text-neutral-300">Procesando cierre...</span>
                        </div>
                      ) : null}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        <div className="hidden lg:flex">{detailPanel}</div>
      </div>

      {selectedOrderListItem !== null ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/45 p-0 lg:hidden">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] bg-[#fcfbf7] p-4 shadow-2xl sm:p-5">
            {detailPanel}
          </div>
        </div>
      ) : null}

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
    </div>
  );
}
