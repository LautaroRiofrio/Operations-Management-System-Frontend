'use client'

import type { ProductExpanded } from '@/types';

type ProductRowProps = {
  onAdd: (product: ProductExpanded) => void;
  product: ProductExpanded;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

const Product = ({ onAdd, product }: ProductRowProps) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-black/15 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{product.nombre}</p>
        <p className="text-sm text-white/70">
          {typeof product.categoria?.nombre === 'string'
            ? product.categoria.nombre
            : `Categoria #${product.id_categoria}`}
        </p>
      </div>

      <div className="text-right">
        <p className="font-semibold text-white">
          {typeof product.precio === 'number' ? formatCurrency(product.precio) : 'Sin precio'}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onAdd(product)}
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
      >
        Agregar
      </button>
    </div>
  );
};

export default Product;
