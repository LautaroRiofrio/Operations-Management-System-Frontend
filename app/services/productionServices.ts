import { normalizeOrderDetail } from '@/app/lib/orderAdapters';
import { listRecipes } from '@/app/services/adminServices';
import { getOrderById } from '@/app/services/orderServices';
import { updateOrderRecord } from '@/app/services/orderApi';
import type { OrderDetail, Recipe, State } from '@/types';

export type ProductionIngredient = {
  id: string;
  name: string;
  quantityLabel: string;
};

export type ProductionProductLine = {
  id: number;
  productId: number | null;
  productName: string;
  quantityRequired: number;
  ingredients: ProductionIngredient[];
};

export type ProductionOrderCard = {
  id: number;
  orderNumber: string;
  customerName: string;
  deliveryLabel: string;
  totalLabel: string;
  products: ProductionProductLine[];
};

export type ProductionStateIds = {
  cancelled: number | null;
  delivered: number | null;
  pending: number | null;
  inProduction: number | null;
  ready: number | null;
};

type WorkflowStateKey = keyof ProductionStateIds;

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatIngredientQuantity(quantity: number, unit: string | undefined) {
  const formattedNumber = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
  return unit ? `${formattedNumber} ${unit}` : formattedNumber;
}

function getStateKeyByName(name: string): WorkflowStateKey | null {
  const normalizedName = normalizeText(name);

  if (normalizedName.includes('pendiente')) {
    return 'pending';
  }

  if (
    normalizedName.includes('entregado') ||
    normalizedName.includes('entregada') ||
    normalizedName.includes('despachado') ||
    normalizedName.includes('despachada')
  ) {
    return 'delivered';
  }

  if (
    normalizedName.includes('cancelado') ||
    normalizedName.includes('cancelada') ||
    normalizedName.includes('anulado') ||
    normalizedName.includes('anulada')
  ) {
    return 'cancelled';
  }

  if (
    normalizedName.includes('produccion') ||
    normalizedName.includes('preparacion') ||
    normalizedName.includes('produciendo')
  ) {
    return 'inProduction';
  }

  if (
    normalizedName.includes('listo') ||
    normalizedName.includes('terminado') ||
    normalizedName.includes('completado')
  ) {
    return 'ready';
  }

  return null;
}

export function resolveProductionStateIds(states: State[]): ProductionStateIds {
  return states.reduce<ProductionStateIds>(
    (accumulator, state) => {
      const matchedKey = getStateKeyByName(state.nombre);
      if (!matchedKey || accumulator[matchedKey] !== null) {
        return accumulator;
      }

      return {
        ...accumulator,
        [matchedKey]: state.id,
      };
    },
    {
      cancelled: null,
      delivered: null,
      pending: null,
      inProduction: null,
      ready: null,
    },
  );
}

function mapRecipeByProductId(recipes: Recipe[]) {
  return new Map<number, Recipe>(recipes.map((recipe) => [recipe.id_producto, recipe]));
}

export async function getProductionRecipes() {
  const recipes = await listRecipes();
  return mapRecipeByProductId(recipes);
}

export async function getOrderDetailForProduction(orderId: number) {
  const response = await getOrderById(orderId);
  const order = normalizeOrderDetail(response);

  if (!order) {
    throw new Error('No se pudo interpretar el detalle de la orden.');
  }

  return order;
}

export function buildProductionOrderCard(
  detail: OrderDetail,
  recipesByProductId: Map<number, Recipe>,
): ProductionOrderCard {
  return {
    id: detail.id,
    orderNumber: detail.orderNumber,
    customerName: detail.customerName,
    deliveryLabel: detail.deliveryLabel,
    totalLabel: detail.totalLabel,
    products: detail.lines.map((line) => {
      const recipe = line.productId ? recipesByProductId.get(line.productId) : undefined;

      return {
        id: line.id,
        productId: line.productId,
        productName: line.productName,
        quantityRequired: line.quantity,
        ingredients:
          recipe?.ingredientes.map((ingredientLine, index) => ({
            id: `${ingredientLine.id}-${index}`,
            name: ingredientLine.ingrediente?.nombre ?? `Ingrediente #${ingredientLine.id_ingrediente}`,
            quantityLabel: formatIngredientQuantity(
              ingredientLine.cantidad,
              ingredientLine.ingrediente?.unidad_medida,
            ),
          })) ?? [],
      };
    }),
  };
}

export async function transitionOrderToState(orderId: number, nextStateId: number) {
  const order = await getOrderDetailForProduction(orderId);

  if (order.customerId === null || !order.estimatedDeliveryValue) {
    throw new Error('La orden no tiene datos suficientes para actualizar su estado.');
  }

  await updateOrderRecord(orderId, {
    customerId: order.customerId,
    estimatedDelivery: order.estimatedDeliveryValue,
    paymentMethod: order.paymentMethod,
    stateId: nextStateId,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('orders:changed'));
  }

  return order;
}
