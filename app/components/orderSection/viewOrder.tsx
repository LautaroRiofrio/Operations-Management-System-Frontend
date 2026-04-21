'use client'

import Image from 'next/image';
import type { OrderSectionProps } from '@/types';
import { useOrderDetails } from '@/app/hooks/useOrderDetails';

const ViewOrder = ({ selectedOrderId, setMode }: OrderSectionProps) => {
  const resolvedOrderId = selectedOrderId ?? null;
  const { order, loading, error } = useOrderDetails(resolvedOrderId);

  const { detailContent, productsContent } = (() => {
    if (resolvedOrderId === null) {
      return {
        detailContent: <p className="text-sm text-neutral-600">Seleccioná una orden para ver el detalle.</p>,
        productsContent: <p className="text-sm text-neutral-500">Los productos de la orden se verán acá.</p>,
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
        detailContent: <p className="text-sm text-neutral-600">No se encontró información para esta orden.</p>,
        productsContent: <p className="text-sm text-neutral-500">No hay productos para mostrar.</p>,
      };
    }

    const orderLines = Array.isArray(order.lines) ? order.lines : [];

    return {
      detailContent: (

        <div className='flex flex-col gap-5 h-full'>
          {/* order.customerId */}
          <div >
            <h2 className="text-2xl font-bold">Cliente</h2>
            <div className="flex flex-col gap-3 rounded-xl bg-white py-2 px-2 ">
              <div className='flex gap-2'>
                <span className='font-bold'>Nombre:</span><span className="w-full">{order.customerName}</span>
              </div>
              <div className='flex gap-2'>
                <span className='font-bold'>Numero de whatsap:</span><span>{order.customerWhatsapp}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Método de pago</h2>
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
                <span className="text-neutral-500">Entrega</span>
                <span>{order.deliveryLabel}</span>
              </div>
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
              <div key={line.id} className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium">{line.productName}</p>
                  <p className="text-sm text-neutral-500">Cantidad: {line.quantity}</p>
                </div>
                <span>{line.subtotalLabel}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500">La orden no tiene líneas cargadas.</p>
          )}
        </div>
      ),
    };
  })();

  return (
    <div className="grid h-full min-h-0 grid-cols-2 gap-5 p-5">
      <div className="flex flex-col h-full   justify-betreen  min-h-0 flex-col gap-10 overflow-hidden">

        {detailContent}

        <div className='flex gap-2'>
          <button
            type="button"
            className="h-full max-h-15 flex-1 rounded-xl bg-white py-3 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!order}
            onClick={() => { setMode("editar") }}
          >
            Editar Pedido
          </button>
          <button
            type="button"
            onClick={() => { setMode("default") }}
            className="h-full max-h-15 flex-1 rounded-xl bg-white py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto">
        {productsContent}
      </div>
    </div>
  );
};


export default ViewOrder;
