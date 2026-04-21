'use client'

import { useState } from 'react';
import type { CrudFormValues } from '@/types';

type SelectOption = {
  label: string;
  value: string;
};

type CrudField = {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  type?: 'number' | 'select' | 'text';
  options?: SelectOption[];
};

type CrudColumn<TItem> = {
  className?: string;
  header: string;
  render: (item: TItem) => string | number | null | undefined;
};

type CrudManagerProps<TItem> = {
  columns: CrudColumn<TItem>[];
  emptyMessage: string;
  error: string | null;
  fields: CrudField[];
  getFormValues: (item: TItem) => CrudFormValues;
  getItemId: (item: TItem) => number;
  getItemLabel: (item: TItem) => string;
  items: TItem[];
  loading: boolean;
  onCreate: (values: CrudFormValues) => Promise<void>;
  onDelete: (item: TItem) => Promise<void>;
  onUpdate: (id: number, values: CrudFormValues) => Promise<void>;
  subtitle: string;
  title: string;
};

function buildEmptyValues(fields: CrudField[]) {
  return fields.reduce<CrudFormValues>((accumulator, field) => {
    accumulator[field.name] = '';
    return accumulator;
  }, {});
}

export default function CrudManager<TItem>({
  columns,
  emptyMessage,
  error,
  fields,
  getFormValues,
  getItemId,
  getItemLabel,
  items,
  loading,
  onCreate,
  onDelete,
  onUpdate,
  subtitle,
  title,
}: CrudManagerProps<TItem>) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<CrudFormValues>(() => buildEmptyValues(fields));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setFormValues(buildEmptyValues(fields));
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editingId === null) {
        await onCreate(formValues);
      } else {
        await onUpdate(editingId, formValues);
      }

      resetForm();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'No se pudo guardar el registro.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: TItem) => {
    setEditingId(getItemId(item));
    setFormValues(getFormValues(item));
    setSubmitError(null);
  };

  const handleDelete = async (item: TItem) => {
    const itemId = getItemId(item);
    const shouldDelete = window.confirm(`Eliminar "${getItemLabel(item)}"?`);

    if (!shouldDelete) {
      return;
    }

    setDeletingId(itemId);
    setSubmitError(null);

    try {
      await onDelete(item);
      if (editingId === itemId) {
        resetForm();
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'No se pudo eliminar el registro.';
      setSubmitError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 px-5 py-4">
          <p className="text-sm text-neutral-500">{subtitle}</p>
          <h2 className="text-2xl font-semibold text-neutral-900">
            {editingId === null ? `Nueva ${title.toLowerCase()}` : `Editar ${title.toLowerCase()}`}
          </h2>
        </div>

        <form className="flex h-full flex-col gap-4 p-5" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <label key={field.name} className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              {field.label}
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-black"
                  value={formValues[field.name] ?? ''}
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      [field.name]: event.target.value,
                    }))
                  }
                >
                  <option value="">Seleccionar...</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required={field.required}
                  type={field.type ?? 'text'}
                  step={field.step}
                  placeholder={field.placeholder}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-black"
                  value={formValues[field.name] ?? ''}
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              )}
            </label>
          ))}

          {submitError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>
          ) : null}

          <div className="mt-auto flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {isSubmitting ? 'Guardando...' : editingId === null ? 'Crear' : 'Actualizar'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="min-h-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 px-5 py-4">
          <p className="text-sm text-neutral-500">{subtitle}</p>
          <h2 className="text-2xl font-semibold text-neutral-900">Listado</h2>
        </div>

        <div className="min-h-0 overflow-auto">
          {loading ? (
            <div className="p-5 text-sm text-neutral-600">Cargando datos...</div>
          ) : null}

          {error ? <div className="p-5 text-sm text-red-600">{error}</div> : null}

          {!loading && !error && items.length === 0 ? (
            <div className="p-5 text-sm text-neutral-600">{emptyMessage}</div>
          ) : null}

          {!loading && !error && items.length > 0 ? (
            <table className="min-w-full divide-y divide-black/10 text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.header} className="px-5 py-3 font-medium">
                      {column.header}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {items.map((item) => {
                  const itemId = getItemId(item);

                  return (
                    <tr key={itemId} className="align-top">
                      {columns.map((column) => (
                        <td key={`${itemId}-${column.header}`} className={`px-5 py-4 ${column.className ?? ''}`}>
                          {column.render(item) ?? '-'}
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-300"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === itemId}
                            onClick={() => void handleDelete(item)}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                          >
                            {deletingId === itemId ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      </section>
    </div>
  );
}
