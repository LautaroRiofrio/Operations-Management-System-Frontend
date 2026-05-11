'use client'

import { useMetricsDashboard } from '@/app/hooks/useMetricsDashboard';
import { formatCurrency } from '@/app/services/metricsServices';

function getMaxValue(values: number[]) {
  return values.length > 0 ? Math.max(...values, 1) : 1;
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
  }).format(parsedDate);
}

function RevenueBarChart({
  items,
}: {
  items: { revenue: number; stateName: string }[];
}) {
  const maxRevenue = getMaxValue(items.map((item) => item.revenue));

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const width = `${Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 8 : 0)}%`;

        return (
          <div key={item.stateName} className="grid gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-neutral-800">{item.stateName}</span>
              <span className="text-sm text-neutral-500">{formatCurrency(item.revenue)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-neutral-900 transition-[width]"
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
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

function OrderDistributionChart({
  items,
}: {
  items: { count: number; stateName: string }[];
}) {
  const total = items.reduce((accumulator, item) => accumulator + item.count, 0);
  const colors = ['#171717', '#44403c', '#78716c', '#a8a29e', '#d6d3d1', '#f59e0b'];

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-stone-50 px-4 py-6 text-sm text-neutral-500">
        No hay volumen de ordenes para mostrar la distribucion actual.
      </div>
    );
  }

  const segments = items.map((item, index) => {
    const previousCount = items
      .slice(0, index)
      .reduce((accumulator, currentItem) => accumulator + currentItem.count, 0);

    return {
      color: colors[index % colors.length],
      dash: (item.count / total) * 282.743,
      offset: (previousCount / total) * 282.743,
      stateName: item.stateName,
    };
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[160px_minmax(0,1fr)] lg:items-center">
      <div className="mx-auto h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {segments.map((segment) => (
              <circle
                key={segment.stateName}
                cx="60"
                cy="60"
                r="45"
                fill="transparent"
                stroke={segment.color}
                strokeWidth="18"
                strokeDasharray={`${segment.dash} ${282.743 - segment.dash}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
              />
          ))}
          <circle cx="60" cy="60" r="28" fill="white" />
          <text
            x="60"
            y="57"
            textAnchor="middle"
            className="fill-neutral-900 text-[16px] font-semibold"
            transform="rotate(90 60 60)"
          >
            {total}
          </text>
          <text
            x="60"
            y="72"
            textAnchor="middle"
            className="fill-neutral-500 text-[8px]"
            transform="rotate(90 60 60)"
          >
            ordenes
          </text>
        </svg>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => {
          const percentage = Math.round((item.count / total) * 100);

          return (
            <div key={item.stateName} className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm font-medium text-neutral-800">{item.stateName}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-900">{item.count}</p>
                <p className="text-xs text-neutral-500">{percentage}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
  const { data, error, loading, refresh } = useMetricsDashboard();

  if (loading && !data) {
    return (
      <div className="h-full overflow-auto bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.10),_transparent_28%),linear-gradient(135deg,_#fafaf9_0%,_#f5f5f4_45%,_#fafaf9_100%)] p-6">
        <div className="grid gap-6">
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
    <div className="h-full overflow-auto bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.10),_transparent_28%),linear-gradient(135deg,_#fafaf9_0%,_#f5f5f4_45%,_#fafaf9_100%)] p-6">
      <div className="grid gap-6">
        <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Dashboard administrativo
              </p>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
                  Metricas operativas
                </h1>
                <p className="max-w-3xl text-sm text-neutral-500">
                  Vista consolidada del volumen actual, facturacion proyectada, clientes mas
                  activos y horarios de entrega. Las metricas de margen y tiempos por estado quedan
                  visibles con su dependencia explicita de backend.
                </p>
                {data ? (
                  <p className="text-sm text-neutral-400">
                    Facturacion y ticket usando
                    {' '}
                    {data.summary.isDefaultBillingRange ? 'el rango mensual por defecto' : 'un rango personalizado'}
                    : {formatDateLabel(data.summary.billingPeriodStart)} al {formatDateLabel(data.summary.billingPeriodEnd)}.
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
            >
              Actualizar metricas
            </button>
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
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Ingresos por estado
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                  Facturacion proyectada por etapa
                </h2>
              </div>
              <RevenueBarChart items={data.byState} />
            </section>

            <section className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.18)]">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Volumen actual
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                  Distribucion de ordenes por estado
                </h2>
              </div>
              <OrderDistributionChart items={data.byState} />
            </section>
          </div>
        ) : null}

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
          <div className="grid gap-6 xl:grid-cols-2">
            <MissingMetricCard
              title="Ganancias vs costos"
              endpoint={data.missingMetrics.profitVsCost.endpoint}
              reason={data.missingMetrics.profitVsCost.reason}
              shape={data.missingMetrics.profitVsCost.shape}
              whyItHelps={data.missingMetrics.profitVsCost.whyItHelps}
            />
            <MissingMetricCard
              title="Tiempos promedio por estado"
              endpoint={data.missingMetrics.stateCycleTimes.endpoint}
              reason={data.missingMetrics.stateCycleTimes.reason}
              shape={data.missingMetrics.stateCycleTimes.shape}
              whyItHelps={data.missingMetrics.stateCycleTimes.whyItHelps}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
