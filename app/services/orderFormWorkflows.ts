import {
  createOrderRecord,
  deleteOrderRecord,
  updateOrderRecord,
} from '@/app/services/orderApi';
import {
  createOrderLine,
  deleteOrderLine,
  updateOrderLine,
} from '@/app/services/orderLineApi';
import {
  buildLineDiff,
  type OrderLinePayload,
  type UpdateOrderWorkflowInput,
} from '@/app/services/orderFormUtils';
import type { OrderMutationInput } from '@/types';

export async function createOrderWorkflow(input: OrderMutationInput) {
  const orderId = await createOrderRecord({
    customerId: input.customerId,
    paymentMethod: input.paymentMethod,
  });

  try {
    for (const line of input.lines) {
      await createOrderLine({
        orderId,
        productId: line.productId,
        quantity: line.quantity,
      });
    }

    return { orderId };
  } catch (error) {
    try {
      await deleteOrderRecord(orderId);
    } catch {
    }

    throw error;
  }
}

export async function updateOrderWorkflow(
  orderId: number,
  input: UpdateOrderWorkflowInput,
) {
  await updateOrderRecord(orderId, {
    customerId: input.current.customerId,
    paymentMethod: input.current.paymentMethod,
  });

  const diff = buildLineDiff(orderId, input);
  const deletedLines = input.previous.lines.filter(
    (line) => line.lineId && diff.remove.includes(line.lineId),
  );
  const previousOrder = {
    customerId: input.previous.customerId,
    paymentMethod: input.previous.paymentMethod,
  };
  const createdLines: OrderLinePayload[] = [];

  try {
    for (const lineId of diff.remove) {
      await deleteOrderLine(lineId);
    }

    for (const line of diff.update) {
      await updateOrderLine(line.lineId, {
        orderId,
        productId: line.next.productId,
        quantity: line.next.quantity,
      });
    }

    for (const line of diff.create) {
      await createOrderLine(line);
      createdLines.push(line);
    }
  } catch (error) {
    try {
      await updateOrderRecord(orderId, previousOrder);

      for (const line of diff.update) {
        await updateOrderLine(line.lineId, {
          orderId,
          productId: line.previous.productId,
          quantity: line.previous.quantity,
        });
      }

      for (const deletedLine of deletedLines) {
        await createOrderLine({
          orderId,
          productId: deletedLine.productId,
          quantity: deletedLine.quantity,
        });
      }

      void createdLines;
    } catch {
    }

    throw error;
  }
}
