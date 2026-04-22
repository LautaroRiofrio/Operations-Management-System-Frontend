import type { OrderDetail, OrderListItem, RawOrderRecord } from '@/types';

const ORDER_ID_KEYS = ['id', 'orderId', 'pedidoId'];
const ORDER_NUMBER_KEYS = ['orderNumber', 'order_number', 'number', 'numero', 'code'];
const CUSTOMER_NAME_KEYS = [
  'nombre_cliente',
  'cliente.nombre',
  'customer.name',
  'customer.nombre',
  'client.name',
  'client.nombre',
  'customerName',
  'clientName',
  'cliente',
  'customer',
  'client',
  'fullName',
  'name',
];
const DELIVERY_KEYS = [
  'deliveryDate',
  'delivery_at',
  'deliveryAt',
  'fechaEntrega',
  'estimatedDelivery',
  'delivery',
];
const TOTAL_KEYS = ['total', 'totalAmount', 'amount', 'importe', 'subtotal'];
const PAYMENT_KEYS = ['paymentMethod', 'payment_method', 'metodoPago', 'paymentType'];
const NOTES_KEYS = ['notes', 'note', 'observations', 'observacion', 'comentarios'];
const STATE_KEYS = ['state', 'status', 'estado', 'stateId', 'statusId'];

function isRecord(value: unknown): value is RawOrderRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function coerceRecord(value: unknown): RawOrderRecord {
  return isRecord(value) ? value : {};
}

function getValueByPath(source: unknown, path: string): unknown {
  if (!isRecord(source)) {
    return undefined;
  }

  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current) || !(key in current)) {
      return undefined;
    }

    return current[key];
  }, source);
}

function pickFirst(source: RawOrderRecord, keys: string[]): unknown {
  for (const key of keys) {
    const directValue = source[key];
    if (
      directValue !== undefined &&
      directValue !== null &&
      directValue !== '' &&
      !isRecord(directValue)
    ) {
      return directValue;
    }

    const nestedValue = getValueByPath(source, key);
    if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
      return nestedValue;
    }
  }

  if (isRecord(source.customer)) {
    const nestedCustomer = pickFirst(source.customer, CUSTOMER_NAME_KEYS);
    if (nestedCustomer !== undefined) {
      return nestedCustomer;
    }
  }

  if (isRecord(source.client)) {
    const nestedClient = pickFirst(source.client, CUSTOMER_NAME_KEYS);
    if (nestedClient !== undefined) {
      return nestedClient;
    }
  }

  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
}

function toText(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue || fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function formatCurrency(value: unknown): string {
  const numericValue = toNumber(value);
  if (numericValue === null) {
    return toText(value, '-');
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDelivery(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function formatCurrencyFromNumber(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeOrdersResponse(payload: unknown): OrderListItem[] {
  const orders = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.data)
      ? payload.data
      : isRecord(payload) && Array.isArray(payload.orders)
        ? payload.orders
        : [];

  return orders
    .map((item) => {
      const raw = coerceRecord(item);
      const id = toNumber(pickFirst(raw, ORDER_ID_KEYS));
      if (id === null) {
        return null;
      }

      return {
        id,
        orderNumber: toText(pickFirst(raw, ORDER_NUMBER_KEYS), `#${id}`),
        customerName: toText(pickFirst(raw, CUSTOMER_NAME_KEYS), 'Cliente sin nombre'),
        deliveryLabel: formatDelivery(pickFirst(raw, DELIVERY_KEYS)),
        totalLabel: formatCurrency(pickFirst(raw, TOTAL_KEYS)),
        state: toNumber(pickFirst(raw, STATE_KEYS)),
        raw,
      } satisfies OrderListItem;
    })
    .filter((order): order is OrderListItem => order !== null);
}

export function normalizeOrderDetail(payload: unknown): OrderDetail | null {
  const rawPayload = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const raw = coerceRecord(rawPayload);
  const id = toNumber(pickFirst(raw, ORDER_ID_KEYS));

  if (id === null) {
    return null;
  }

  const rawLines = Array.isArray(raw.lineas) ? raw.lineas : [];
  const lines = rawLines.map((line) => {
    const rawLine = coerceRecord(line);
    const rawProduct = coerceRecord(rawLine.producto);
    const quantity = toNumber(rawLine.cantidad) ?? 0;
    const unitPrice = toNumber(rawProduct.precio);
    const subtotal = unitPrice === null ? null : unitPrice * quantity;

    return {
      id: toNumber(rawLine.id) ?? 0,
      productId: toNumber(rawLine.id_producto ?? rawProduct.id),
      productName: toText(rawProduct.nombre, 'Producto sin nombre'),
      quantity,
      unitPrice,
      subtotalLabel: formatCurrencyFromNumber(subtotal),
    };
  });

  const computedTotal = lines.reduce<number | null>((accumulator, line) => {
    if (line.unitPrice === null) {
      return accumulator;
    }

    const nextValue = line.unitPrice * line.quantity;
    return accumulator === null ? nextValue : accumulator + nextValue;
  }, 0);

  return {
    id,
    orderNumber: `#${id}`,
    customerId: toNumber(isRecord(raw.cliente) ? raw.cliente.id : raw.id_cliente),
    customerName: toText(
      isRecord(raw.cliente) ? raw.cliente.nombre : pickFirst(raw, CUSTOMER_NAME_KEYS),
      'Cliente sin nombre'
    ),
    customerWhatsapp: toText(
      isRecord(raw.cliente) ? raw.cliente.whatsapp : undefined,
      'No informado'
    ),
    paymentMethod: toText(pickFirst(raw, PAYMENT_KEYS), 'No informado'),
    deliveryLabel: formatDelivery(raw.fecha_entrega ?? pickFirst(raw, DELIVERY_KEYS)),
    totalLabel:
      computedTotal !== null && computedTotal > 0
        ? formatCurrencyFromNumber(computedTotal)
        : formatCurrency(pickFirst(raw, TOTAL_KEYS)),
    state: toNumber(raw.estado ?? pickFirst(raw, STATE_KEYS)),
    notes: (() => {
      const notes = pickFirst(raw, NOTES_KEYS);
      return typeof notes === 'string' && notes.trim() ? notes : null;
    })(),
    lines: Array.isArray(lines) ? lines : [],
    raw,
  };
}
