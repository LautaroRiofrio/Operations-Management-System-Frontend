'use client'

import { useState } from 'react';
import ConfirmationDialog from '@/app/components/confirmationDialog';
import { useConfirmationDialog } from '@/app/hooks/useConfirmationDialog';
import { useCrudResource } from '@/app/hooks/useCrudResource';
import {
  createProduct,
  createRecipe,
  deleteProduct,
  getApiErrorMessage,
  listCategories,
  listIngredients,
  listProducts,
  listRecipes,
  updateProduct,
  updateRecipe,
} from '@/app/services/adminServices';
import type {
  Category,
  Ingredient,
  ProductExpanded,
  Recipe,
} from '@/types';

type RecipeLine = {
  ingredientId: string;
  quantity: string;
};

type ProductFormValues = {
  id_categoria: string;
  nombre: string;
  precio: string;
  recipeLines: RecipeLine[];
};

function buildEmptyProductValues(): ProductFormValues {
  return {
    id_categoria: '',
    nombre: '',
    precio: '',
    recipeLines: [],
  };
}

function recipeToFormLines(recipe: Recipe | undefined): RecipeLine[] {
  if (!recipe) {
    return [];
  }

  return recipe.ingredientes.map((line) => ({
    ingredientId: String(line.id_ingrediente),
    quantity: String(line.cantidad),
  }));
}

function formatRecipeSummary(recipe: Recipe | undefined): string {
  if (!recipe || recipe.ingredientes.length === 0) {
    return '-';
  }

  return recipe.ingredientes
    .map((line) => {
      const ingredientName = line.ingrediente?.nombre ?? `Ingrediente #${line.id_ingrediente}`;
      const ingredientUnit = line.ingrediente?.unidad_medida ? ` ${line.ingrediente.unidad_medida}` : '';
      return `${ingredientName}: ${line.cantidad}${ingredientUnit}`;
    })
    .join(', ');
}

