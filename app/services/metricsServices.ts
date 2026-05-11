import { api } from '@/app/services/api';
import { listStates } from '@/app/services/adminServices';
import { getOrderByState } from '@/app/services/orderServices';
import { normalizeOrdersResponse } from '@/app/lib/orderAdapters';
import type { OrderListItem, State } from '@/types';

type UnknownRecord = Record<string, unknown>;

export type MetricsStateSnapshot = {
  stateId: number;
  stateName: string;
  orders: OrderListItem[];
};

export type MetricsSummary = {
  averageTicket: number;
  billingPeriodEnd: string | null;
  billingPeriodStart: string | null;
  isDefaultBillingRange: boolean;
  projectedRevenue: number;
  totalOrders: number;
  uniqueCustomers: number;
};

export type MetricsStateDistribution = {
  count: number;
  revenue: number;
  stateId: number;
  stateName: string;
};

export type MetricsDeliveryBucket = {
  count: number;
  hour: number;
  label: string;
};

export type MetricsCustomerRow = {
  customerName: string;
  orders: number;
  revenue: number;
};

export type MissingMetricsSpec = {
  reason: string;
  endpoint: string;
  shape: string;
  whyItHelps: string;
};

export type MetricsDashboardData = {
  byState: MetricsStateDistribution[];
  deliveryBuckets: MetricsDeliveryBucket[];
  missingMetrics: {
    profitVsCost: MissingMetricsSpec;
    stateCycleTimes: MissingMetricsSpec;
  };
  readyOrders: OrderListItem[];
  summary: MetricsSummary;
  topCustomers: MetricsCustomerRow[];
};

type TotalBillingResponse = {
  cantidad_ordenes?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  rango_por_defecto?: boolean;
  total_facturacion?: number;
};

type DeliveryTimeConcentrationResponse = {
  concentracion_por_horario?: Array<{
    cantidad_ordenes?: number;
    hora?: number;
  }>;
  total_ordenes_no_finales?: number;
};

