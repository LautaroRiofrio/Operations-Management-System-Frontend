'use client'

import { useRef, useState } from 'react';
import { normalizeOrderDetail } from '@/app/lib/orderAdapters';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMetricsDashboard } from '@/app/hooks/useMetricsDashboard';
import { getOrderById } from '@/app/services/orderServices';
import {
  formatCurrency,
  getMetricsStateDetails,
  type MetricsStateDetail,
} from '@/app/services/metricsServices';
import type { OrderDetail } from '@/types';

const CHART_COLORS = {
  amber: '#f59e0b',
  amberDeep: '#d97706',
  amberSoft: '#fbbf24',
  copper: '#c2410c',
  ink: '#171717',
  slate: '#737373',
};

function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return '-';
  }

  const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value;
  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function formatMinutesLabel(value: number) {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatPercentageLabel(value: number) {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatDateInputValue(value: string | null) {
  if (!value) {
    return '';
  }

  const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value;
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function MetricsTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload?: Record<string, unknown>; value?: number }>;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const currentPayload = payload[0]?.payload ?? {};
  const resolvedLabel =
    typeof label === 'string' && label.trim()
      ? label
      : typeof currentPayload.productName === 'string' && currentPayload.productName.trim()
        ? currentPayload.productName
        : typeof currentPayload.customerName === 'string' && currentPayload.customerName.trim()
          ? currentPayload.customerName
        : typeof currentPayload.name === 'string' && currentPayload.name.trim()
          ? currentPayload.name
          : '-';
  const formattedValue =
    typeof currentPayload.formattedValue === 'string'
      ? currentPayload.formattedValue
      : typeof payload[0]?.value === 'number'
        ? `${formatMinutesLabel(payload[0].value)} min`
        : '-';
  const secondaryLabel =
    typeof currentPayload.secondaryLabel === 'string' ? currentPayload.secondaryLabel : null;
  const rangeLabel = typeof currentPayload.rangeLabel === 'string' ? currentPayload.rangeLabel : null;

  return (
    <div className="min-w-[164px] rounded-3xl border border-white/70 bg-white/95 px-4 py-3 shadow-[0_18px_45px_-28px_rgba(0,0,0,0.45)] backdrop-blur">
      <p className="text-sm font-semibold tracking-tight text-neutral-950">{resolvedLabel}</p>
      <p className="mt-2 text-lg font-semibold text-amber-600">{formattedValue}</p>
      {secondaryLabel ? <p className="mt-1 text-xs text-neutral-500">{secondaryLabel}</p> : null}
      {rangeLabel ? <p className="mt-1 text-xs text-neutral-500">{rangeLabel}</p> : null}
    </div>
  );
}

function DeliveryTimelineChart({
  buckets,
}: {
  buckets: { count: number; label: string }[];
}) {
  if (buckets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-6 text-sm text-neutral-500">
        Todavia no hay horarios de entrega utilizables para graficar.
      </div>
    );
  }

  const chartData = buckets.map((bucket) => ({
    ...bucket,
    formattedValue: `${bucket.count}`,
    secondaryLabel: `${bucket.count} pedidos en la franja`,
  }));

  return (
    <div className="rounded-[28px] border border-black/10 bg-[linear-gradient(180deg,_#fffaf0_0%,_#ffffff_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 16, right: 16, bottom: 12, left: 0 }}>
            <defs>
              <linearGradient id="deliveryAreaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity="0.34" />
                <stop offset="75%" stopColor={CHART_COLORS.amberSoft} stopOpacity="0.08" />
                <stop offset="100%" stopColor={CHART_COLORS.amberSoft} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_COLORS.slate, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: CHART_COLORS.slate, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<MetricsTooltip />}
              cursor={{ stroke: 'rgba(245, 158, 11, 0.25)', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={CHART_COLORS.ink}
              strokeWidth={3}
              fill="url(#deliveryAreaGradient)"
              activeDot={{ r: 6, fill: CHART_COLORS.amber, stroke: '#fff', strokeWidth: 3 }}
              dot={{ r: 4, fill: CHART_COLORS.amber, stroke: CHART_COLORS.ink, strokeWidth: 2 }}
            >
              <LabelList
                dataKey="formattedValue"
                position="top"
                offset={8}
                fill={CHART_COLORS.ink}
                fontSize={12}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatCompactLabel(value: string, maxLength = 14) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function StateCycleTimeChart({
  items,
  onSelectState,
  selectedStateId,
}: {
  items: {
    averageFormatted: string;
    averageMinutes: number;
    recordCount: number;
    stateId: number;
    stateName: string;
  }[];
  onSelectState: (state: {
    averageFormatted: string;
    averageMinutes: number;
    recordCount: number;
    stateId: number;
    stateName: string;
  }) => void;
  selectedStateId: number | null;
}) {
  const chartData = items.map((item) => ({
    ...item,
    formattedValue: `${item.averageFormatted} (${formatMinutesLabel(item.averageMinutes)} min)`,
    secondaryLabel: `${item.recordCount} registros relevados`,
  }));

  return (
    <div className="overflow-x-auto rounded-[24px] border border-black/10 bg-[linear-gradient(180deg,_#fffaf0_0%,_#ffffff_100%)] p-4">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 56, bottom: 8, left: 8 }}
            barCategoryGap={14}
          >
            <defs>
              <linearGradient id="stateTimeBar" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={CHART_COLORS.amber} />
                <stop offset="100%" stopColor={CHART_COLORS.amberDeep} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ede9e7" strokeDasharray="4 6" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: CHART_COLORS.slate, fontSize: 12 }}
              tickFormatter={(value: number) => `${formatMinutesLabel(value)} min`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="stateName"
              width={132}
              tick={{ fill: CHART_COLORS.ink, fontSize: 12 }}
              tickFormatter={(value: string) => formatCompactLabel(value)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<MetricsTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }} />
            <Bar dataKey="averageMinutes" radius={[0, 18, 18, 0]} barSize={28}>
              <LabelList
                dataKey="averageFormatted"
                position="right"
                offset={12}
                fill={CHART_COLORS.ink}
                fontSize={12}
              />
              {chartData.map((item) => (
                <Cell
                  key={item.stateId}
                  fill={selectedStateId === item.stateId ? CHART_COLORS.copper : 'url(#stateTimeBar)'}
                  cursor="pointer"
                  onClick={() => onSelectState(item)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">
        Click en un estado para ver el detalle de sus ocurrencias.
      </p>
    </div>
  );
}

function StateDetailChart({
  items,
  onBack,
  onSelectOrder,
  stateName,
}: {
  items: MetricsStateDetail[];
  onBack: () => void;
  onSelectOrder: (orderId: number) => void;
  stateName: string;
}) {
  const chartData = items.map((item) => ({
    ...item,
    formattedValue: item.timeFormatted,
    orderLabel: `#${item.orderId}`,
    rangeLabel: `${formatDateTimeLabel(item.start)} al ${formatDateTimeLabel(item.end)}`,
    secondaryLabel: `${formatMinutesLabel(item.timeMinutes)} min`,
  }));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Detalle del estado
          </p>
          <h3 className="mt-2 text-xl font-semibold text-neutral-950">{stateName}</h3>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-stone-100"
        >
          Volver a estados
        </button>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-black/10 bg-[linear-gradient(180deg,_#fffaf0_0%,_#ffffff_100%)] p-4">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 12, bottom: 16, left: 0 }}>
              <defs>
                <linearGradient id="stateDetailBar" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.amber} />
                  <stop offset="100%" stopColor={CHART_COLORS.amberDeep} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ede9e7" strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="orderLabel"
                tick={{ fill: CHART_COLORS.ink, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_COLORS.slate, fontSize: 12 }}
                tickFormatter={(value: number) => `${formatMinutesLabel(value)} min`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<MetricsTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }} />
              <Bar dataKey="timeMinutes" radius={[18, 18, 0, 0]} barSize={42}>
                <LabelList
                  dataKey="formattedValue"
                  position="top"
                  offset={8}
                  fill={CHART_COLORS.ink}
                  fontSize={12}
                />
                {chartData.map((item) => (
                  <Cell
                    key={`${item.orderId}-${item.start ?? 'sin-inicio'}-${item.end ?? 'sin-fin'}`}
                    fill="url(#stateDetailBar)"
                    cursor="pointer"
                    onClick={() => onSelectOrder(item.orderId)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function OrderDetailDrilldown({
  onBack,
  order,
}: {
  onBack: () => void;
  order: OrderDetail;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Detalle de la orden
          </p>
          <h3 className="mt-2 text-xl font-semibold text-neutral-950">{order.orderNumber}</h3>
          <p className="mt-2 text-sm text-neutral-500">
            {order.customerName} · {order.stateName ?? 'Sin estado'}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-stone-100"
        >
          Volver a tiempos por orden
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(135deg,_#171717_0%,_#404040_100%)] text-white shadow-[0_24px_60px_-40px_rgba(0,0,0,0.45)]">
        <div className="space-y-4 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-stone-100">
                  {order.orderNumber}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-stone-100">
                  {order.stateName ?? 'Sin estado'}
                </span>
              </div>
              <h4 className="mt-4 text-3xl font-semibold tracking-tight">{order.customerName}</h4>
            </div>

            <div className="w-full rounded-2xl bg-white/10 px-4 py-3 sm:w-auto sm:min-w-[180px]">
              <p className="text-xs uppercase tracking-wide text-stone-300">Total</p>
              <p className="mt-2 text-2xl font-semibold">{order.totalLabel}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-stone-300">Entrega estimada</p>
              <p className="mt-2 font-medium text-white">{order.deliveryLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-stone-300">Entrega real</p>
              <p className="mt-2 font-medium text-white">{order.actualDeliveryLabel ?? '-'}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-stone-300">Pago</p>
              <p className="mt-2 font-medium text-white">{order.paymentMethod}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_18px_50px_-42px_rgba(0,0,0,0.45)]">
          <h4 className="text-2xl font-semibold text-neutral-950">Cliente</h4>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-stone-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Nombre</p>
              <p className="mt-1 font-medium text-neutral-900">{order.customerName}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Whatsapp</p>
              <p className="mt-1 font-medium text-neutral-900">{order.customerWhatsapp}</p>
            </div>
            {order.notes ? (
              <div className="rounded-2xl bg-stone-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Notas</p>
                <p className="mt-1 font-medium text-neutral-900">{order.notes}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_-40px_rgba(0,0,0,0.28)]">
          <div className="border-b border-black/10 px-5 py-5">
            <h4 className="text-2xl font-semibold text-neutral-950">Detalle del pedido</h4>
          </div>
          <div className="p-5">
            {order.lines.length > 0 ? (
              <div className="space-y-3">
                {order.lines.map((line) => (
                  <div
                    key={line.id}
                    className="rounded-3xl border border-black/10 bg-stone-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h5 className="text-lg font-semibold text-neutral-900">{line.productName}</h5>
                        <p className="mt-1 text-sm text-neutral-500">
                          Cantidad solicitada: {line.quantity}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-700 shadow-sm">
                        {line.subtotalLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-6 text-sm text-neutral-500">
                La orden no tiene lineas cargadas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StateCycleTimeCard({
  report,
}: {
  report: {
    averages: {
      averageFormatted: string;
      averageMinutes: number;
      recordCount: number;
      stateId: number;
      stateName: string;
    }[];
    insights: { detail: string; title: string }[];
    isDefaultRange: boolean;
    orderCount: number;
    rangeEnd: string | null;
    rangeStart: string | null;
  };
}) {
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedStateName, setSelectedStateName] = useState('');
  const [detailItems, setDetailItems] = useState<MetricsStateDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);
  const requestSequenceRef = useRef(0);
  const orderRequestSequenceRef = useRef(0);

  const clearDetails = () => {
    requestSequenceRef.current += 1;
    orderRequestSequenceRef.current += 1;
    setSelectedStateId(null);
    setSelectedStateName('');
    setDetailItems([]);
    setDetailError(null);
    setDetailLoading(false);
    setSelectedOrderDetail(null);
    setOrderDetailLoading(false);
    setOrderDetailError(null);
  };

  const clearOrderDrilldown = () => {
    orderRequestSequenceRef.current += 1;
    setSelectedOrderDetail(null);
    setOrderDetailLoading(false);
    setOrderDetailError(null);
  };

  const loadStateDetails = async (state: {
    averageFormatted: string;
    averageMinutes: number;
    recordCount: number;
    stateId: number;
    stateName: string;
  }) => {
    if (selectedStateId === state.stateId) {
      clearDetails();
      return;
    }

    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;

      setSelectedStateId(state.stateId);
      setSelectedStateName(state.stateName);
      setDetailLoading(true);
      setDetailError(null);
      clearOrderDrilldown();

    try {
      const nextDetails = await getMetricsStateDetails(
        state.stateId,
        report.isDefaultRange
          ? undefined
          : {
              endDate: report.rangeEnd ?? undefined,
              startDate: report.rangeStart ?? undefined,
            },
      );

      if (requestSequenceRef.current !== requestId) {
        return;
      }

      setDetailItems(nextDetails);
    } catch {
      if (requestSequenceRef.current !== requestId) {
        return;
      }

      setDetailItems([]);
      setDetailError('No se pudo cargar el detalle de este estado.');
    } finally {
      if (requestSequenceRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    const requestId = orderRequestSequenceRef.current + 1;
    orderRequestSequenceRef.current = requestId;

    setOrderDetailLoading(true);
    setOrderDetailError(null);
    setSelectedOrderDetail(null);

    try {
      const response = await getOrderById(orderId);
      const normalizedOrder = normalizeOrderDetail(response);

      if (!normalizedOrder) {
        throw new Error('Invalid order payload');
      }

      if (orderRequestSequenceRef.current !== requestId) {
        return;
      }

      setSelectedOrderDetail(normalizedOrder);
    } catch {
      if (orderRequestSequenceRef.current !== requestId) {
        return;
      }

      setOrderDetailError('No se pudo cargar el detalle de la orden.');
    } finally {
      if (orderRequestSequenceRef.current === requestId) {
        setOrderDetailLoading(false);
      }
    }
  };

  return (
    <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Tiempos por estado
        </p>
      </div>

      <div className="mt-6">
        <div className="rounded-[28px] border border-black/10 bg-stone-50 p-4">
          <div>
            {selectedStateId === null ? (
              report.averages.length > 0 ? (
                <StateCycleTimeChart
                  items={report.averages}
                  onSelectState={(state) => void loadStateDetails(state)}
                  selectedStateId={selectedStateId}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-6 text-sm text-neutral-500">
                  No hay ordenes entregadas dentro del periodo seleccionado para calcular promedios por estado.
                </div>
              )
            ) : detailLoading ? (
              <div className="rounded-[24px] border border-black/10 bg-white p-5">
                <div className="h-28 animate-pulse rounded-2xl bg-stone-100" />
              </div>
            ) : detailError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                {detailError}
              </div>
            ) : selectedOrderDetail ? (
              <OrderDetailDrilldown
                order={selectedOrderDetail}
                onBack={clearOrderDrilldown}
              />
            ) : orderDetailLoading ? (
              <div className="rounded-[24px] border border-black/10 bg-white p-5">
                <div className="h-40 animate-pulse rounded-2xl bg-stone-100" />
              </div>
            ) : orderDetailError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                {orderDetailError}
              </div>
            ) : detailItems.length > 0 ? (
              <StateDetailChart
                items={detailItems}
                onBack={clearDetails}
                onSelectOrder={(orderId) => void loadOrderDetail(orderId)}
                stateName={selectedStateName}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-6 text-sm text-neutral-500">
                No hay ocurrencias del estado seleccionado dentro del periodo consultado.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CostAndProfitCard({
  report,
}: {
  report: {
    cost: number;
    orderCount: number;
    profit: number;
    profitMargin: number;
    revenue: number;
  };
}) {
  const safeRevenue = Math.max(report.revenue, 0);
  const costWidth = safeRevenue > 0 ? Math.min((report.cost / safeRevenue) * 100, 100) : 0;
  const profitWidth =
    safeRevenue > 0 ? Math.min((Math.abs(report.profit) / safeRevenue) * 100, 100) : 0;
  const marginTone =
    report.profit > 0
      ? 'text-emerald-700'
      : report.profit < 0
        ? 'text-red-700'
        : 'text-neutral-700';

  return (
    <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Costos y ganancias
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Margen</p>
          <p className={`mt-2 text-2xl font-semibold ${marginTone}`}>
            {formatPercentageLabel(report.profitMargin)}%
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-black/10 bg-stone-50 px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Facturacion</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {formatCurrency(report.revenue)}
          </p>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-stone-50 px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Costo</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {formatCurrency(report.cost)}
          </p>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-stone-50 px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Ganancia</p>
          <p className={`mt-3 text-3xl font-semibold ${marginTone}`}>
            {formatCurrency(report.profit)}
          </p>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-stone-50 px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Ordenes consideradas</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">{report.orderCount}</p>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-black/10 bg-stone-50 p-5">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-neutral-700">Costo sobre facturacion</span>
              <span className="text-neutral-500">{formatPercentageLabel(costWidth)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${costWidth}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-neutral-700">Ganancia sobre facturacion</span>
              <span className={marginTone}>{formatPercentageLabel(report.profitMargin)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full ${report.profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${profitWidth}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopSellingProductsChart({
  items,
}: {
  items: {
    productId: number;
    productName: string;
    quantitySold: number;
  }[];
}) {
  const chartData = items.map((item) => ({
    ...item,
    formattedValue: `${item.quantitySold}`,
  }));
  const chartColors = ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d', '#92400e'];

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-6 text-sm text-neutral-500">
        No hay productos vendidos dentro del periodo seleccionado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-black/10 bg-white p-4">
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Tooltip content={<MetricsTooltip />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              formatter={(value: string) => (
                <span className="text-sm text-neutral-700">{value}</span>
              )}
            />
            <Pie
              data={chartData}
              dataKey="quantitySold"
              nameKey="productName"
              cx="50%"
              cy="46%"
              innerRadius={58}
              outerRadius={112}
              paddingAngle={3}
              stroke="#fafaf9"
              strokeWidth={2}
            >
              <LabelList
                dataKey="formattedValue"
                position="outside"
                fill="#171717"
                fontSize={12}
              />
              {chartData.map((item, index) => (
                <Cell
                  key={item.productId}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopSellingProductsCard({
  report,
}: {
  report: {
    products: {
      categoryId: number | null;
      productId: number;
      productName: string;
      quantitySold: number;
      unitPrice: number | null;
    }[];
    totalProducts: number;
    totalProductsSold: number;
  };
}) {
  const rankedProducts = report.products.filter((product) => product.quantitySold > 0).slice(0, 5);

  return (
    <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
      <div className="mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Productos
          </p>
        </div>
      </div>

      <TopSellingProductsChart items={rankedProducts} />
    </section>
  );
}

function TopCustomersChart({
  items,
}: {
  items: {
    customerName: string;
    orders: number;
    revenue: number;
  }[];
}) {
  const chartColors = ['#1e3a8a', '#0f766e', '#7c3aed', '#be185d', '#334155'];
  const chartData = items.map((item, index) => ({
    ...item,
    color: chartColors[index % chartColors.length],
    formattedValue: `${item.orders}`,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-6 text-sm text-neutral-500">
        Todavia no hay clientes suficientes para destacar en el ranking.
      </div>
    );
  }

  return (
    <div className="grid gap-4 rounded-[24px] border border-black/10 bg-white p-4">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Tooltip content={<MetricsTooltip />} />
            <Pie
              data={chartData}
              dataKey="orders"
              nameKey="customerName"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={112}
              paddingAngle={4}
              stroke="#fafaf9"
              strokeWidth={3}
            >
              <LabelList
                dataKey="orders"
                position="outside"
                fill="#171717"
                fontSize={12}
              />
              {chartData.map((item, index) => (
                <Cell
                  key={`${item.customerName}-${index}`}
                  fill={item.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2">
        {chartData.map((item) => (
          <div
            key={item.customerName}
            className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-sm font-medium text-neutral-900">
                {item.customerName}
              </span>
            </div>
            <span className="text-sm font-semibold text-neutral-700">{item.orders}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetricsSection() {
  const { data, dateRange, error, loading, refresh, setDateRange } = useMetricsDashboard();
  const appliedDateRange = {
    endDate: dateRange.endDate || data?.stateCycleTimes.rangeEnd || '',
    startDate: dateRange.startDate || data?.stateCycleTimes.rangeStart || '',
  };

  if (loading && !data) {
    return (
      <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.10),_transparent_28%),linear-gradient(135deg,_#fafaf9_0%,_#f5f5f4_45%,_#fafaf9_100%)] p-4 sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="h-36 animate-pulse rounded-[32px] bg-white" />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-96 animate-pulse rounded-[32px] bg-white" />
            <div className="h-96 animate-pulse rounded-[32px] bg-white" />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-[32px] bg-white" />
            <div className="h-80 animate-pulse rounded-[32px] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.10),_transparent_28%),linear-gradient(135deg,_#fafaf9_0%,_#f5f5f4_45%,_#fafaf9_100%)] p-4 sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Dashboard administrativo
              </p>
            </div>

            <div className="grid w-full gap-3 md:grid-cols-[repeat(2,minmax(180px,1fr))] xl:w-auto xl:grid-cols-[repeat(2,minmax(180px,1fr))_auto_auto]">
              <label className="grid gap-2 text-sm text-neutral-700">
                <span className="font-medium">Fecha desde</span>
                <input
                  type="date"
                  value={appliedDateRange.startDate ? formatDateInputValue(appliedDateRange.startDate) : ''}
                  onChange={(event) =>
                    setDateRange((currentRange) => ({
                      ...currentRange,
                      startDate: event.target.value,
                    }))}
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400"
                />
              </label>

              <label className="grid gap-2 text-sm text-neutral-700">
                <span className="font-medium">Fecha hasta</span>
                <input
                  type="date"
                  value={appliedDateRange.endDate ? formatDateInputValue(appliedDateRange.endDate) : ''}
                  onChange={(event) =>
                    setDateRange((currentRange) => ({
                      ...currentRange,
                      endDate: event.target.value,
                    }))}
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400"
                />
              </label>

              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400 md:self-end"
              >
                Aplicar rango
              </button>

              <button
                type="button"
                onClick={() => void refresh({ startDate: '', endDate: '' })}
                disabled={loading}
                className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-neutral-400 md:self-end"
              >
                Usar default
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {data ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[28px] border border-black/10 bg-stone-50 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Facturacion total</p>
                <p className="mt-3 text-3xl font-semibold text-neutral-950">
                  {formatCurrency(data.summary.projectedRevenue)}
                </p>
              </div>
              <div className="rounded-[28px] border border-black/10 bg-stone-50 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Ticket promedio</p>
                <p className="mt-3 text-3xl font-semibold text-neutral-950">
                  {formatCurrency(data.summary.averageTicket)}
                </p>
              </div>
              <div className="rounded-[28px] border border-black/10 bg-stone-50 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Ordenes relevadas</p>
                <p className="mt-3 text-3xl font-semibold text-neutral-950">
                  {data.summary.totalOrders}
                </p>
              </div>
              <div className="rounded-[28px] border border-black/10 bg-stone-50 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Clientes unicos</p>
                <p className="mt-3 text-3xl font-semibold text-neutral-950">
                  {data.summary.uniqueCustomers}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {data ? <CostAndProfitCard report={data.costAndProfit} /> : null}

        {data ? (
          <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Horarios de entrega
              </p>
            </div>
            <DeliveryTimelineChart buckets={data.deliveryBuckets} />
          </section>
        ) : null}

        {data ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Clientes destacados
                </p>
              </div>

              <TopCustomersChart items={data.topCustomers} />

            </section>

            <TopSellingProductsCard report={data.topSellingProducts} />
          </div>
        ) : null}

        {data ? (
          <StateCycleTimeCard
            report={data.stateCycleTimes}
          />
        ) : null}
      </div>
    </div>
  );
}
