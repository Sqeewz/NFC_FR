"use client";

import { Plus } from "lucide-react";
import { Product } from "../types";

interface ProductListProps {
    products: Product[];
    onAdd: (product: Product) => void;
}

export default function ProductList({ products, onAdd }: ProductListProps) {
    return (
        <div className="grid grid-cols-1 gap-4">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="flex justify-between items-center bg-gray-900 border border-gray-800 p-4 rounded-2xl hover:border-orange-500/50 transition-colors group"
                >
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl">🍜</span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-100">{product.name}</h3>
                            <p className="text-sm text-gray-500">{product.category}</p>
                            <p className="text-orange-500 font-bold mt-1">
                                ${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onAdd(product)}
                        className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
}
