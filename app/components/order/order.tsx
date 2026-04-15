'use client'

import type { OrderCardProps } from '@/types';

const Order = ({setMode}: OrderCardProps) => {
    return (
        <button className="flex flex-col gap-2 bg-regal-gris p-5 rounded-xl hover:bg-regal-gris-hover" onClick={() => {
            setMode("ver");
            
        }}  >
            <div className="flex justify-between">
                <h1>#999</h1>
                <h3>Esteban</h3>
            </div>
            <div className="flex justify-between">
                <h3>Entrega:</h3>
                <h3>Today 17:00hs</h3>
            </div>
            <div className="flex justify-between">
                <h3>Total:</h3>
                <h3>$42.700</h3>
            </div>
        </button>
    )
}

export default Order;
