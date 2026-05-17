'use client'

import { useState } from 'react';
import { getApiErrorMessage } from '@/app/services/adminServices';
import { createClientOption } from '@/app/services/orderFormServices';
import type { OrderCustomerOption } from '@/types';

type CreateClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: OrderCustomerOption) => void;
};

export default function CreateClientModal({
  isOpen,
  onClose,
  onCreated,
}: CreateClientModalProps) {
  const [newClientName, setNewClientName] = useState('');
  const [newClientWhatsapp, setNewClientWhatsapp] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setNewClientName('');
    setNewClientWhatsapp('');
    setCreateError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateClient = async () => {
    const normalizedName = newClientName.trim();
    const normalizedWhatsapp = newClientWhatsapp.trim();

    if (!normalizedName) {
      setCreateError('Ingresa el nombre del cliente.');
      return;
    }

    if (!normalizedWhatsapp) {
      setCreateError('Ingresa el WhatsApp del cliente.');
      return;
    }

    if (!/^\d+$/.test(normalizedWhatsapp)) {
      setCreateError('El WhatsApp debe contener solo numeros.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const createdClient = await createClientOption({
        name: normalizedName,
        whatsapp: normalizedWhatsapp,
      });

      resetForm();
      onCreated(createdClient);
      onClose();
    } catch (requestError) {
      setCreateError(
        getApiErrorMessage(requestError, 'No se pudo crear el cliente.'),
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-client-title"
      >
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h3 id="create-client-title" className="text-xl font-semibold text-neutral-900">
              Crear cliente
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="grid gap-3 px-6 py-4">
          <input
            type="text"
            value={newClientName}
            onChange={(event) => setNewClientName(event.target.value)}
            placeholder="Nombre del cliente"
            className="rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
          />
          <input
            type="text"
            value={newClientWhatsapp}
            onChange={(event) => setNewClientWhatsapp(event.target.value)}
            placeholder="WhatsApp"
            className="rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
          />

          {createError ? (
            <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{createError}</div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleCreateClient()}
              disabled={creating}
              className="rounded-2xl bg-regal-gris px-4 py-3 text-sm font-medium text-white transition hover:bg-regal-gris-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear cliente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
