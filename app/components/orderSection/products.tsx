'use client'

import Product from './product';
import type { OrderProductCatalogProps } from '@/types';

const Products = ({
  categories,
  error,
  loading,
  onAddProduct,
  onRetry,
  products,
  selectedCategoryId,
  setSelectedCategoryId,
}: OrderProductCatalogProps) => {
  const visibleProducts = products.filter((product) => {
    if (selectedCategoryId === 'all') {
      return true;
    }

    return product.id_categoria === selectedCategoryId;
  });

  return (
    <div className="flex flex-col gap-5 min-h-0 h-full overflow-hidden rounded-3xl bg-regal-gris px-5 py-5 ">
      {/* titulo */}
      <div>
        <h2 className="text-2xl font-bold text-white">Productos</h2>
      </div>
      {/* slider */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategoryId('all')}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
            selectedCategoryId === 'all'
              ? 'bg-white text-neutral-900'
              : 'bg-black/20 text-white hover:bg-black/30'
          }`}
        >
          Todas
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategoryId(category.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
              selectedCategoryId === category.id
                ? 'bg-white text-neutral-900'
                : 'bg-black/20 text-white hover:bg-black/30'
            }`}
          >
            {category.nombre}
          </button>
        ))}
      </div>

      <div className="flex flex-col flex-1 min-h-0 max-h-full  overflow-y-auto pr-1">
        {loading ? (
          <div className="rounded-2xl bg-black/15 p-4 text-sm text-white/80">
            Cargando productos y categorías...
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl bg-red-100 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void onRetry()}
              className="mt-3 rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!loading && !error && visibleProducts.length === 0 ? (
          <div className="rounded-2xl bg-black/15 p-4 text-sm text-white/80">
            No hay productos para la categoría seleccionada.
          </div>
        ) : null}

        {!loading && !error && visibleProducts.length > 0 ? (
          <div className="flex flex-col gap-3 pb-2">
            {visibleProducts.map((product) => (
              <Product key={product.id} onAdd={onAddProduct} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Products;
