// Rutas derivadas del OpenAPI provisto para las entidades administrativas.
export const administrativePaths = {
  categories: {
    collection: '/category',
    detail: (id: number) => `/category/${id}`,
  },
  ingredients: {
    collection: '/ingredient',
    detail: (id: number) => `/ingredient/${id}`,
  },
  products: {
    collection: '/product',
    detail: (id: number) => `/product/${id}`,
  },
} as const;
