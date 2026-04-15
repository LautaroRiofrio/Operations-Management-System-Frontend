'use client'

const Product = () => {
    return (
        <div className="flex bg-[#00000020] px-3 py-2 rounded-full">
            <div className="flex-1">
                <span>Mad Max</span>
            </div>
            <div className="flex-1">
                <span>$7.000</span>
            </div>
            <div className="flex flex-[0.5] justify-between">
                <img src="plus.svg" alt="" />
                <img src="gear.svg" alt="" />
            </div>
        </div>
    );
}

export default Product;