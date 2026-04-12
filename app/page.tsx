'use client'

import { useEffect, useState } from "react";
import "./globals.css";
import { searchClients } from "./services/client.services";
import Order from "./components/order/order";
import OrderForm from "./components/orderForm/orderForm";
import  Menu from "./components/menu/menu";

export default function Home() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await searchClients();
        setClientes(data);
        console.log(data);
      } catch (error) {
        console.log("Error cargando clientes", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="flex flex-col h-dvh overflow-hidden">
      <Menu></Menu>

      <div className="grid h-full w-full min-h-0 grid-cols-[40%_60%] overflow-hidden">
        <section className="min-h-0 overflow-hidden border-r border-black/10">
          <div className="flex h-full min-h-0 flex-col gap-5 p-5">
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-blue-200 px-5 py-2">
                <input
                  className="w-full bg-transparent outline-none"
                  placeholder="Buscar..."
                />
              </div>
              <button className="bg-gray-200 px-3">filtro</button>
            </div>

            <div className="flex gap-2 rounded-lg bg-gray-200 px-5 py-2">
              <button className="flex-1 rounded-sm bg-regal-gris p-1 hover:bg-regal-gris-hover hover:text-white">
                Pediente
              </button>
              <button className="flex-1 rounded-sm bg-regal-gris p-1 hover:bg-regal-gris-hover hover:text-white">
                En Producción
              </button>
              <button className="flex-1 rounded-sm bg-regal-gris p-1 hover:bg-regal-gris-hover hover:text-white">
                Listo
              </button>
              <button className="flex-1 rounded-sm bg-regal-gris p-1 hover:bg-regal-gris-hover hover:text-white">
                En Camino
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-5 pb-20">
                <Order />
                <Order />
                <Order />
                <Order />
                <Order />
                <Order />


              </div>
            </div>
          </div>
        </section>

        <section className="min-h-0 overflow-hidden bg-neutral-100">
          <OrderForm />
        </section>
      </div>
    </main>
  );
}
