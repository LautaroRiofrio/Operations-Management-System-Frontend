'use client'

import { useState } from 'react';
import Order from '@/app/components/order/order';
import OrderSection from '@/app/components/orderSection/orderSection';
import { useOrdersByState } from '@/app/hooks/useOrdersByState';
import type { OrderMode } from '@/types';

const ORDER_STATES = [
  { id: 1, label: 'Pendiente' },
  { id: 2, label: 'En Produccion' },
  { id: 3, label: 'Listo' },
  { id: 4, label: 'En Camino' },
];

export default function ReceptionSection() {
  const [mode, setMode] = useState<OrderMode>('default');
  const [selectedState, setSelectedState] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { orders, loading, error } = useOrdersByState(selectedState);

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setMode('ver');
  };

  return (
    <div className="grid h-full w-full min-h-0 grid-cols-[40%_60%] overflow-hidden">
      <section className="min-h-0 overflow-hidden border-r border-black/10 bg-white">
        <div className="flex h-full min-h-0 flex-col gap-5 p-5">
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
            {ORDER_STATES.map((state) => (
              <button
                key={state.id}
                type="button"
                className={`flex-1 rounded-sm p-1 transition-colors ${
                  selectedState === state.id
                    ? 'bg-regal-gris-hover text-white'
                    : 'bg-regal-gris hover:bg-regal-gris-hover hover:text-white'
                }`}
                onClick={() => {
                  setSelectedState(state.id);
                  setSelectedOrderId(null);
                  setMode('default');
                }}
              >
                {state.label}
              </button>
            ))}
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

      <OrderSection mode={mode} selectedOrderId={selectedOrderId} setMode={setMode} />
    </div>
  );
}
