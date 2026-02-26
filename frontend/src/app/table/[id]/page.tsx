"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ProductList from "../../../components/ProductList";
import Cart from "../../../components/Cart";
import ServiceButton from "../../../components/ServiceButton";
import { Product, CartItem } from "../../../types";
import { X, ShoppingBag, ChevronRight } from "lucide-react";

function TableContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const tableId = params.id as string;
    const sessionToken = searchParams.get("s");

    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
    const [realTableId, setRealTableId] = useState<number | null>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSessionToken, setActiveSessionToken] = useState<string | null>(sessionToken);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    useEffect(() => {
        const validate = async () => {
            try {
                const query = sessionToken ? `?s=${sessionToken}` : "";
                const res = await fetch(`${apiUrl}/table/${tableId}/validate${query}`);
                const data = await res.json();

                setIsValidSession(data.valid);
                if (data.valid) {
                    setRealTableId(data.table_id);
                    setActiveSessionToken(data.session_token);
                }
            } catch (err) {
                console.error("Validation error:", err);
                setIsValidSession(false);
            } finally {
                setIsValidating(false);
            }
        };
        validate();
    }, [tableId, sessionToken, apiUrl]);

    useEffect(() => {
        if (isValidSession) {
            fetch(`${apiUrl}/menu`)
                .then((res) => res.json())
                .then((data) => setProducts(data))
                .catch(err => console.error("Fetch error:", err));
        }
    }, [isValidSession, apiUrl]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const submitOrder = async () => {
        if (realTableId === null) {
            alert("Table session error. Please refresh.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${apiUrl}/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    table_id: realTableId,
                    session_token: activeSessionToken,
                    items: cart.map((item) => ({
                        product_id: item.id,
                        quantity: item.quantity,
                    })),
                }),
            });

            if (response.ok) {
                alert("Order placed successfully!");
                setCart([]);
                setIsOrderSummaryOpen(false);
            } else {
                const err = await response.text();
                alert(`Order failed: ${err}`);
            }
        } catch (err) {
            console.error("Order error:", err);
            alert("Connection error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isValidating) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-zinc-500">Validating Session...</p>
                </div>
            </div>
        );
    }

    if (!isValidSession) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white p-6">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <h1 className="text-2xl font-black text-red-500">!</h1>
                    </div>
                    <h1 className="text-2xl font-black italic tracking-tighter uppercase transform -skew-x-6 mb-2">Unauthorized Access</h1>
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                        This table session is either invalid or expired. Please scan the QR code/NFC tag on your table to start ordering.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white pb-24">
            <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
                <div className="max-w-xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Table {tableId}</h1>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
            </header>

            <div className="max-w-xl mx-auto p-4">
                <ProductList products={products} onAdd={addToCart} />
            </div>

            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black via-black/90 to-transparent">
                <div className="max-w-xl mx-auto flex gap-4">
                    <Cart items={cart} onSubmit={() => setIsOrderSummaryOpen(true)} />
                    <ServiceButton tableId={tableId} />
                </div>
            </footer>

            {/* Order Summary Modal */}
            {isOrderSummaryOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 w-full max-w-xl rounded-t-[2.5rem] sm:rounded-4xl overflow-hidden animate-in slide-in-from-bottom-full duration-500 shadow-2xl sm:border border-white/5">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic tracking-tighter uppercase transform -skew-x-6">Confirm Order</h2>
                                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-zinc-500">Review your tray items</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOrderSummaryOpen(false)}
                                className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center group">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[0.65rem] font-black group-hover:border-orange-500/30 transition-colors">
                                                x{item.quantity}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight text-white">{item.name}</p>
                                                <p className="text-[0.6rem] font-bold uppercase text-zinc-500 tracking-widest">${(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)} each</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-white transform -skew-x-3">
                                            ${((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-900 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-[0.5rem] font-black uppercase text-zinc-500 tracking-widest mb-1">Total Amount</p>
                                    <p className="text-4xl font-black italic tracking-tighter transform -skew-x-6 text-orange-500">
                                        ${cart.reduce((acc, item) => acc + (typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity, 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[0.5rem] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">Table</p>
                                    <p className="text-xl font-black italic tracking-tighter transform -skew-x-6">#{tableId}</p>
                                </div>
                            </div>

                            <button
                                onClick={submitOrder}
                                disabled={isSubmitting}
                                className="w-full h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Confirm & Send to Kitchen
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function TablePage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen text-white flex items-center justify-center">Loading Menu...</div>}>
            <TableContent />
        </Suspense>
    );
}
