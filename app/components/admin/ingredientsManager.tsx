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

const DEFAULT_UNIT_OPTIONS = ['g', 'kg', 'ml', 'l', 'unidad'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

function parseCostInput(value: string) {
  const normalizedValue = value.trim().replace(',', '.');

  if (normalizedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

export default function IngredientsManager() {
  const { error, items, loading, refresh } = useCrudResource(
    listIngredients,
    'No se pudieron cargar los ingredientes.',
  );
  const unitOptions = Array.from(
    new Set([
      ...DEFAULT_UNIT_OPTIONS,
      ...items
        .map((item) => item.unidad_medida.trim())
        .filter((unit) => unit.length > 0),
    ]),
  ).map((unit) => ({
    label: unit,
    value: unit,
  }));

  const handleCreate = async (values: CrudFormValues) => {
    const cost = parseCostInput(values.costo);

    if (cost === null) {
      throw new Error('Ingresa un costo valido mayor o igual a 0.');
    }

    try {
      await createIngredient({
        nombre: values.nombre.trim(),
        unidad_medida: values.unidad_medida.trim(),
        costo: cost,
      });
      await refresh();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, 'No se pudo crear el ingrediente.'));
    }
  };

  const handleUpdate = async (id: number, values: CrudFormValues) => {
    const cost = parseCostInput(values.costo);

    if (cost === null) {
      throw new Error('Ingresa un costo valido mayor o igual a 0.');
    }

    try {
      await updateIngredient(id, {
        nombre: values.nombre.trim(),
        unidad_medida: values.unidad_medida.trim(),
        costo: cost,
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
      loading={loading}
      error={error}
      items={items}
      emptyMessage="Todavia no hay ingredientes registrados."
      searchPlaceholder="Buscar ingredientes por nombre"
      searchEmptyMessage="No se encontraron ingredientes con ese nombre."
      getSearchText={(item) => item.nombre}
      fields={[
        {
          label: 'Nombre',
          name: 'nombre',
          placeholder: 'Nombre del ingrediente',
          required: true,
        },
        {
          label: 'Unidad de medida',
          name: 'unidad_medida',
          emptyOptionLabel: 'Seleccionar unidad',
          required: true,
          type: 'select',
          options: unitOptions,
        },
        {
          label: 'Costo',
          name: 'costo',
          placeholder: 'Costo del ingrediente',
          required: true,
          step: '0.01',
          type: 'number',
        },
      ]}
      columns={[
        { header: 'ID', render: (item) => item.id },
        { header: 'Nombre', render: (item) => item.nombre },
        { header: 'Unidad', render: (item) => item.unidad_medida },
        {
          header: 'Costo',
          render: (item) => (typeof item.costo === 'number' ? formatCurrency(item.costo) : '-'),
        },
      ]}
      getItemId={(item) => item.id}
      getItemLabel={(item) => item.nombre}
      getFormValues={(item) => ({
        nombre: item.nombre,
        unidad_medida: item.unidad_medida,
        costo: String(item.costo ?? ''),
      })}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
