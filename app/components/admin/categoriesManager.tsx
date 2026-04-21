'use client'

import CrudManager from '@/app/components/admin/crudManager';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import {
  createCategory,
  deleteCategory,
  getApiErrorMessage,
  listCategories,
  updateCategory,
} from '@/app/services/adminServices';
import type { Category, CrudFormValues } from '@/types';

export default function CategoriesManager() {
  const { error, items, loading, refresh } = useCrudResource(
    listCategories,
    'No se pudieron cargar las categorias.',
  );

  const handleCreate = async (values: CrudFormValues) => {
    try {
      await createCategory({ nombre: values.nombre.trim() });
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo crear la categoria.'));
    }
  };

  const handleUpdate = async (id: number, values: CrudFormValues) => {
    try {
      await updateCategory(id, { nombre: values.nombre.trim() });
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo actualizar la categoria.'));
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      await deleteCategory(category.id);
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo eliminar la categoria.'));
    }
  };

  return (
    <CrudManager
      title="Categoria"
      subtitle="ABM conectado a la API"
      loading={loading}
      error={error}
      items={items}
      emptyMessage="Todavia no hay categorias registradas."
      fields={[
        { label: 'Nombre', name: 'nombre', placeholder: 'Ej. Tortas', required: true },
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
