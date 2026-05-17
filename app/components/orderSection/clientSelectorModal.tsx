'use client'

import { useState } from 'react';
import { useClientOptions } from '@/app/hooks/useClientOptions';
import type { OrderCustomerOption } from '@/types';

type ClientSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateRequest: () => void;
  onSelect: (customer: OrderCustomerOption) => void;
  selectedCustomerId: number | null;
};

export default function ClientSelectorModal({
  isOpen,
  onClose,
  onCreateRequest,
  onSelect,
  selectedCustomerId,
}: ClientSelectorModalProps) {
  const { clients, error, loading, refresh } = useClientOptions(isOpen);
  const [query, setQuery] = useState('');

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-[#fcfbf7] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-selector-title"
      >
        <div className="border-b border-black/10 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
                Recepcion
              </p>
              <h3 id="client-selector-title" className="text-2xl font-semibold text-neutral-900">
                Seleccionar cliente
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-black/20 hover:bg-neutral-50"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[28px] border border-black/10 bg-white px-4 py-3 shadow-sm transition focus-within:border-black/20">
              <span className="text-lg text-neutral-400" aria-hidden="true">
                Buscar
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o WhatsApp..."
                className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateRequest();
              }}
              className="rounded-[28px] bg-regal-gris px-5 py-3 text-sm font-semibold text-white transition hover:bg-regal-gris-hover"
            >
              Nuevo cliente
            </button>
          </div>

          <div className="mt-4 flex justify-end gap-3 text-sm">
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-neutral-500 transition hover:text-neutral-800"
              >
                Limpiar busqueda
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="rounded-[28px] border border-black/5 bg-white p-5 text-sm text-neutral-600 shadow-sm">
              Cargando clientes...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-[28px] bg-red-50 p-5 text-sm text-red-600">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="mt-3 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {!loading && !error && visibleClients.length === 0 ? (
            <div className="grid gap-4 rounded-[28px] border border-dashed border-black/10 bg-white p-6 text-sm text-neutral-600 shadow-sm">
              <div className="space-y-1">
                <p className="text-base font-semibold text-neutral-900">
                  No encontramos clientes con esa busqueda
                </p>
                <p>
                  Proba con otro nombre, otro numero de WhatsApp o carga un cliente nuevo.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateRequest();
                  }}
                  className="rounded-full bg-regal-gris px-4 py-2 text-sm font-semibold text-white transition hover:bg-regal-gris-hover"
                >
                  Crear cliente nuevo
                </button>
              </div>
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
                  className={`group rounded-[28px] border px-5 py-4 text-left transition ${
                    selectedCustomerId === client.id
                      ? 'border-regal-gris-hover bg-white shadow-sm ring-2 ring-regal-gris/10'
                      : 'border-black/10 bg-white hover:-translate-y-0.5 hover:border-black/20 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900">{client.name}</p>
                      <p className="truncate text-sm text-neutral-500">
                        WhatsApp: {client.whatsapp ?? 'Sin WhatsApp informado'}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-neutral-400 transition group-hover:text-neutral-700">
                      Seleccionar
                    </span>
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
