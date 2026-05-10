export const administrativePaths = {
  states: {
    collection: '/state',
    detail: (id: number) => `/state/${id}`,
  },
  categories: {
    collection: '/category',
    detail: (id: number) => `/category/${id}`,
  },
  ingredients: {
    collection: '/ingredient',
    detail: (id: number) => `/ingredient/${id}`,
  },
  recipes: {
    collection: '/recipe',
    detail: (id: number) => `/recipe/${id}`,
  },
  products: {
    collection: '/product',
    detail: (id: number) => `/product/${id}`,
  },
  stockMovementTypes: {
    collection: '/stockMovementType',
    detail: (id: number) => `/stockMovementType/${id}`,
  },
} as const;
