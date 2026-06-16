import { getApiErrorMessage, listStockMovementTypes } from '@/app/services/adminServices';
import {
  createStockMovement,
  getStockMovements,
  updateStockMovement,
} from '@/app/services/stockMovementServices';
import type {
  OrderDetail,
  StockMovement,
  StockMovementCreateInput,
  StockMovementDetailInput,
  StockMovementType,
  StockMovementUpdateInput,
} from '@/types';

export type OperationalStockMovementStatus =
  | 'en_produccion'
  | 'entregado'
  | 'cancelado_con_perdida';

const OPERATIONAL_MOVEMENT_TYPE_NAME = 'salida_operativa';

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildMovementLines(order: OrderDetail): StockMovementDetailInput[] {
  return order.lines.flatMap((line) => {
    if (line.productId === null) {
      return [];
    }

    const unitPrice = line.unitPrice ?? 0;

    return [{
      id_producto: line.productId,
      cantidad: line.quantity,
      precio_unitario: unitPrice,
      subtotal: unitPrice * line.quantity,
    }];
  });
}

function buildMovementPayload(
  order: OrderDetail,
  _status: OperationalStockMovementStatus,
): Omit<StockMovementCreateInput, 'id_tipo_movimiento'> {
  void _status;
  const details = buildMovementLines(order);

  if (details.length === 0) {
    throw new Error('La orden no tiene productos validos para registrar un movimiento de stock.');
  }

  return {
    id_order: order.id,
    detalles: details,
    fecha: new Date().toISOString(),
  };
}

async function ensureOperationalMovementType(): Promise<StockMovementType> {
  const movementTypes = await listStockMovementTypes();
  const normalizedTarget = normalizeText(OPERATIONAL_MOVEMENT_TYPE_NAME);
  const existingType = movementTypes.find(
    (movementType) => normalizeText(movementType.nombre) === normalizedTarget,
  );

  if (existingType) {
    return existingType;
  }

  throw new Error(
    `No se encontro el tipo de movimiento de stock "${OPERATIONAL_MOVEMENT_TYPE_NAME}".`,
  );
}

async function findOrderOperationalMovement(
  orderId: number,
  movementTypeId: number,
): Promise<StockMovement | null> {
  let page = 1;

  while (page <= 20) {
    const response = await getStockMovements({
      page,
      pageSize: 100,
      typeId: movementTypeId,
    });

    const foundMovement =
      response.data.find((movement) => movement.id_order === orderId) ?? null;

    if (foundMovement) {
      return foundMovement;
    }

    const totalPages = response.meta?.totalPages ?? page;
    if (page >= totalPages || response.data.length === 0) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function upsertOperationalMovement(
  order: OrderDetail,
  status: OperationalStockMovementStatus,
) {
  const movementType = await ensureOperationalMovementType();
  const payload = buildMovementPayload(order, status);
  const existingMovement = await findOrderOperationalMovement(order.id, movementType.id);

  if (!existingMovement) {
    return createStockMovement({
      id_tipo_movimiento: movementType.id,
      ...payload,
    });
  }

  const updatePayload: StockMovementUpdateInput = {
    id_tipo_movimiento: movementType.id,
    ...payload,
  };

  return updateStockMovement(existingMovement.id, updatePayload);
}

export async function syncProductionStockMovement(order: OrderDetail) {
  try {
    return await upsertOperationalMovement(order, 'en_produccion');
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      throw error;
    }

    throw new Error(
      getApiErrorMessage(
        error,
        'No se pudo registrar el movimiento de stock para la orden en produccion.',
      ),
    );
  }
}

export async function syncDeliveryStockMovement(
  order: OrderDetail,
  status: Exclude<OperationalStockMovementStatus, 'en_produccion'>,
) {
  try {
    return await upsertOperationalMovement(order, status);
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      throw error;
    }

    throw new Error(
      getApiErrorMessage(
        error,
        'No se pudo actualizar el movimiento de stock asociado a la orden.',
      ),
    );
  }
}
