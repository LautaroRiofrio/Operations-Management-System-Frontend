'use client'

import { useState } from 'react';
import Order from '@/app/components/order/order';
import OrderSection from '@/app/components/orderSection/orderSection';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import { useOrdersByState } from '@/app/hooks/useOrdersByState';
import { listStates } from '@/app/services/adminServices';
import type { OrderMode } from '@/types';

const DEFAULT_NEW_ORDER_STATE_ID = 1;

export default function ReceptionSection() {
  const [mode, setMode] = useState<OrderMode>('default');
  const statesResource = useCrudResource(listStates, 'No se pudieron cargar los estados.');
  const states = statesResource.items.filter((state) => !state.es_final);
  const initialStateId = states[0]?.id ?? null;
  const [selectedStateOverride, setSelectedStateOverride] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const resolvedSelectedState = selectedStateOverride ?? initialStateId ?? 0;
  const { orders, loading, error } = useOrdersByState(resolvedSelectedState);

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setMode('ver');
  };

  return (
    <div className="grid h-full w-full min-h-0 grid-cols-[40%_60%] ">
      <section className="min-h-0 h-full border-r border-black/10 bg-white">
        <div className="flex min-h-0 flex-col gap-5 p-5">
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-blue-200 px-5 py-2">
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Buscar..."
              />
            </div>
            <button className="bg-gray-200 px-3">filtro</button>
          </div>

          <div className="flex gap-2 rounded-lg bg-gray-200 px-5 py-2">
            {statesResource.loading && states.length === 0 ? (
              <div className="text-sm text-neutral-600">Cargando estados...</div>
            ) : null}

            {statesResource.error ? (
              <div className="text-sm text-red-600">{statesResource.error}</div>
            ) : null}

            {!statesResource.loading && !statesResource.error
              ? states.map((state) => (
                  <button
                    key={state.id}
                    type="button"
                    className={`flex-1 rounded-sm p-1 transition-colors ${
                      resolvedSelectedState === state.id
                        ? 'bg-regal-gris-hover text-white'
                        : 'bg-regal-gris hover:bg-regal-gris-hover hover:text-white'
                    }`}
                    onClick={() => {
                      setSelectedStateOverride(state.id);
                      setSelectedOrderId(null);
                      setMode('default');
                    }}
                  >
                    {state.nombre}
                  </button>
                ))
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

            {!loading && !error && orders.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 pb-20">
                {orders.map((order) => (
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
