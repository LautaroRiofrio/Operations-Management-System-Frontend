import axios from 'axios';
import type {
  Category,
  CategoryInput,
  ErrorResponse,
  Ingredient,
  IngredientInput,
  MessageResponse,
  PaginatedResponse,
  ProductExpanded,
  ProductInput,
  ProductUpdateInput,
  ProductWithCategory,
  Recipe,
  State,
  StateInput,
  StateUpdateInput,
  StockMovementType,
  StockMovementTypeInput,
} from '@/types';
import { api } from '@/app/services/api';
import { administrativePaths } from '@/app/services/openapiPaths';

type ListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

type CollectionPayload<T> =
  | T[]
  | Partial<PaginatedResponse<T>> & {
      items?: T[];
      products?: T[];
      productos?: T[];
    };

type IngredientPayload = Omit<Ingredient, 'costo'> & {
  costo: number | string | null;
};

function extractCollection<T>(payload: CollectionPayload<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.products)) {
    return payload.products;
  }

  return Array.isArray(payload.productos) ? payload.productos : [];
}

async function listResource<T>(path: string, params?: ListQuery): Promise<T[]> {
  const { data } = await api.get<CollectionPayload<T>>(path, { params });
  return extractCollection(data);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const normalizedValue = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function normalizeIngredient(payload: IngredientPayload): Ingredient {
  return {
    ...payload,
    costo: toNumber(payload.costo) ?? 0,
  };
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ErrorResponse | MessageResponse | undefined;
    if (apiError && 'error' in apiError && apiError.error) {
      return apiError.error;
    }

    if (apiError && 'message' in apiError && apiError.message) {
      return apiError.message;
    }
  }

  return fallbackMessage;
}

export async function listCategories() {
  return listResource<Category>(administrativePaths.categories.collection, {
    page: 1,
    pageSize: 100,
  });
}

export async function listStates() {
  return listResource<State>(administrativePaths.states.collection, {
    page: 1,
    pageSize: 100,
  });
}

export async function createState(payload: StateInput) {
  const { data } = await api.post<State>(administrativePaths.states.collection, payload);
  return data;
}

export async function updateState(id: number, payload: StateUpdateInput) {
  const { data } = await api.put<State>(administrativePaths.states.detail(id), payload);
  return data;
}

export async function deleteState(id: number) {
  const { data } = await api.delete<MessageResponse>(administrativePaths.states.detail(id));
  return data;
}

export async function createCategory(payload: CategoryInput) {
  const { data } = await api.post<Category>(administrativePaths.categories.collection, payload);
  return data;
}

export async function updateCategory(id: number, payload: CategoryInput) {
  const { data } = await api.put<Category>(administrativePaths.categories.detail(id), payload);
  return data;
}

export async function deleteCategory(id: number) {
  const { data } = await api.delete<MessageResponse>(administrativePaths.categories.detail(id));
  return data;
}

export async function listIngredients() {
  const ingredients = await listResource<IngredientPayload>(administrativePaths.ingredients.collection, {
    page: 1,
    pageSize: 100,
  });

  return ingredients.map(normalizeIngredient);
}

export async function createIngredient(payload: IngredientInput) {
  const { data } = await api.post<IngredientPayload>(
    administrativePaths.ingredients.collection,
    payload,
  );
  return normalizeIngredient(data);
}

export async function updateIngredient(id: number, payload: IngredientInput) {
  const { data } = await api.put<IngredientPayload>(administrativePaths.ingredients.detail(id), payload);
  return normalizeIngredient(data);
}

export async function deleteIngredient(id: number) {
  const { data } = await api.delete<MessageResponse>(administrativePaths.ingredients.detail(id));
  return data;
}

export async function listRecipes() {
  return listResource<Recipe>(administrativePaths.recipes.collection, {
    page: 1,
    pageSize: 100,
  });
}

export async function createRecipe(payload: { id_producto: number }) {
  const { data } = await api.post<Recipe>(administrativePaths.recipes.collection, payload);
  return data;
}

export async function updateRecipe(
  id: number,
  payload: { ingredientes: { id_ingrediente: number; cantidad: number }[] },
) {
  const { data } = await api.put<Recipe>(administrativePaths.recipes.detail(id), payload);
  return data;
}

export async function listProducts() {
  return listResource<ProductExpanded>(administrativePaths.products.collection, {
    page: 1,
    pageSize: 100,
  });
}

export async function getProductById(id: number) {
  const { data } = await api.get<ProductExpanded>(administrativePaths.products.detail(id));
  return data;
}

export async function createProduct(payload: ProductInput) {
  const { data } = await api.post<ProductWithCategory>(administrativePaths.products.collection, payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductUpdateInput) {
  const { data } = await api.put<ProductWithCategory>(administrativePaths.products.detail(id), payload);
  return data;
}

export async function deleteProduct(id: number) {
  const { data } = await api.delete<MessageResponse>(administrativePaths.products.detail(id));
  return data;
}

export async function listStockMovementTypes() {
  return listResource<StockMovementType>(administrativePaths.stockMovementTypes.collection, {
    page: 1,
    pageSize: 100,
  });
}

export async function createStockMovementType(payload: StockMovementTypeInput) {
  const { data } = await api.post<StockMovementType>(
    administrativePaths.stockMovementTypes.collection,
    payload,
  );
  return data;
}

export async function updateStockMovementType(id: number, payload: StockMovementTypeInput) {
  const { data } = await api.put<StockMovementType>(
    administrativePaths.stockMovementTypes.detail(id),
    payload,
  );
  return data;
}

export async function deleteStockMovementType(id: number) {
  const { data } = await api.delete<MessageResponse>(
    administrativePaths.stockMovementTypes.detail(id),
  );
  return data;
}
