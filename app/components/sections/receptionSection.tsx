'use client'

import { useDeferredValue, useState } from 'react';
import Order from '@/app/components/order/order';
import OrderSection from '@/app/components/orderSection/orderSection';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import { useOrdersByState } from '@/app/hooks/useOrdersByState';
import { listStates } from '@/app/services/adminServices';
import type { OrderMode } from '@/types';

const DEFAULT_NEW_ORDER_STATE_ID = 1;

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function ReceptionSection() {
  const [mode, setMode] = useState<OrderMode>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const statesResource = useCrudResource(listStates, 'No se pudieron cargar los estados.');
  const states = statesResource.items.filter((state) => !state.es_final);
  const initialStateId = states[0]?.id ?? null;
  const [selectedStateOverride, setSelectedStateOverride] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const resolvedSelectedState = selectedStateOverride ?? initialStateId ?? 0;
  const { orders, loading, error } = useOrdersByState(resolvedSelectedState);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = normalizeSearchText(deferredSearchQuery);
  const visibleOrders = orders.filter((order) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const searchableText = normalizeSearchText([
      order.orderNumber,
      order.customerName,
    ].join(' '));

    return searchableText.includes(normalizedSearchQuery);
  });

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setMode('ver');
  };

  return (
    <div className="grid h-full w-full min-h-0 grid-cols-[40%_60%] ">
      <section className="min-h-0 h-full overflow-hidden border-r border-black/10 bg-white">
        <div className="flex h-full min-h-0 flex-col gap-5 p-5">
          <div className="rounded-xl border border-black/10 bg-neutral-100 px-4 py-3 transition-colors focus-within:border-black/20 focus-within:bg-white">
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-400">Buscar</span>
              <input
                className="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
                placeholder="Buscar por cliente o numero de orden..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl bg-neutral-100 p-2">
            {statesResource.loading && states.length === 0 ? (
              <div className="text-sm text-neutral-600">Cargando estados...</div>
            ) : null}

            {statesResource.error ? (
              <div className="text-sm text-red-600">{statesResource.error}</div>
            ) : null}

            {!statesResource.loading && !statesResource.error
              ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                  {states.map((state) => (
                    <button
                      key={state.id}
                      type="button"
                      className={`rounded-lg px-4 py-2 text-center text-sm transition-colors ${
                        resolvedSelectedState === state.id
                          ? 'bg-regal-gris-hover text-white'
                          : 'bg-white text-neutral-700 hover:bg-regal-gris hover:text-black'
                      }`}
                      onClick={() => {
                        setSelectedStateOverride(state.id);
                        setSelectedOrderId(null);
                        setMode('default');
                      }}
                    >
                      {state.nombre}
                    </button>
                  ))}
                </div>
              )
              : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="rounded-xl bg-neutral-100 p-4 text-sm text-neutral-600">
                Cargando ordenes...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {!loading && !error && orders.length === 0 ? (
              <div className="rounded-xl bg-neutral-100 p-4 text-sm text-neutral-600">
                No hay ordenes para este estado.
              </div>
            ) : null}

            {!loading && !error && orders.length > 0 && visibleOrders.length === 0 ? (
              <div className="rounded-xl bg-neutral-100 p-4 text-sm text-neutral-600">
                No se encontraron ordenes para la busqueda actual.
              </div>
            ) : null}

            {!loading && !error && visibleOrders.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 pb-20">
                {visibleOrders.map((order) => (
                  <Order
                    key={order.id}
                    order={order}
                    isSelected={selectedOrderId === order.id}
                    onSelect={handleSelectOrder}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <OrderSection
        defaultStateId={DEFAULT_NEW_ORDER_STATE_ID}
        mode={mode}
        selectedOrderId={selectedOrderId}
        setMode={setMode}
      />
    </div>
  );
}