const TOTAL_KEYS = ['total', 'totalAmount', 'amount', 'importe', 'subtotal'];
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function pickFirst(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const directValue = source[key];
    if (directValue !== undefined && directValue !== null && directValue !== '') {
      return directValue;
    }

    const nestedValue = getValueByPath(source, key);
    if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
      return nestedValue;
    }
  }

  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const normalizedValue = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function parseOrderTotal(order: OrderListItem) {
  const rawTotal = isRecord(order.raw) ? pickFirst(order.raw, TOTAL_KEYS) : undefined;
  return toNumber(rawTotal) ?? toNumber(order.totalLabel) ?? 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatHourLabel(hour: number) {
  return String(hour).padStart(2, '0');
}

async function listStatesWithOrders(states: State[]) {
  const snapshots = await Promise.all(
    states.map(async (state) => {
      const response = await getOrderByState(state.id);
      const orders = normalizeOrdersResponse(response);

      return {
        stateId: state.id,
        stateName: state.nombre,
        orders,
      };
    }),
  );

  return snapshots;
}

function buildByState(snapshots: MetricsStateSnapshot[]) {
  return snapshots.map((snapshot) => ({
    count: snapshot.orders.length,
    revenue: snapshot.orders.reduce((accumulator, order) => accumulator + parseOrderTotal(order), 0),
    stateId: snapshot.stateId,
    stateName: snapshot.stateName,
  }));
}

async function getTotalBilling() {
  const { data } = await api.get<TotalBillingResponse>('/metrics/total-billing');
  return data;
}

async function getDeliveryTimeConcentration() {
  const { data } = await api.get<DeliveryTimeConcentrationResponse>(
    '/metrics/delivery-time-concentration',
  );
  return data;
}

function buildSummary(
  snapshots: MetricsStateSnapshot[],
  totalBilling: TotalBillingResponse,
): MetricsSummary {
  const allOrders = snapshots.flatMap((snapshot) => snapshot.orders);
  const projectedRevenue = toNumber(totalBilling.total_facturacion) ?? 0;
  const totalOrders = toNumber(totalBilling.cantidad_ordenes) ?? 0;
  const uniqueCustomers = new Set(allOrders.map((order) => order.customerName.trim().toLowerCase())).size;

  return {
    averageTicket: totalOrders > 0 ? projectedRevenue / totalOrders : 0,
    billingPeriodEnd:
      typeof totalBilling.fecha_hasta === 'string' && totalBilling.fecha_hasta.trim()
        ? totalBilling.fecha_hasta
        : null,
    billingPeriodStart:
      typeof totalBilling.fecha_desde === 'string' && totalBilling.fecha_desde.trim()
        ? totalBilling.fecha_desde
        : null,
    isDefaultBillingRange: Boolean(totalBilling.rango_por_defecto),
    projectedRevenue,
    totalOrders,
    uniqueCustomers,
  };
}

function buildDeliveryBuckets(payload: DeliveryTimeConcentrationResponse) {
  const buckets = Array.isArray(payload.concentracion_por_horario)
    ? payload.concentracion_por_horario
    : [];

  return buckets
    .map((bucket) => {
      const hour = toNumber(bucket.hora);
      const count = toNumber(bucket.cantidad_ordenes) ?? 0;

      if (hour === null) {
        return null;
      }

      return {
        count,
        hour,
        label: formatHourLabel(hour),
      };
    })
    .filter((bucket): bucket is MetricsDeliveryBucket => bucket !== null);
}

function buildTopCustomers(snapshots: MetricsStateSnapshot[]) {
  const byCustomer = new Map<string, MetricsCustomerRow>();

  snapshots.flatMap((snapshot) => snapshot.orders).forEach((order) => {
    const key = order.customerName.trim() || 'Cliente sin nombre';
    const currentCustomer = byCustomer.get(key);
    const revenue = parseOrderTotal(order);

    if (!currentCustomer) {
      byCustomer.set(key, {
        customerName: key,
        orders: 1,
        revenue,
      });
      return;
    }

    byCustomer.set(key, {
      ...currentCustomer,
      orders: currentCustomer.orders + 1,
      revenue: currentCustomer.revenue + revenue,
    });
  });

  return Array.from(byCustomer.values())
    .sort((leftCustomer, rightCustomer) => {
      if (rightCustomer.revenue !== leftCustomer.revenue) {
        return rightCustomer.revenue - leftCustomer.revenue;
      }

      return rightCustomer.orders - leftCustomer.orders;
    })
    .slice(0, 5);
}

export async function getMetricsDashboardData(): Promise<MetricsDashboardData> {
  const states = await listStates();
  const [snapshots, totalBilling, deliveryTimeConcentration] = await Promise.all([
    listStatesWithOrders(states),
    getTotalBilling(),
    getDeliveryTimeConcentration(),
  ]);
  const byState = buildByState(snapshots);
  const readyOrders =
    snapshots.find((snapshot) => snapshot.stateName.toLowerCase().includes('listo'))?.orders ?? [];

  return {
    byState,
    deliveryBuckets: buildDeliveryBuckets(deliveryTimeConcentration),
    missingMetrics: {
      profitVsCost: {
        reason: 'La API actual devuelve totales de orden, pero no expone costos por pedido ni costo consolidado por producto/ingrediente.',
        endpoint: 'GET /metrics/profit-overview?from=YYYY-MM-DD&to=YYYY-MM-DD',
        shape: '{ revenue, cost, profit, margins: [{ label, revenue, cost, profit }] }',
        whyItHelps: 'Evita reconstruir costos desde multiples recursos y permite graficar margen real con una sola llamada.',
      },
      stateCycleTimes: {
        reason: 'No hay historial temporal por estado ni timestamps de inicio/fin para medir cuanto dura cada tramo operativo.',
        endpoint: 'GET /metrics/state-cycle-times?from=YYYY-MM-DD&to=YYYY-MM-DD',
        shape: '{ averages: [{ stateId, stateName, avgMinutes, samples }], p95: [{ stateId, minutes }] }',
        whyItHelps: 'Centraliza el calculo en backend y evita pedir orden por orden mas su historial para obtener promedios confiables.',
      },
    },
    readyOrders,
    summary: buildSummary(snapshots, totalBilling),
    topCustomers: buildTopCustomers(snapshots),
  };
}

export { formatCurrency };
