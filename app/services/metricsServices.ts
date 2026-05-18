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

export type MetricsStateCycleTime = {
  averageFormatted: string;
  averageMinutes: number;
  recordCount: number;
  stateId: number;
  stateName: string;
};

export type MetricsStateDetail = {
  end: string | null;
  orderId: number;
  start: string | null;
  timeFormatted: string;
  timeMinutes: number;
};

export type MetricsCycleTimeInsight = {
  detail: string;
  title: string;
};

export type MetricsStateCycleTimeReport = {
  averages: MetricsStateCycleTime[];
  insights: MetricsCycleTimeInsight[];
  isDefaultRange: boolean;
  orderCount: number;
  rangeEnd: string | null;
  rangeStart: string | null;
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
  };
  readyOrders: OrderListItem[];
  stateCycleTimes: MetricsStateCycleTimeReport;
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

type AverageTimeByStateParams = {
  endDate?: string;
  startDate?: string;
};

type AverageTimeByStateResponse = {
  cantidad_ordenes?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  promedios_por_estado?: Array<{
    cantidad_registros?: number;
    estado?: string;
    id_estado?: number;
    promedio_formateado?: string;
    promedio_minutos?: number | string;
  }>;
  rango_por_defecto?: boolean;
};

type StateDetailsResponse = Array<{
  fin?: string;
  inicio?: string;
  orden_id?: number;
  tiempo?: number | string;
  tiempo_formateado?: string;
}>;

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

function buildMetricsQueryParams(params?: AverageTimeByStateParams) {
  const queryParams: Record<string, string> = {};

  if (params?.startDate?.trim()) {
    queryParams.startDate = params.startDate;
  }

  if (params?.endDate?.trim()) {
    queryParams.endDate = params.endDate;
  }

  return queryParams;
}

async function getTotalBilling(params?: AverageTimeByStateParams) {
  const { data } = await api.get<TotalBillingResponse>('/metrics/total-billing', {
    params: buildMetricsQueryParams(params),
  });
  return data;
}

async function getDeliveryTimeConcentration(params?: AverageTimeByStateParams) {
  const { data } = await api.get<DeliveryTimeConcentrationResponse>(
    '/metrics/delivery-time-concentration',
    {
      params: buildMetricsQueryParams(params),
    },
  );
  return data;
}

async function getAverageTimeByState(params?: AverageTimeByStateParams) {
  const { data } = await api.get<AverageTimeByStateResponse>('/metrics/average-time-by-state', {
    params: buildMetricsQueryParams(params),
  });
  return data;
}

