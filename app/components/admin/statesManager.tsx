'use client'

import CrudManager from '@/app/components/admin/crudManager';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import {
  createState,
  deleteState,
  getApiErrorMessage,
  listStates,
  updateState,
} from '@/app/services/adminServices';
import type { CrudFormValues, State } from '@/types';

function parseBoolean(value: string) {
  return value === 'true';
}

export default function StatesManager() {
  const { error, items, loading, refresh } = useCrudResource(
    listStates,
    'No se pudieron cargar los estados.',
  );

  const handleCreate = async (values: CrudFormValues) => {
    try {
      await createState({
        nombre: values.nombre.trim(),
        es_final: parseBoolean(values.es_final),
      });
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo crear el estado.'));
    }
  };

  const handleUpdate = async (id: number, values: CrudFormValues) => {
    try {
      await updateState(id, {
        nombre: values.nombre.trim(),
        es_final: parseBoolean(values.es_final),
      });
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo actualizar el estado.'));
    }
  };

  const handleDelete = async (state: State) => {
    try {
      await deleteState(state.id);
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo eliminar el estado.'));
    }
  };

  return (
    <CrudManager
      title="Estado"
      loading={loading}
      error={error}
      items={items}
      emptyMessage="Todavia no hay estados registrados."
      fields={[
        { label: 'Nombre', name: 'nombre', placeholder: 'Ej. Pendiente', required: true },
        {
          label: 'Es final',
          name: 'es_final',
          type: 'select',
          required: true,
          options: [
            { label: 'No', value: 'false' },
            { label: 'Si', value: 'true' },
          ],
        },
      ]}
      columns={[
        { header: 'ID', render: (item) => item.id },
        { header: 'Nombre', render: (item) => item.nombre },
        { header: 'Final', render: (item) => (item.es_final ? 'Si' : 'No') },
      ]}
      getItemId={(item) => item.id}
      getItemLabel={(item) => item.nombre}
      getFormValues={(item) => ({
        nombre: item.nombre,
        es_final: item.es_final ? 'true' : 'false',
      })}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
