'use client'

import type { OrderCardProps } from '@/types';

const Order = ({ order, isSelected, onSelect }: OrderCardProps) => {
    return (
        <button
            type="button"
            className={`flex flex-col gap-2 rounded-xl p-5 text-left transition-colors ${
                isSelected
                    ? 'bg-regal-gris-hover text-white'
                    : 'bg-regal-gris hover:bg-regal-gris-hover hover:text-white'
            }`}
            onClick={() => onSelect(order.id)}
        >
            <div className="flex justify-between">
                <h1>{order.orderNumber}</h1>
                <h3>{order.customerName}</h3>
            </div>
            <div className="flex justify-between">
                <h3>Entrega:</h3>
                <h3>{order.deliveryLabel}</h3>
            </div>
            <div className="flex justify-between">
                <h3>Total:</h3>
                <h3>{order.totalLabel}</h3>
            </div>
        </button>
    )
}

export default Order;
