import axios from 'axios';
import type { OrderCustomerOption, OrderMutationInput } from '@/types';

type UnknownRecord = Record<string, unknown>;

export type OrderBasePayload = {
  customerId: number;
  paymentMethod?: string;
};

export type OrderLinePayload = {
  orderId: number;
  productId: number;
  quantity: number;
};

export type OrderLineDiff = {
  create: OrderLinePayload[];
  remove: number[];
  update: Array<{
    lineId: number;
    next: OrderLinePayload;
    previous: OrderLinePayload;
  }>;
};

export type UpdateOrderWorkflowInput = {
  current: OrderMutationInput;
  previous: OrderMutationInput;
};

const CLIENT_NAME_KEYS = ['nombre', 'name', 'fullName', 'cliente', 'clientName'];
const CLIENT_PHONE_KEYS = ['whatsapp', 'telefono', 'phone', 'celular'];
const ORDER_ID_KEYS = ['id', 'orderId', 'idOrder', 'pedidoId', 'id_pedido'];
const RETRIABLE_STATUSES = new Set([400, 404, 405, 422]);

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

export function toText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

export function pickFirst(source: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '' && !isRecord(value)) {
      return value;
    }
  }

  return undefined;
}

export function extractCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (Array.isArray(payload.clients)) {
      return payload.clients;
    }
  }

  return [];
}

export function normalizeClient(item: unknown): OrderCustomerOption | null {
  if (!isRecord(item)) {
    return null;
  }

  const id = toNumber(item.id ?? item.id_cliente ?? item.clientId);
  const name = toText(pickFirst(item, CLIENT_NAME_KEYS));

  if (id === null || !name) {
    return null;
  }

  return {
    id,
    name,
    whatsapp: toText(pickFirst(item, CLIENT_PHONE_KEYS)),
  };
}

export function extractOrderId(payload: unknown): number | null {
  if (!isRecord(payload)) {
    return null;
  }

  const directId = toNumber(pickFirst(payload, ORDER_ID_KEYS));
  if (directId !== null) {
    return directId;
  }

  if (isRecord(payload.data)) {
    return extractOrderId(payload.data);
  }

  if (isRecord(payload.order)) {
    return extractOrderId(payload.order);
  }

  return null;
}

function shouldTryNext(error: unknown): boolean {
  return axios.isAxiosError(error)
    ? RETRIABLE_STATUSES.has(error.response?.status ?? 0)
    : false;
}

export async function withFallbacks<T>(attempts: Array<() => Promise<T>>): Promise<T> {
  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (!shouldTryNext(error)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('No compatible endpoint was found.');
}

export function buildOrderPayloadVariants(input: OrderBasePayload) {
  return {
    id_cliente: input.customerId,
  };
}

export function buildLineDiff(
  orderId: number,
  input: UpdateOrderWorkflowInput,
): OrderLineDiff {
  const previousByLineId = new Map<number, OrderMutationInput['lines'][number]>();
  const previousByProductId = new Map<number, OrderMutationInput['lines'][number]>();
  const reusedPreviousLineIds = new Set<number>();

  for (const line of input.previous.lines) {
    if (line.lineId) {
      previousByLineId.set(line.lineId, line);
    }
    previousByProductId.set(line.productId, line);
  }

  const nextLineIds = new Set<number>();
  const create: OrderLinePayload[] = [];
  const update: OrderLineDiff['update'] = [];

  for (const line of input.current.lines) {
    const nextPayload = {
      orderId,
      productId: line.productId,
      quantity: line.quantity,
    };

    const previousLine = line.lineId
      ? previousByLineId.get(line.lineId)
      : previousByProductId.get(line.productId);

    if (!previousLine || !previousLine.lineId) {
      if (line.lineId) {
        nextLineIds.add(line.lineId);
      }
      create.push(nextPayload);
      continue;
    }

    nextLineIds.add(previousLine.lineId);
    reusedPreviousLineIds.add(previousLine.lineId);

    if (
      previousLine.productId !== line.productId ||
      previousLine.quantity !== line.quantity
    ) {
      update.push({
        lineId: previousLine.lineId,
        next: nextPayload,
        previous: {
          orderId,
          productId: previousLine.productId,
          quantity: previousLine.quantity,
        },
      });
    }
  }

  const remove = input.previous.lines
    .filter(
      (line) =>
        line.lineId &&
        !nextLineIds.has(line.lineId) &&
        !reusedPreviousLineIds.has(line.lineId),
    )
    .map((line) => line.lineId as number);

  return { create, remove, update };
}