export default function ProductsManager() {
  const productsResource = useCrudResource(listProducts, 'No se pudieron cargar los productos.');
  const categoriesResource = useCrudResource(
    listCategories,
    'No se pudieron cargar las categorias para el formulario.',
  );
  const ingredientsResource = useCrudResource(
    listIngredients,
    'No se pudieron cargar los ingredientes para la receta.',
  );
  const recipesResource = useCrudResource(
    listRecipes,
    'No se pudieron cargar las recetas de productos.',
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(buildEmptyProductValues);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    askForConfirmation,
    closeConfirmation,
    confirm,
    confirmation,
    isConfirming,
  } = useConfirmationDialog();

  const categories = categoriesResource.items as Category[];
  const ingredients = ingredientsResource.items as Ingredient[];
  const recipes = recipesResource.items as Recipe[];
  const recipeByProductId = new Map(recipes.map((recipe) => [recipe.id_producto, recipe]));

  const resetForm = () => {
    setEditingId(null);
    setFormValues(buildEmptyProductValues());
    setSubmitError(null);
    setIsModalOpen(false);
  };

  const buildRecipePayload = () =>
    formValues.recipeLines.flatMap((line) => {
      const ingredientId = Number(line.ingredientId);
      const quantity = Number(line.quantity);

      if (!Number.isFinite(ingredientId) || !Number.isFinite(quantity) || quantity <= 0) {
        return [];
      }

      return [{ id_ingrediente: ingredientId, cantidad: quantity }];
    });

  const syncRecipeForProduct = async (productId: number) => {
    const ingredientsPayload = buildRecipePayload();
    const existingRecipe = recipeByProductId.get(productId);

    if (!existingRecipe && ingredientsPayload.length === 0) {
      return;
    }

    const recipe =
      existingRecipe ??
      await createRecipe({
        id_producto: productId,
      });

    await updateRecipe(recipe.id, {
      ingredientes: ingredientsPayload,
    });
  };

  const refreshAll = async () => {
    await Promise.all([productsResource.refresh(), recipesResource.refresh()]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const productPayload = {
        nombre: formValues.nombre.trim(),
        id_categoria: Number(formValues.id_categoria),
        precio: formValues.precio ? Number(formValues.precio) : undefined,
      };

      const product =
        editingId === null
          ? await createProduct(productPayload)
          : await updateProduct(editingId, productPayload);

      await syncRecipeForProduct(product.id);
      await refreshAll();
      resetForm();
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError, 'No se pudo guardar el producto.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setFormValues(buildEmptyProductValues());
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: ProductExpanded) => {
    const recipe = recipeByProductId.get(product.id);

    setEditingId(product.id);
    setFormValues({
      nombre: product.nombre,
      id_categoria: String(product.id_categoria),
      precio: String(product.precio ?? ''),
      recipeLines: recipeToFormLines(recipe),
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: ProductExpanded) => {
    askForConfirmation({
      confirmLabel: 'Eliminar',
      message: `Eliminar "${product.nombre}"?`,
      onConfirm: async () => {
        setDeletingId(product.id);
        setSubmitError(null);

        try {
          await deleteProduct(product.id);
          await refreshAll();
          if (editingId === product.id) {
            resetForm();
          }
        } catch (requestError) {
          setSubmitError(getApiErrorMessage(requestError, 'No se pudo eliminar el producto.'));
          throw requestError;
        } finally {
          setDeletingId(null);
        }
      },
      title: 'Confirmar eliminacion',
      tone: 'danger',
    });
  };

  const handleRecipeLineChange = (
    index: number,
    field: keyof RecipeLine,
    value: string,
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      recipeLines: currentValues.recipeLines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    }));
  };

  const handleAddRecipeLine = () => {
    setFormValues((currentValues) => ({
      ...currentValues,
      recipeLines: [...currentValues.recipeLines, { ingredientId: '', quantity: '' }],
    }));
  };

  const handleRemoveRecipeLine = (index: number) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      recipeLines: currentValues.recipeLines.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const loading =
    productsResource.loading ||
    categoriesResource.loading ||
    ingredientsResource.loading ||
    recipesResource.loading;
  const error =
    productsResource.error ??
    categoriesResource.error ??
    ingredientsResource.error ??
    recipesResource.error;

  return (
    <>
      <section className="min-h-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 px-5 py-4">
          <div>
            <p className="text-sm text-neutral-500">ABM conectado a la API</p>
            <h2 className="text-2xl font-semibold text-neutral-900">Listado</h2>
          </div>

          <button
            type="button"
            onClick={handleCreateClick}
            className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Crear producto
          </button>
        </div>

        <div className="min-h-0 overflow-auto">
          {loading ? <div className="p-5 text-sm text-neutral-600">Cargando datos...</div> : null}

          {error ? <div className="p-5 text-sm text-red-600">{error}</div> : null}

          {!loading && !error && productsResource.items.length === 0 ? (
            <div className="p-5 text-sm text-neutral-600">Todavia no hay productos registrados.</div>
          ) : null}

          {!loading && !error && productsResource.items.length > 0 ? (
            <table className="min-w-full divide-y divide-black/10 text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Precio</th>
                  <th className="px-5 py-3 font-medium">Receta</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {productsResource.items.map((product) => (
                  <tr key={product.id} className="align-top">
                    <td className="px-5 py-4">{product.id}</td>
                    <td className="px-5 py-4">{product.nombre}</td>
                    <td className="px-5 py-4">
                      {product.categoria?.nombre ?? `#${product.id_categoria}`}
                    </td>
                    <td className="px-5 py-4">
                      {typeof product.precio === 'number' ? `$${product.precio.toFixed(2)}` : '-'}
                    </td>
                    <td className="max-w-xs whitespace-pre-wrap px-5 py-4 text-neutral-600">
                      {formatRecipeSummary(recipeByProductId.get(product.id))}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-300"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => void handleDelete(product)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {deletingId === product.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-black/10 px-6 py-5">
              <p className="text-sm text-neutral-500">ABM conectado a la API</p>
              <h2 className="text-2xl font-semibold text-neutral-900">
                {editingId === null ? 'Nuevo producto' : 'Editar producto'}
              </h2>
            </div>

            <form className="flex max-h-[80vh] flex-col gap-5 overflow-y-auto p-6" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
                Nombre
                <input
                  required
                  type="text"
                  placeholder="Ej. Torta de vainilla"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-black"
                  value={formValues.nombre}
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      nombre: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
                  Categoria
                  <select
                    required
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-black"
                    value={formValues.id_categoria}
                    onChange={(event) =>
                      setFormValues((currentValues) => ({
                        ...currentValues,
                        id_categoria: event.target.value,
                      }))
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
                  Precio
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 12000"
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-black"
                    value={formValues.precio}
                    onChange={(event) =>
                      setFormValues((currentValues) => ({
                        ...currentValues,
                        precio: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-black/10 bg-neutral-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Receta</h3>
                    <p className="text-sm text-neutral-500">
                      Agrega ingredientes existentes y define sus cantidades.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRecipeLine}
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
                  >
                    Agregar ingrediente
                  </button>
                </div>

                {formValues.recipeLines.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-6 text-sm text-neutral-500">
                    Todavia no agregaste ingredientes a la receta.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {formValues.recipeLines.map((line, index) => {
                      const selectedIngredient = ingredients.find(
                        (ingredient) => String(ingredient.id) === line.ingredientId,
                      );

                      return (
                        <div
                          key={`${line.ingredientId}-${index}`}
                          className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 md:grid-cols-[minmax(0,1fr)_180px_120px]"
                        >
                          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
                            Ingrediente
                            <select
                              required
                              className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-black"
                              value={line.ingredientId}
                              onChange={(event) =>
                                handleRecipeLineChange(index, 'ingredientId', event.target.value)
                              }
                            >
                              <option value="">Seleccionar...</option>
                              {ingredients.map((ingredient) => (
                                <option key={ingredient.id} value={String(ingredient.id)}>
                                  {ingredient.nombre}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
                            Cantidad
                            <input
                              required
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Ej. 2.5"
                              className="rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-black"
                              value={line.quantity}
                              onChange={(event) =>
                                handleRecipeLineChange(index, 'quantity', event.target.value)
                              }
                            />
                          </label>

                          <div className="flex flex-col justify-between gap-2">
                            <div className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
                              {selectedIngredient?.unidad_medida ?? 'Unidad'}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipeLine(index)}
                              className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {submitError ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>
              ) : null}

              <div className="mt-2 flex gap-3 border-t border-black/10 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : editingId === null
                      ? 'Crear'
                      : 'Guardar cambios'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmationDialog
        cancelLabel={confirmation?.cancelLabel}
        confirmLabel={confirmation?.confirmLabel}
        isConfirming={isConfirming}
        isOpen={confirmation !== null}
        message={confirmation?.message ?? ''}
        onCancel={closeConfirmation}
        onConfirm={() => void confirm()}
        title={confirmation?.title}
        tone={confirmation?.tone}
      />
    </>
  );
}
