'use client'

import { useCrudResource } from '@/app/hooks/useCrudResource';
import { listCategories, listProducts } from '@/app/services/adminServices';

export function useOrderCatalog() {
  const categoriesResource = useCrudResource(
    listCategories,
    'No se pudieron cargar las categorias.',
  );
  const productsResource = useCrudResource(
    listProducts,
    'No se pudieron cargar los productos.',
  );

  return {
    categories: categoriesResource.items,
    categoriesError: categoriesResource.error,
    categoriesLoading: categoriesResource.loading,
    products: productsResource.items,
    productsError: productsResource.error,
    productsLoading: productsResource.loading,
    refreshCategories: categoriesResource.refresh,
    refreshProducts: productsResource.refresh,
  };
}
