export type PaginationMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta?: PaginationMeta;
};

export type ErrorResponse = {
  error: string;
};

export type MessageResponse = {
  message: string;
};

export type Category = {
  id: number;
  nombre: string;
};

export type CategoryInput = {
  nombre: string;
};

export type Ingredient = {
  id: number;
  nombre: string;
  unidad_medida: string;
};

export type IngredientInput = {
  nombre: string;
  unidad_medida: string;
};

export type Product = {
  id: number;
  nombre: string;
  precio: number;
  id_categoria: number;
};

export type ProductWithCategory = Product & {
  categoria?: Category;
};

export type ProductExpanded = ProductWithCategory & {
  preparacion?: unknown | null;
};

export type ProductInput = {
  nombre: string;
  id_categoria: number;
  precio?: number;
};

export type ProductUpdateInput = {
  nombre?: string;
  id_categoria?: number;
  precio?: number;
};

export type CrudFormValues = Record<string, string>;
