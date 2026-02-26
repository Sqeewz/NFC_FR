"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, CheckCircle2, Flame, BellRing, UtensilsCrossed, CheckCircle, Timer, ChefHat, CheckSquare } from "lucide-react";

export default function LiveMonitor() {
    const [orders, setOrders] = useState<any[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${apiUrl}/orders`);
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        }
    };

    const handleUpdateItemStatus = async (iid: number, newStatus: string) => {
        try {
            await fetch(`${apiUrl}/order-item/${iid}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchOrders();
        } catch (err) {
            console.error("Update item status failed:", err);
        }
    };

    useEffect(() => {
        fetchOrders();
        const wsUrl = apiUrl.replace('http', 'ws') + '/ws';
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const msg = event.data;
            if (msg.includes("New Order") || msg.includes("Item Update") || msg.includes("Table Update") || msg.includes("Order Update")) {
                if (msg.includes("New Order")) {
                    audioRef.current?.play();
                }
                fetchOrders();
            }
        };

        return () => socket.close();
    }, [apiUrl]);

    // Flatten items for Kanban
    const allItems = orders.flatMap(order =>
        order.items.map((item: any) => ({
            ...item,
            order_id: order.id,
            table_id: order.table_id,
            table_number: order.table_number,
            created_at: order.created_at
        }))
    );

    const statuses = [
        { id: 'pending', label: 'Pending', icon: Timer, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
        { id: 'cooking', label: 'Preparing', icon: ChefHat, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
        { id: 'served', label: 'Served', icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center bg-white p-6 rounded-4xl border border-zinc-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter transform -skew-x-6 uppercase flex items-center gap-3">
                        <UtensilsCrossed className="w-8 h-8 text-red-500" />
                        Kitchen Command
                    </h2>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Live Kanban Queue</p>
                </div>
                <div className="flex gap-4">
                    <span className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 rounded-2xl text-[0.65rem] font-black uppercase tracking-widest border border-red-100 shadow-sm">
                        <Flame className="w-4 h-4 fill-red-500/20" />
                        {allItems.length} Active Items
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[600px]">
                {statuses.map(status => (
                    <div key={status.id} className="flex flex-col gap-6">
                        <div className={`flex items-center justify-between p-5 rounded-3xl border ${status.border} ${status.bg}`}>
                            <div className="flex items-center gap-3">
                                <status.icon className={`w-5 h-5 ${status.color}`} />
                                <span className={`text-[0.65rem] font-black uppercase tracking-[0.2em] ${status.color}`}>
                                    {status.label}
                                </span>
                            </div>
                            <span className="text-[0.6rem] font-black px-2.5 py-1 bg-white rounded-lg shadow-sm">
                                {allItems.filter((i: any) => i.status === status.id).length}
                            </span>
                        </div>

                        <div className="flex-1 space-y-4">
                            {allItems.filter((i: any) => {
                                if (i.status !== status.id) return false;
                                if (i.status === 'served') {
                                    // Hide served items older than 24 hours
                                    const createdDate = new Date(i.created_at);
                                    const now = new Date();
                                    const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
                                    return diffHours < 24;
                                }
                                return true;
                            }).map((item: any) => (
                                <div key={item.id} className="bg-white border-2 border-zinc-50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group animate-in zoom-in-95 duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900">{item.product_name}</h3>
                                            <span className="text-[0.65rem] font-black text-red-500 uppercase italic transform -skew-x-6">Table {item.table_number}</span>
                                        </div>
                                        <span className="text-[0.6rem] font-bold text-zinc-400">#{item.order_id.toString().slice(-4)}</span>
                                    </div>

                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 rounded-lg">
                                            <span className="text-[0.65rem] font-black text-zinc-900 italic transform -skew-x-6">x{item.quantity}</span>
                                        </div>
                                        {item.note && (
                                            <span className="text-[0.55rem] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg italic">
                                                "{item.note}"
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {status.id === 'pending' && (
                                            <button
                                                onClick={() => handleUpdateItemStatus(item.id, 'cooking')}
                                                className="w-full h-10 bg-zinc-900 text-white rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                                            >
                                                Start Cooking
                                            </button>
                                        )}
                                        {status.id === 'cooking' && (
                                            <button
                                                onClick={() => handleUpdateItemStatus(item.id, 'served')}
                                                className="w-full h-10 bg-emerald-500 text-white rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                            >
                                                Mark Served
                                            </button>
                                        )}
                                        {status.id === 'served' && (
                                            <button
                                                onClick={() => handleUpdateItemStatus(item.id, 'cooking')}
                                                className="w-full h-10 bg-zinc-100 text-zinc-500 rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                                            >
                                                Back to Prep
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
        </div>
    );
}
