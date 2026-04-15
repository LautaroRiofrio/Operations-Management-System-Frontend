'use client'

import Image from 'next/image';
import Products from './products';
import type { OrderSectionProps } from '@/types';

const ViewOrder = ({ setMode }: OrderSectionProps) => {
  return (
    <div className="grid h-full min-h-0 grid-cols-2 gap-5 p-5">
      <div className="flex min-h-0 flex-col gap-10 overflow-hidden">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {setMode("default")} }
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancelar
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-bold">Quien?</h2>
          <div className="flex rounded-full bg-white px-5 py-2">
            <Image
              src="/profile.svg"
              alt="profile"
              width={24}
              height={24}
              className="px-2"
            />
            <span  className="w-full">Cliente Seleccionado</span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">Metodo de pago</h2>
          <div className="flex gap-2">
            {/* <button type="button" className="flex-1 rounded-xl bg-white py-3">
              Efectivo
            </button>
            <button type="button" className="flex-1 rounded-xl bg-white py-3">
              Transferencia
            </button> */}
            <button type="button" className="flex-1 rounded-xl bg-white py-3">
              Debito
            </button>
          </div>
        </div>
        
        <div className='flex'>
          <button className="flex-1 rounded-xl bg-white py-3 h-full max-h-15" onClick={() =>{setMode("editar")}}>Editar Pedido</button>
        </div>
        
        {/* <div className="min-h-0 flex-1">
          <Products />
        </div> */}
      </div>

      <div className="min-h-0"></div>
    </div>
  );
};


export default ViewOrder;
