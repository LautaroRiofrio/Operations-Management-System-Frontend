'use client'

import { useRef, useState } from 'react';
import { normalizeOrderDetail } from '@/app/lib/orderAdapters';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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

function getMaxValue(values: number[]) {
  return values.length > 0 ? Math.max(...values, 1) : 1;
}

function formatDateLabel(value: string | null) {
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
  }).format(parsedDate);
}

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
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-neutral-950">{label}</p>
      <p className="mt-1 text-sm text-neutral-600">{formattedValue}</p>
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
  const maxCount = getMaxValue(buckets.map((bucket) => bucket.count));

  if (buckets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-6 text-sm text-neutral-500">
        Todavia no hay horarios de entrega utilizables para graficar.
      </div>
    );
  }

  const chartWidth = 720;
  const chartHeight = 260;
  const paddingX = 24;
  const paddingTop = 20;
  const paddingBottom = 34;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = buckets.length > 1 ? innerWidth / (buckets.length - 1) : 0;

  const points = buckets.map((bucket, index) => {
    const x = paddingX + stepX * index;
    const y =
      paddingTop + innerHeight - (bucket.count / maxCount) * innerHeight;

    return {
      ...bucket,
      x,
      y,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${paddingX + innerWidth} ${chartHeight - paddingBottom} L ${paddingX} ${chartHeight - paddingBottom} Z`;
  const yAxisLabels = Array.from({ length: 4 }).map((_, index) => {
    const value = Math.round((maxCount / 3) * (3 - index));
    const y = paddingTop + (innerHeight / 3) * index;

    return { value, y };
  });

  return (
    <div className="rounded-[28px] border border-black/10 bg-stone-50 p-4">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-auto w-full">
        <defs>
          <linearGradient id="deliveryArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {yAxisLabels.map((label) => (
          <g key={`${label.value}-${label.y}`}>
            <line
              x1={paddingX}
              x2={paddingX + innerWidth}
              y1={label.y}
              y2={label.y}
              stroke="#d6d3d1"
              strokeDasharray="4 6"
            />
            <text
              x={4}
              y={label.y + 4}
              className="fill-neutral-500 text-[10px]"
            >
              {label.value}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#deliveryArea)" />
        <path
          d={linePath}
          fill="none"
          stroke="#111827"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#f59e0b" stroke="#111827" strokeWidth="2" />
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              className="fill-neutral-600 text-[10px]"
            >
              {point.count}
            </text>
            <text
              x={point.x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="fill-neutral-500 text-[10px]"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
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
    <div className="overflow-x-auto rounded-[24px] border border-black/10 bg-white p-4">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 56, bottom: 8, left: 8 }}
            barCategoryGap={18}
          >
            <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 6" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#737373', fontSize: 12 }}
              tickFormatter={(value: number) => `${formatMinutesLabel(value)} min`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="stateName"
              width={120}
              tick={{ fill: '#171717', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<MetricsTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }} />
            <Bar dataKey="averageMinutes" radius={[0, 18, 18, 0]}>
              <LabelList
                dataKey="averageFormatted"
                position="right"
                offset={12}
                fill="#171717"
                fontSize={12}
              />
              {chartData.map((item) => (
                <Cell
                  key={item.stateId}
                  fill={selectedStateId === item.stateId ? '#d97706' : '#f59e0b'}
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

      <div className="overflow-x-auto rounded-[24px] border border-black/10 bg-white p-4">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 12, bottom: 16, left: 0 }}>
              <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="orderLabel"
                tick={{ fill: '#171717', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#737373', fontSize: 12 }}
                tickFormatter={(value: number) => `${formatMinutesLabel(value)} min`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<MetricsTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }} />
              <Bar dataKey="timeMinutes" radius={[18, 18, 0, 0]}>
                <LabelList
                  dataKey="formattedValue"
                  position="top"
                  offset={8}
                  fill="#171717"
                  fontSize={12}
                />
                {chartData.map((item) => (
                  <Cell
                    key={`${item.orderId}-${item.start ?? 'sin-inicio'}-${item.end ?? 'sin-fin'}`}
                    fill="#f59e0b"
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
  appliedDateRange,
  report,
}: {
  appliedDateRange: { endDate: string; startDate: string };
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
        <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
          Cuellos de botella del flujo entregado
        </h2>
      </div>

      <div className="mt-6">
        <div className="rounded-[28px] border border-black/10 bg-stone-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Periodo aplicado
              </p>
              <p className="mt-2 text-sm font-medium text-neutral-900">
                {formatDateLabel(appliedDateRange.startDate)} al {formatDateLabel(appliedDateRange.endDate)}
              </p>
            </div>
          </div>

          <div className="mt-4">
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

function MissingMetricCard({
  endpoint,
  reason,
  shape,
  title,
  whyItHelps,
}: {
  endpoint: string;
  reason: string;
  shape: string;
  title: string;
  whyItHelps: string;
}) {
  return (
    <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
            Requiere backend
          </p>
          <h3 className="mt-2 text-xl font-semibold text-amber-950">{title}</h3>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800">
          Bloqueada
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="rounded-2xl border border-dashed border-amber-300 bg-white px-4 py-6">
          <div className="grid h-28 grid-cols-6 items-end gap-2">
            {[24, 56, 36, 72, 48, 60].map((height, index) => (
              <div
                key={index}
                className="rounded-t-xl bg-amber-100"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 text-sm text-amber-950">
          <p>{reason}</p>
          <p>
            <span className="font-semibold">Endpoint sugerido:</span> <code>{endpoint}</code>
          </p>
          <p>
            <span className="font-semibold">Respuesta esperada:</span> <code>{shape}</code>
          </p>
          <p>
            <span className="font-semibold">Por que optimiza:</span> {whyItHelps}
          </p>
        </div>
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
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
                Metricas operativas
              </h1>
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

        {data ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
            <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Horarios de entrega
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                  Concentracion de pedidos por franja
                </h2>
              </div>
              <DeliveryTimelineChart buckets={data.deliveryBuckets} />
            </section>

            <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Clientes destacados
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                  Top clientes por facturacion
                </h2>
              </div>

              <div className="grid gap-3">
                {data.topCustomers.length > 0 ? (
                  data.topCustomers.map((customer, index) => (
                    <div
                      key={`${customer.customerName}-${index}`}
                      className="rounded-2xl bg-stone-50 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-neutral-900">{customer.customerName}</p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {customer.orders} ordenes registradas
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-neutral-900">
                          {formatCurrency(customer.revenue)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-6 text-sm text-neutral-500">
                    Todavia no hay clientes suficientes para destacar en el ranking.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-black/10 bg-neutral-950 px-4 py-4 text-white">
                <p className="text-xs uppercase tracking-wide text-neutral-400">Extra sugerida</p>
                <h3 className="mt-2 text-lg font-semibold">Pedidos listos para entrega</h3>
                <p className="mt-2 text-3xl font-semibold">{data.readyOrders.length}</p>
              </div>
            </section>
          </div>
        ) : null}

        {data ? (
          <StateCycleTimeCard
            report={data.stateCycleTimes}
            appliedDateRange={appliedDateRange}
          />
        ) : null}

        {data ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <MissingMetricCard
              title="Ganancias vs costos"
              endpoint={data.missingMetrics.profitVsCost.endpoint}
              reason={data.missingMetrics.profitVsCost.reason}
              shape={data.missingMetrics.profitVsCost.shape}
              whyItHelps={data.missingMetrics.profitVsCost.whyItHelps}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
