'use client'

import ConfirmationDialog from '@/app/components/confirmationDialog';
import { useConfirmationDialog } from '@/app/hooks/useConfirmationDialog';
import { useProductionBoard } from '@/app/hooks/useProductionBoard';

function buildLineKey(orderId: number, lineId: number) {
  return `${orderId}:${lineId}`;
}

export default function ProductionSection() {
  const {
    activeAction,
    activeOrderId,
    banner,
    boardError,
    cancelOrder,
    completeOrder,
    expandedLines,
    hasStateConfigError,
    incrementProduct,
    isLoadingBoard,
    isOrderComplete,
    pendingOrders,
    producedByLine,
    productionOrders,
    startOrder,
    toggleLine,
  } = useProductionBoard();

  const currentOrder = productionOrders[0] ?? null;
  const totalOrdersInProduction = productionOrders.length;
  const totalProductsInProgress = currentOrder?.products.length ?? 0;
  const {
    askForConfirmation,
    closeConfirmation,
    confirm,
    confirmation,
    isConfirming,
  } = useConfirmationDialog();

  return (
    <div className="h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_32%),linear-gradient(135deg,_#fafaf9_0%,_#f5f5f4_45%,_#fafaf9_100%)]">
      <div className="grid h-full min-h-0 gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Estacion de produccion
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
                Preparacion en tiempo real
              </h1>
            </div>

            <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-stone-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Pendientes
                </p>
                <p className="mt-2 text-3xl font-semibold text-neutral-950">{pendingOrders.length}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-stone-100 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  En produccion
                </p>
                <p className="mt-2 text-3xl font-semibold text-neutral-950">{totalOrdersInProduction}</p>
              </div>
            </div>
          </div>

          {banner ? (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                banner.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {banner.text}
            </div>
          ) : null}

          {hasStateConfigError ? (
            <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              Faltan estados operativos configurados. La vista necesita reconocer
              {' '}`pendiente`, `en produccion`, `listo` y `cancelado` por nombre para funcionar.
            </div>
          ) : null}

          {boardError ? (
            <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {boardError}
            </div>
          ) : null}

          {isLoadingBoard && productionOrders.length === 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 rounded-[28px] border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : null}

          {!isLoadingBoard && !boardError && productionOrders.length === 0 ? (
            <div className="mt-6 flex min-h-[280px] flex-1 items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
              <div className="max-w-md space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <span className="text-2xl">+</span>
                  </div>
                <h2 className="text-xl font-semibold text-neutral-900">No hay pedidos en produccion</h2>
                <p className="text-sm leading-6 text-neutral-500">
                  Selecciona un pedido de la columna lateral para empezar a trabajarlo. Cuando lo
                  pases a produccion aparecera aca con su avance y sus ingredientes.
                </p>
              </div>
            </div>
          ) : null}

          {currentOrder ? (
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="grid gap-5">
                {(() => {
                  const order = currentOrder;
                  const completedProducts = order.products.filter((product) => {
                    const lineKey = buildLineKey(order.id, product.id);
                    return (producedByLine[lineKey] ?? 0) >= product.quantityRequired;
                  }).length;
                  const orderProgress =
                    order.products.length === 0
                      ? 0
                      : Math.round((completedProducts / order.products.length) * 100);
                  const isCompleting = activeOrderId === order.id && activeAction === 'complete';
                  const isCancelling = activeOrderId === order.id && activeAction === 'cancel';

                  return (
                    <article
                      key={order.id}
                      className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)]"
                    >
                        <div className="border-b border-black/10 bg-[linear-gradient(135deg,_#171717_0%,_#404040_100%)] px-6 py-5 text-white">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-100">
                                  {order.orderNumber}
                                </span>
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-stone-100">
                                  En produccion
                                </span>
                              </div>
                              <div>
                                <h2 className="text-2xl font-semibold">{order.customerName}</h2>
                                <p className="mt-1 text-sm text-stone-300">
                                  Entrega {order.deliveryLabel}
                                </p>
                              </div>
                            </div>

                            <div className="min-w-[180px] rounded-2xl bg-white/10 px-4 py-3">
                              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-stone-300">
                                <span>Avance</span>
                                <span>{orderProgress}%</span>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-amber-400"
                                  style={{ width: `${orderProgress}%` }}
                                />
                              </div>
                              <p className="mt-3 text-sm text-stone-200">
                                {completedProducts} de {order.products.length} productos completos
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 px-6 py-5">
                          {order.products.map((product) => {
                            const lineKey = buildLineKey(order.id, product.id);
                            const producedQuantity = producedByLine[lineKey] ?? 0;
                            const lineComplete = producedQuantity >= product.quantityRequired;
                            const detailsOpen = expandedLines[lineKey] ?? false;

                            return (
                              <div
                                key={lineKey}
                                className={`rounded-3xl border px-4 py-4 transition ${
                                  lineComplete
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-black/10 bg-stone-50/80'
                                }`}
                              >
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <h3 className="text-lg font-semibold text-neutral-900">
                                        {product.productName}
                                      </h3>
                                      {lineComplete ? (
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                          Completo
                                        </span>
                                      ) : (
                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                                          En proceso
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm text-neutral-500">
                                      {producedQuantity} / {product.quantityRequired} unidades
                                      preparadas
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        incrementProduct(order.id, product.id, product.quantityRequired)
                                      }
                                      disabled={lineComplete}
                                      className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl bg-slate-900 px-4 text-xl font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                      +
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleLine(order.id, product.id)}
                                      aria-expanded={detailsOpen}
                                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-black/20 hover:bg-stone-100"
                                    >
                                      {detailsOpen
                                        ? 'Ocultar receta'
                                        : `Ver receta${product.ingredients.length > 0 ? ` (${product.ingredients.length})` : ''}`}
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                                  <div
                                    className={`h-full rounded-full ${
                                      lineComplete ? 'bg-emerald-500' : 'bg-neutral-900'
                                    }`}
                                    style={{
                                      width: `${Math.round(
                                        (producedQuantity / Math.max(product.quantityRequired, 1)) * 100,
                                      )}%`,
                                    }}
                                  />
                                </div>

                                {detailsOpen ? (
                                  <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-3">
                                      <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
                                          Ingredientes
                                        </h4>
                                      </div>
                                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-neutral-600">
                                        {product.ingredients.length}{' '}
                                        {product.ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}
                                      </span>
                                    </div>

                                    {product.ingredients.length > 0 ? (
                                      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-stone-200 bg-stone-100/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                          <span>Ingrediente</span>
                                          <span>Cantidad</span>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto">
                                          {product.ingredients.map((ingredient, index) => (
                                            <div
                                              key={ingredient.id}
                                              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-stone-200 px-4 py-3 last:border-b-0"
                                            >
                                              <div className="flex min-w-0 items-center gap-3">
                                                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-500 shadow-sm">
                                                  {index + 1}
                                                </span>
                                                <span className="truncate font-medium text-neutral-800">
                                                  {ingredient.name}
                                                </span>
                                              </div>
                                              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium tabular-nums text-neutral-700 shadow-sm">
                                                {ingredient.quantityLabel}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-neutral-500">
                                        Este producto todavia no tiene receta cargada.
                                      </p>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-black/10 bg-stone-50 px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{order.totalLabel}</p>
                            <p className="text-xs text-neutral-500">
                              {totalProductsInProgress} productos activos en la mesa
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                askForConfirmation({
                                  confirmLabel: 'Cancelar orden',
                                  message: `Cancelar ${order.orderNumber}?`,
                                  onConfirm: async () => {
                                    await cancelOrder(order);
                                  },
                                  title: 'Confirmar cancelacion',
                                  tone: 'danger',
                                });
                              }}
                              disabled={isCompleting || isCancelling}
                              className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                            >
                              {isCancelling ? 'Cancelando...' : 'Cancelar orden'}
                            </button>

                            {isOrderComplete(order) ? (
                              <button
                                type="button"
                                onClick={() => void completeOrder(order)}
                                disabled={isCompleting || isCancelling}
                                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                              >
                                {isCompleting ? 'Completando...' : 'Completar pedido'}
                              </button>
                            ) : (
                              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-500">
                                Completa todos los productos para habilitar el cierre
                              </div>
                            )}
                          </div>
                        </div>
                    </article>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-900 text-slate-50 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.7)]">
          <div className="border-b border-white/10 px-5 py-5">
            <h2 className="text-2xl font-semibold">Pedidos pendientes</h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {isLoadingBoard && pendingOrders.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 rounded-3xl bg-white/8"
                  />
                ))}
              </div>
            ) : null}

            {!isLoadingBoard && pendingOrders.length === 0 ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/5 p-6 text-center">
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl">
                    0
                  </div>
                  <h3 className="text-lg font-semibold">Sin pedidos pendientes</h3>
                  <p className="text-sm leading-6 text-slate-400">
                    Cuando lleguen nuevas ordenes en estado pendiente, apareceran aca.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {pendingOrders.map((order) => {
                const isStarting = activeOrderId === order.id && activeAction === 'start';

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => void startOrder(order)}
                    disabled={isStarting}
                    className="w-full rounded-[28px] border border-white/10 bg-white/6 p-4 text-left transition hover:border-amber-300/50 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <span className="inline-flex rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                          {order.orderNumber}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{order.customerName}</h3>
                          <p className="mt-1 text-sm text-slate-300">{order.deliveryLabel}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                        <p className="mt-1 font-medium text-slate-100">{order.totalLabel}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
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
    </div>
  );
}
