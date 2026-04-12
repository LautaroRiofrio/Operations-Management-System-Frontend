'use client'

import Products from "./products";

const OrderForm = () => {
    return (
        <div className="grid h-full min-h-0 grid-cols-2 gap-5 p-5">
            <div className="flex min-h-0 flex-col gap-10 overflow-hidden">
                <div>
                    <h2 className="text-2xl font-bold">¿Quién?</h2>
                    <div className="flex rounded-full bg-white px-5 py-2">
                        <img src="/profile.svg" alt="profile" className="px-2" />
                        <input type="text" placeholder="Cliente..." className="w-full" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Método de pago</h2>
                    <div className="flex gap-2">
                        <button className="flex-1 rounded-xl bg-white py-3">Efectivo</button>
                        <button className="flex-1 rounded-xl bg-white py-3">Transferencia</button>
                        <button className="flex-1 rounded-xl bg-white py-3">Débito</button>
                    </div>
                </div>
                <div className="min-h-0 flex-1">
                    <Products />
                </div>
            </div>
            <div className="min-h-0"></div>
        </div>
    )
}

export default OrderForm;
