'use client'

import { useState } from 'react';
import { getApiErrorMessage } from '@/app/services/adminServices';
import { useClientOptions } from '@/app/hooks/useClientOptions';
import { createClientOption } from '@/app/services/orderFormServices';
import type { OrderCustomerOption } from '@/types';

type ClientSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: OrderCustomerOption) => void;
  selectedCustomerId: number | null;
};

export default function ClientSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedCustomerId,
}: ClientSelectorModalProps) {
  const { clients, error, loading, refresh } = useClientOptions(isOpen);
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientWhatsapp, setNewClientWhatsapp] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (!isOpen) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleClients = clients.filter((client) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      client.name.toLowerCase().includes(normalizedQuery) ||
      (client.whatsapp ?? '').toLowerCase().includes(normalizedQuery)
    );
  });

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
      await refresh();
      onSelect(createdClient);
      setIsCreating(false);
      setNewClientName('');
      setNewClientWhatsapp('');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 "
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-selector-title"
      >
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 id="client-selector-title" className="text-xl font-semibold text-neutral-900">
                Seleccionar cliente
              </h3>
              <p className="text-sm text-neutral-500">
                Elige un cliente existente o crea uno nuevo sin salir del modal.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o WhatsApp..."
              className="min-w-0 flex-1 rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
            />
            <button
              type="button"
              onClick={() => {
                setIsCreating((currentValue) => !currentValue);
                setCreateError(null);
              }}
              className="rounded-2xl bg-regal-gris px-4 py-3 text-sm font-medium text-white transition hover:bg-regal-gris-hover"
            >
              Nuevo cliente
            </button>
          </div>

          {isCreating ? (
            <div className="mt-4 grid gap-3 rounded-2xl bg-neutral-100 p-4">
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

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setCreateError(null);
                  }}
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
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
              Cargando clientes...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="mt-3 rounded-full border border-red-200 px-4 py-2 text-sm text-red-700"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {!loading && !error && visibleClients.length === 0 ? (
            <div className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
              No se encontraron clientes para la busqueda actual.
            </div>
          ) : null}

          {!loading && !error && visibleClients.length > 0 ? (
            <div className="grid gap-3">
              {visibleClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    onSelect(client);
                    onClose();
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    selectedCustomerId === client.id
                      ? 'border-regal-gris-hover bg-neutral-100'
                      : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">{client.name}</p>
                      <p className="text-sm text-neutral-500">
                        {client.whatsapp ?? 'Sin WhatsApp informado'}
                      </p>
                    </div>
                    <span className="text-sm text-neutral-400">#{client.id}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
