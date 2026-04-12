'use client'

const Menu = () => {
    return (

        <div className="flex h-14 py-2 px-10 ">
            <h1 className="flex-1 text-2xl">Operations Management System</h1>
            <div className="flex gap-5 flex-1 ">
                <button className="flex-1 px-2 py-1 rounded-md bg-[#303030] hover:bg-[#101010] text-white">Recepción</button>
                <button className="flex-1 px-2 py-1 rounded-md bg-[#303030] hover:bg-[#101010] text-white">Producción</button>
                <button className="flex-1 px-2 py-1 rounded-md bg-[#303030] hover:bg-[#101010] text-white">Entrega</button>
                <button className="flex-1 px-2 py-1 rounded-md bg-[#303030] hover:bg-[#101010] text-white">Administrativo</button>
            </div>
            

        </div>

    );
}

export default Menu;