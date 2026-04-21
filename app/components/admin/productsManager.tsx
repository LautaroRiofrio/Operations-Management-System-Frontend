'use client'

import CrudManager from '@/app/components/admin/crudManager';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import {
  createProduct,
  deleteProduct,
  getApiErrorMessage,
  listCategories,
  listProducts,
  updateProduct,
} from '@/app/services/adminServices';
import type { Category, CrudFormValues, ProductExpanded } from '@/types';

export default function ProductsManager() {
  const productsResource = useCrudResource(listProducts, 'No se pudieron cargar los productos.');
  const categoriesResource = useCrudResource(
    listCategories,
    'No se pudieron cargar las categorias para el formulario.',
  );

  const handleCreate = async (values: CrudFormValues) => {
    try {
      await createProduct({
        nombre: values.nombre.trim(),
        id_categoria: Number(values.id_categoria),
        precio: values.precio ? Number(values.precio) : undefined,
      });
      await productsResource.refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo crear el producto.'));
    }
  };

  const handleUpdate = async (id: number, values: CrudFormValues) => {
    try {
      await updateProduct(id, {
        nombre: values.nombre.trim(),
        id_categoria: Number(values.id_categoria),
        precio: values.precio ? Number(values.precio) : undefined,
      });
      await productsResource.refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo actualizar el producto.'));
    }
  };

  const handleDelete = async (product: ProductExpanded) => {
    try {
      await deleteProduct(product.id);
      await productsResource.refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo eliminar el producto.'));
    }
  };

  const categories = categoriesResource.items as Category[];

  return (
    <CrudManager
      title="Producto"
      subtitle="ABM conectado a la API"
      loading={productsResource.loading || categoriesResource.loading}
      error={productsResource.error ?? categoriesResource.error}
      items={productsResource.items}
      emptyMessage="Todavia no hay productos registrados."
      fields={[
        { label: 'Nombre', name: 'nombre', placeholder: 'Ej. Torta de vainilla', required: true },
        {
          label: 'Categoria',
          name: 'id_categoria',
          type: 'select',
          required: true,
          options: categories.map((category) => ({
            label: category.nombre,
            value: String(category.id),
          })),
        },
        {
          label: 'Precio',
          name: 'precio',
          type: 'number',
          step: '0.01',
          placeholder: 'Ej. 12000',
        },
      ]}
      columns={[
        { header: 'ID', render: (item) => item.id },
        { header: 'Nombre', render: (item) => item.nombre },
        {
          header: 'Categoria',
          render: (item) => item.categoria?.nombre ?? `#${item.id_categoria}`,
        },
        {
          header: 'Precio',
          render: (item) =>
            typeof item.precio === 'number' ? `$${item.precio.toFixed(2)}` : '-',
        },
      ]}
      getItemId={(item) => item.id}
      getItemLabel={(item) => item.nombre}
      getFormValues={(item) => ({
        nombre: item.nombre,
        id_categoria: String(item.id_categoria),
        precio: String(item.precio ?? ''),
      })}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
