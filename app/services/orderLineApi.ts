import { api } from '@/app/services/api';
import type { OrderLinePayload } from '@/app/services/orderFormUtils';

function buildCreateLinePayload(input: OrderLinePayload) {
  return {
    id_orden: input.orderId,
    id_producto: input.productId,
    cantidad: input.quantity,
  };
}

function buildUpdateLinePayload(input: OrderLinePayload) {
  return {
    id_producto: input.productId,
    cantidad: input.quantity,
  };
}

export async function createOrderLine(input: OrderLinePayload) {
  await api.post('/line', buildCreateLinePayload(input));
}

export async function updateOrderLine(lineId: number, input: OrderLinePayload) {
  await api.put(`/line/${lineId}`, buildUpdateLinePayload(input));
}

export async function deleteOrderLine(lineId: number) {
  await api.delete(`/line/${lineId}`);
}
