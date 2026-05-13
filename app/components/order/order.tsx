'use client'

import type { OrderCardProps } from '@/types';

const Order = ({ order, isSelected, onSelect }: OrderCardProps) => {
    const detailRows = [
        { label: 'Entrega', value: order.deliveryLabel },
        { label: 'Total', value: order.totalLabel },
    ];

    return (
        <button
            type="button"
            className={`group flex flex-col gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                isSelected
                    ? 'border-black/70 bg-regal-gris-hover text-white shadow-lg shadow-black/20'
                    : 'border-black/10 bg-white text-neutral-900 shadow-sm hover:border-black/20 hover:bg-neutral-50 hover:shadow-md'
            }`}
            onClick={() => onSelect(order.id)}
        >
            <div className="flex items-start justify-between gap-4">
                <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold tracking-wide ${
                        isSelected ? 'bg-white/15 text-white' : 'bg-black/5 text-neutral-700'
                    }`}
                >
                    {order.orderNumber}
                </span>
                <h3 className="text-right text-base font-semibold leading-tight">{order.customerName}</h3>
            </div>
            <div className="space-y-3">
                {detailRows.map((detail) => (
                    <div key={detail.label} className="flex items-baseline justify-between gap-4">
                        <span
                            className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                isSelected ? 'text-white/70' : 'text-neutral-500'
                            }`}
                        >
                            {detail.label}
                        </span>
                        <span className="text-right text-sm font-medium leading-snug">{detail.value}</span>
                    </div>
                ))}
            </div>
        </button>
    )
}

export default Order;
