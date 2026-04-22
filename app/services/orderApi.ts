import { api } from '@/app/services/api';
import {
  buildOrderPayloadVariants,
  extractOrderId,
  type OrderBasePayload,
  withFallbacks,
} from '@/app/services/orderFormUtils';

export async function createOrderRecord(input: OrderBasePayload): Promise<number> {
  const payload = buildOrderPayloadVariants(input);
  const data = await withFallbacks([
    async () => {
      const response = await api.post('/order', payload);
      return response.data;
    },
  ]);
  const orderId = extractOrderId(data);

  if (orderId === null) {
    throw new Error('No se pudo obtener el identificador de la orden creada.');
  }

  return orderId;
}

export async function updateOrderRecord(orderId: number, input: OrderBasePayload) {
  const payload = buildOrderPayloadVariants(input);
  await withFallbacks([
    async () => {
      await api.put(`/order/${orderId}`, payload);
      return true;
    },
  ]);
}

export async function deleteOrderRecord(orderId: number) {
  await api.delete(`/order/${orderId}`);
}
