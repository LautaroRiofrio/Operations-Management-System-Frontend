'use client'

import CrudManager from '@/app/components/admin/crudManager';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import {
  createStockMovementType,
  deleteStockMovementType,
  getApiErrorMessage,
  listStockMovementTypes,
  updateStockMovementType,
} from '@/app/services/adminServices';
import type { CrudFormValues, StockMovementType } from '@/types';

export default function StockMovementTypesManager() {
  const { error, items, loading, refresh } = useCrudResource(
    listStockMovementTypes,
    'No se pudieron cargar los tipos de movimiento de stock.',
  );

  const handleCreate = async (values: CrudFormValues) => {
    try {
      await createStockMovementType({ nombre: values.nombre.trim() });
      await refresh();
    } catch (requestError) {
      throw new Error(
        getApiErrorMessage(
          requestError,
          'No se pudo crear el tipo de movimiento de stock.',
        ),
      );
    }
  };

  const handleUpdate = async (id: number, values: CrudFormValues) => {
    try {
      await updateStockMovementType(id, { nombre: values.nombre.trim() });
      await refresh();
    } catch (requestError) {
      throw new Error(
        getApiErrorMessage(
          requestError,
          'No se pudo actualizar el tipo de movimiento de stock.',
        ),
      );
    }
  };

  const handleDelete = async (item: StockMovementType) => {
    try {
      await deleteStockMovementType(item.id);
      await refresh();
    } catch (requestError) {
      throw new Error(
        getApiErrorMessage(
          requestError,
          'No se pudo eliminar el tipo de movimiento de stock.',
        ),
      );
    }
  };

  return (
    <CrudManager
      title="Tipo de movimiento"
      loading={loading}
      error={error}
      items={items}
      emptyMessage="Todavia no hay tipos de movimiento registrados."
      fields={[
        { label: 'Nombre', name: 'nombre', placeholder: 'Ej. Ingreso', required: true },
      ]}
      columns={[
        { header: 'ID', render: (item) => item.id },
        { header: 'Nombre', render: (item) => item.nombre },
      ]}
      getItemId={(item) => item.id}
      getItemLabel={(item) => item.nombre}
      getFormValues={(item) => ({ nombre: item.nombre })}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
