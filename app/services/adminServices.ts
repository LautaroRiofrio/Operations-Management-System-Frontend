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
} from '@/types';
import { api } from '@/app/services/api';
import { administrativePaths } from '@/app/services/openapiPaths';

type ListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

function extractCollection<T>(payload: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload.data) ? payload.data : [];
}

async function listResource<T>(path: string, params?: ListQuery): Promise<T[]> {
  const { data } = await api.get<PaginatedResponse<T> | T[]>(path, { params });
  return extractCollection(data);
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ErrorResponse | MessageResponse | undefined;
    if (apiError?.error) {
      return apiError.error;
    }

    if (apiError?.message) {
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
  return listResource<Ingredient>(administrativePaths.ingredients.collection, {
    page: 1,
    pageSize: 100,
  });
}

export async function createIngredient(payload: IngredientInput) {
  const { data } = await api.post<Ingredient>(administrativePaths.ingredients.collection, payload);
  return data;
}

export async function updateIngredient(id: number, payload: IngredientInput) {
  const { data } = await api.put<Ingredient>(administrativePaths.ingredients.detail(id), payload);
  return data;
}

export async function deleteIngredient(id: number) {
  const { data } = await api.delete<MessageResponse>(administrativePaths.ingredients.detail(id));
  return data;
}

export async function listProducts() {
  return listResource<ProductExpanded>(administrativePaths.products.collection, {
    page: 1,
    pageSize: 100,
  });
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