export async function getMetricsStateDetails(
  stateId: number,
  params?: AverageTimeByStateParams,
): Promise<MetricsStateDetail[]> {
  const { data } = await api.get<StateDetailsResponse>(`/metrics/state-details/${stateId}`, {
    params: buildMetricsQueryParams(params),
  });

  return (Array.isArray(data) ? data : [])
    .map((detail) => {
      const orderId = toNumber(detail.orden_id);
      const timeMinutes = toNumber(detail.tiempo);

      if (orderId === null || timeMinutes === null) {
        return null;
      }

      return {
        end: typeof detail.fin === 'string' && detail.fin.trim() ? detail.fin : null,
        orderId,
        start: typeof detail.inicio === 'string' && detail.inicio.trim() ? detail.inicio : null,
        timeFormatted:
          typeof detail.tiempo_formateado === 'string' && detail.tiempo_formateado.trim()
            ? detail.tiempo_formateado
            : '00:00:00',
        timeMinutes,
      };
    })
    .filter((detail): detail is MetricsStateDetail => detail !== null)
    .sort((leftDetail, rightDetail) => rightDetail.timeMinutes - leftDetail.timeMinutes);
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

function buildStateCycleTimeInsights(averages: MetricsStateCycleTime[], orderCount: number) {
  if (orderCount === 0 || averages.length === 0) {
    return [
      {
        title: 'Sin muestra util',
        detail:
          'No hay ordenes entregadas dentro del periodo consultado, asi que no se puede detectar un cuello de botella todavia.',
      },
    ];
  }

  const totalAverageMinutes = averages.reduce(
    (accumulator, currentState) => accumulator + currentState.averageMinutes,
    0,
  );
  const sortedByAverage = [...averages].sort(
    (leftState, rightState) => rightState.averageMinutes - leftState.averageMinutes,
  );
  const slowestState = sortedByAverage[0];
  const fastestState = sortedByAverage.at(-1);
  const secondSlowestState = sortedByAverage[1];
  const bottleneckShare = totalAverageMinutes > 0
    ? (slowestState.averageMinutes / totalAverageMinutes) * 100
    : 0;
  const combinedTopTwoShare =
    totalAverageMinutes > 0
      ? ((slowestState.averageMinutes + (secondSlowestState?.averageMinutes ?? 0)) /
          totalAverageMinutes) *
        100
      : 0;

  const insights: MetricsCycleTimeInsight[] = [
    {
      title: `Cuello principal: ${slowestState.stateName}`,
      detail: `${slowestState.stateName} concentra ${slowestState.averageFormatted} por orden en promedio (${slowestState.averageMinutes.toFixed(1)} min), equivalente al ${Math.round(bottleneckShare)}% del tiempo operativo relevado.`,
    },
  ];

  if (secondSlowestState) {
    insights.push({
      title: 'Foco de mejora',
      detail: `${slowestState.stateName} y ${secondSlowestState.stateName} suman ${Math.round(combinedTopTwoShare)}% del ciclo promedio. Si hay que priorizar mejoras, conviene empezar por esas dos etapas.`,
    });
  }

  if (fastestState) {
    insights.push({
      title: `Etapa mas agil: ${fastestState.stateName}`,
      detail: `${fastestState.stateName} promedia ${fastestState.averageFormatted} por orden. Puede servir como referencia para revisar por que otras etapas tardan mas.`,
    });
  }

  const partialCoverageStates = averages.filter((state) => state.recordCount !== orderCount);
  if (partialCoverageStates.length > 0) {
    insights.push({
      title: 'Cobertura desigual',
      detail: `Hay estados con menos registros que las ${orderCount} ordenes entregadas del periodo. Conviene revisar transiciones omitidas o estados que no aplican a todas las ordenes.`,
    });
  }

  return insights.slice(0, 3);
}

function buildStateCycleTimes(payload: AverageTimeByStateResponse): MetricsStateCycleTimeReport {
  const averages = Array.isArray(payload.promedios_por_estado)
    ? payload.promedios_por_estado
        .map((stateAverage) => {
          const stateId = toNumber(stateAverage.id_estado);
          const averageMinutes = toNumber(stateAverage.promedio_minutos);

          if (stateId === null || averageMinutes === null) {
            return null;
          }

          return {
            averageFormatted:
              typeof stateAverage.promedio_formateado === 'string' &&
              stateAverage.promedio_formateado.trim()
                ? stateAverage.promedio_formateado
                : '00:00:00',
            averageMinutes,
            recordCount: toNumber(stateAverage.cantidad_registros) ?? 0,
            stateId,
            stateName:
              typeof stateAverage.estado === 'string' && stateAverage.estado.trim()
                ? stateAverage.estado
                : `Estado ${stateId}`,
          };
        })
        .filter((stateAverage): stateAverage is MetricsStateCycleTime => stateAverage !== null)
        .sort((leftState, rightState) => rightState.averageMinutes - leftState.averageMinutes)
    : [];

  const orderCount = toNumber(payload.cantidad_ordenes) ?? 0;

  return {
    averages,
    insights: buildStateCycleTimeInsights(averages, orderCount),
    isDefaultRange: Boolean(payload.rango_por_defecto),
    orderCount,
    rangeEnd:
      typeof payload.fecha_hasta === 'string' && payload.fecha_hasta.trim()
        ? payload.fecha_hasta
        : null,
    rangeStart:
      typeof payload.fecha_desde === 'string' && payload.fecha_desde.trim()
        ? payload.fecha_desde
        : null,
  };
}

export async function getMetricsDashboardData(
  params?: AverageTimeByStateParams,
): Promise<MetricsDashboardData> {
  const states = await listStates();
  const [snapshots, totalBilling, deliveryTimeConcentration, averageTimeByState] = await Promise.all([
    listStatesWithOrders(states),
    getTotalBilling(params),
    getDeliveryTimeConcentration(params),
    getAverageTimeByState(params),
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
    },
    readyOrders,
    stateCycleTimes: buildStateCycleTimes(averageTimeByState),
    summary: buildSummary(snapshots, totalBilling),
    topCustomers: buildTopCustomers(snapshots),
  };
}

export { formatCurrency };
