"use client";

import { CartItem } from "../types";

interface CartProps {
    items: CartItem[];
    onSubmit: () => void;
}

export default function Cart({ items, onSubmit }: CartProps) {
    const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = items.reduce((acc, item) => {
        const price = typeof item.price === "string" ? parseFloat(item.price) : item.price;
        return acc + price * item.quantity;
    }, 0);

    if (totalCount === 0) return null;

    return (
        <div className="flex-1">
            <button
                onClick={onSubmit}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/30 flex justify-between items-center transition-all active:scale-98"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 px-2 py-0.5 rounded text-sm">{totalCount}</div>
                    <span>Place Order</span>
                </div>
                <span className="text-lg">${totalPrice.toFixed(2)}</span>
            </button>
        </div>
    );
}
