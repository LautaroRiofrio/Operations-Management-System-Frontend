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

const OPERATIONAL_MOVEMENT_TYPE_NAMES: Record<OperationalStockMovementStatus, string> = {
  en_produccion: 'en_produccion',
  entregado: 'entregado',
  cancelado_con_perdida: 'cancelado_con_perdida',
};

const LEGACY_OPERATIONAL_MOVEMENT_TYPE_NAMES = new Set(['salida_operativa']);

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

async function getOperationalMovementTypes() {
  const movementTypes = await listStockMovementTypes();
  const movementTypesByName = new Map(
    movementTypes.map((movementType) => [normalizeText(movementType.nombre), movementType]),
  );

  const resolvedTypes = {
    en_produccion: movementTypesByName.get(normalizeText(OPERATIONAL_MOVEMENT_TYPE_NAMES.en_produccion)) ?? null,
    entregado: movementTypesByName.get(normalizeText(OPERATIONAL_MOVEMENT_TYPE_NAMES.entregado)) ?? null,
    cancelado_con_perdida:
      movementTypesByName.get(normalizeText(OPERATIONAL_MOVEMENT_TYPE_NAMES.cancelado_con_perdida)) ?? null,
  } satisfies Record<OperationalStockMovementStatus, StockMovementType | null>;

  return {
    movementTypes,
    resolvedTypes,
  };
}

function ensureOperationalMovementType(
  movementTypes: Record<OperationalStockMovementStatus, StockMovementType | null>,
  status: OperationalStockMovementStatus,
): StockMovementType {
  const movementType = movementTypes[status];

  if (movementType) {
    return movementType;
  }

  throw new Error(
    `No se encontro el tipo de movimiento de stock "${OPERATIONAL_MOVEMENT_TYPE_NAMES[status]}".`,
  );
}

async function findOrderOperationalMovement(
  orderId: number,
  movementTypes: StockMovementType[],
): Promise<StockMovement | null> {
  let page = 1;
  const allowedTypeIds = new Set(movementTypes.map((movementType) => movementType.id));
  const legacyNames = new Set(
    [...LEGACY_OPERATIONAL_MOVEMENT_TYPE_NAMES].map((movementTypeName) => normalizeText(movementTypeName)),
  );

  while (page <= 20) {
    const response = await getStockMovements({
      page,
      pageSize: 100,
    });

    const foundMovement =
      response.data.find((movement) => {
        const normalizedTypeName = normalizeText(movement.tipo_movimiento.nombre);

        return (
          movement.id_order === orderId &&
          (allowedTypeIds.has(movement.id_tipo_movimiento) || legacyNames.has(normalizedTypeName))
        );
      }) ?? null;

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
  const { movementTypes, resolvedTypes } = await getOperationalMovementTypes();
  const movementType = ensureOperationalMovementType(resolvedTypes, status);
  const payload = buildMovementPayload(order, status);
  const existingMovement = await findOrderOperationalMovement(order.id, movementTypes);

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
