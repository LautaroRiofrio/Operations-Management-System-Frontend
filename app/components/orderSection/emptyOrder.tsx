'use client'

import type { OrderSectionProps } from '@/types';

const EmptyOrder = ({ setMode }: OrderSectionProps) => {
  return (
    <div className="flex w-full h-full items-center justify-center p-6 border">
      <button
        type="button"
        onClick={() => {setMode("crear")}}
        className="rounded-xl bg-regal-gris px-6 py-3 text-white transition-colors hover:bg-regal-gris-hover"
      >
        Registrar pedido
      </button>
    </div>
  );
};

export default EmptyOrder;
