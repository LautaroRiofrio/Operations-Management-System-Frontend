'use client'

import CrudManager from '@/app/components/admin/crudManager';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import {
  createIngredient,
  deleteIngredient,
  getApiErrorMessage,
  listIngredients,
  updateIngredient,
} from '@/app/services/adminServices';
import type { CrudFormValues, Ingredient } from '@/types';

export default function IngredientsManager() {
  const { error, items, loading, refresh } = useCrudResource(
    listIngredients,
    'No se pudieron cargar los ingredientes.',
  );

  const handleCreate = async (values: CrudFormValues) => {
    try {
      await createIngredient({
        nombre: values.nombre.trim(),
        unidad_medida: values.unidad_medida.trim(),
      });
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo crear el ingrediente.'));
    }
  };

  const handleUpdate = async (id: number, values: CrudFormValues) => {
    try {
      await updateIngredient(id, {
        nombre: values.nombre.trim(),
        unidad_medida: values.unidad_medida.trim(),
      });
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo actualizar el ingrediente.'));
    }
  };

  const handleDelete = async (ingredient: Ingredient) => {
    try {
      await deleteIngredient(ingredient.id);
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo eliminar el ingrediente.'));
    }
  };

  return (
    <CrudManager
      title="Ingrediente"
      subtitle="ABM conectado a la API"
      loading={loading}
      error={error}
      items={items}
      emptyMessage="Todavia no hay ingredientes registrados."
      fields={[
        { label: 'Nombre', name: 'nombre', placeholder: 'Ej. Harina', required: true },
        {
          label: 'Unidad de medida',
          name: 'unidad_medida',
          placeholder: 'Ej. kg, l, unidad',
          required: true,
        },
      ]}
      columns={[
        { header: 'ID', render: (item) => item.id },
        { header: 'Nombre', render: (item) => item.nombre },
        { header: 'Unidad', render: (item) => item.unidad_medida },
      ]}
      getItemId={(item) => item.id}
      getItemLabel={(item) => item.nombre}
      getFormValues={(item) => ({
        nombre: item.nombre,
        unidad_medida: item.unidad_medida,
      })}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
