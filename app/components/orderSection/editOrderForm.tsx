'use client'

import type { OrderSectionProps } from '@/types';

const EditOrderForm = ({ setMode }: OrderSectionProps) => {
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Editar pedido</h2>
          <p className="text-sm text-neutral-600">
            Version mock para representar el flujo de edicion.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {setMode("default")}}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Cancelar
        </button>
      </div>

      <div className="grid flex-1 gap-5 rounded-2xl border border-dashed border-neutral-300 bg-white p-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-neutral-700" htmlFor="edit-client">
            Cliente
          </label>
          <input
            id="edit-client"
            type="text"
            defaultValue="Esteban"
            className="rounded-xl border border-neutral-200 px-4 py-3 outline-none"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-neutral-700" htmlFor="edit-total">
            Total
          </label>
          <input
            id="edit-total"
            type="text"
            defaultValue="$42.700"
            className="rounded-xl border border-neutral-200 px-4 py-3 outline-none"
          />
        </div>

        <div className="mt-auto flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {setMode("default")}}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Descartar cambios
          </button>
          <button
            type="button"
            className="rounded-xl bg-regal-gris px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-regal-gris-hover"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderForm;
