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

export type State = {
  id: number;
  nombre: string;
  es_final: boolean;
};

export type StateInput = {
  nombre: string;
  es_final?: boolean;
};

export type StateUpdateInput = {
  nombre?: string;
  es_final?: boolean;
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

export type RecipeIngredient = {
  id: number;
  id_preparacion: number;
  id_ingrediente: number;
  cantidad: number;
  ingrediente?: Ingredient;
};

export type Recipe = {
  id: number;
  id_producto: number;
  producto?: Product;
  ingredientes: RecipeIngredient[];
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
  preparacion?: string;
};

export type ProductUpdateInput = {
  nombre?: string;
  id_categoria?: number;
  precio?: number;
  preparacion?: string;
};

export type StockMovementType = {
  id: number;
  nombre: string;
};

export type StockMovementTypeInput = {
  nombre: string;
};

export type StockMovementTypeListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export type StockMovementRelatedEntity = Record<string, unknown>;

export type StockMovementDetail = {
  id: number;
  id_movimiento: number;
  id_ingrediente: number | null;
  id_producto: number | null;
  cantidad: number;
  subtotal: number;
  precio_unitario: number;
  ingrediente?: StockMovementRelatedEntity | null;
  producto?: StockMovementRelatedEntity | null;
};

export type StockMovement = {
  id: number;
  id_tipo_movimiento: number;
  id_order?: number | null;
  fecha: string;
  tipo_movimiento: StockMovementType;
  detalles: StockMovementDetail[];
};

export type StockMovementDetailInput = {
  id_ingrediente?: number | null;
  id_producto?: number | null;
  cantidad: number;
  subtotal: number;
  precio_unitario: number;
};

export type StockMovementCreateInput = {
  id_tipo_movimiento: number;
  id_order?: number | null;
  fecha?: string;
  detalles: StockMovementDetailInput[];
};

export type StockMovementUpdateInput = {
  id_tipo_movimiento?: number;
  id_order?: number | null;
  fecha?: string;
  detalles?: StockMovementDetailInput[];
};

export type StockMovementListQuery = {
  page?: number;
  pageSize?: number;
  typeId?: number;
  ingredientId?: number;
  productId?: number;
};

export type CrudFormValues = Record<string, string>;
