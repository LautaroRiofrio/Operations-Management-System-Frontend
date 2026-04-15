'use client'

import Product from "./product";

const Products = () => {
    return (
        <div className="flex h-full min-h-0 flex-col gap-5 rounded-xl bg-regal-gris px-5 py-5">
            <h2 className="text-2xl font-bold">Productos</h2>
            <div className="flex gap-2 rounded-xl bg-[#00000050] px-2 py-2">
                <button><img src="/arrow.svg" width={15} /></button>
                <button className="flex-1 rounded-lg bg-[#00000050] px-2 py-1 text-white">Hamburguesa</button>
                <button className="flex-1 rounded-lg bg-[#00000050] px-2 py-1 text-white">Pizza</button>
                <button className="flex-1 rounded-lg bg-[#00000050] px-2 py-1 text-white">Papas</button>
                <button><img src="/arrow.svg" className="rotate-180" width={15} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col gap-2">
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                    <Product />
                </div>
            </div>
        </div>
    );
}

export default Products;
