"use client";

import { useState, useEffect } from "react";
import {
    Shield,
    ChevronLeft,
    Bell,
    LogOut,
    LayoutDashboard,
    Table as TableIcon,
    Package,
    UserPlus,
    Receipt,
    CheckCircle2,
    XCircle,
    Clock
} from "lucide-react";
import Link from "next/link";
import LiveMonitor from "../../components/LiveMonitor";

// Mock Data
const INITIAL_TABLES = [
    { id: "T1", status: "CALLING BILL", session: "0015cdde-5bfd-4c92-b5c8-e002720c8815", isAttention: true },
    { id: "T2", status: "AVAILABLE", isAttention: false },
    { id: "T3", status: "AVAILABLE", isAttention: false },
    { id: "T4", status: "AVAILABLE", isAttention: false },
    { id: "T5", status: "AVAILABLE", isAttention: false },
    { id: "T6", status: "AVAILABLE", isAttention: false },
];

export default function StaffPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState("");
    const [tables, setTables] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("TABLES");
    const [isStockUnlocked, setIsStockUnlocked] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedTableForBill, setSelectedTableForBill] = useState<any>(null);
    const [billItems, setBillItems] = useState<any[]>([]);
    const [isBillOpen, setIsBillOpen] = useState(false);
    const [now, setNow] = useState(new Date());

    // Update current time every second for duration tracking
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getDuration = (startTime: string) => {
        if (!startTime) return "";
        const start = new Date(startTime + "Z"); // Add Z to indicate UTC if needed, backend sends naive_utc
        const diff = now.getTime() - start.getTime();
        if (diff < 0) return "0s";
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    // Fetch Data from Backend
    useEffect(() => {
        if (isAuthenticated) {
            fetchTables();
            fetchProducts();

            // WebSocket for real-time updates
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const wsUrl = apiUrl.replace('http', 'ws') + '/ws';
            const socket = new WebSocket(wsUrl);

            socket.onmessage = (event) => {
                const msg = event.data;
                if (msg.includes("New Order") || msg.includes("Item Update") || msg.includes("Table Update") || msg.includes("Order Update")) {
                    fetchTables();
                    if (activeTab === "ORDERS") {
                        // LiveMonitor will handle its own refresh if mounted, 
                        // but we might want to trigger something here if needed.
                        // Actually, since fetchTables is called, and LiveMonitor is a child,
                        // it might be better to centralize fetching if possible, but for now this is fine.
                    }
                }
            };

            const interval = setInterval(() => {
                fetchTables();
            }, 10000); // Relax polling since we have WS

            return () => {
                clearInterval(interval);
                socket.close();
            };
        }
    }, [isAuthenticated, activeTab]);

    const fetchTables = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/tables`);
            const data = await res.json();
            setTables(data);
        } catch (err) {
            console.error("Failed to fetch tables:", err);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/menu`);
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    const generateToken = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase() +
            Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            let sessionToken = null;

            // If closing a table, check if all items are served
            if (newStatus === 'available') {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/table/${id}/bill`);
                const items = await res.json();
                if (items.length > 0 && items.some((i: any) => i.status !== 'served')) {
                    const confirmClose = window.confirm("WARNING: Some items are still pending/cooking. Closing the table will clear the session. Proceed anyway?");
                    if (!confirmClose) return;
                }
                sessionToken = null;
            } else if (newStatus === 'occupied') {
                sessionToken = generateToken();
            } else {
                // Keep existing token for other status changes (like 'calling bill')
                const table = tables.find(t => t.id === id);
                sessionToken = table?.current_session_token;
            }

            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/table/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    current_session_token: sessionToken
                })
            });
            fetchTables(); // Refresh
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    const handleBillClick = async (table: any) => {
        setSelectedTableForBill(table);
        setIsBillOpen(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/table/${table.id}/bill`);
            const data = await res.json();
            setBillItems(data);
        } catch (err) {
            console.error("Failed to fetch bill:", err);
            setBillItems([]);
        }
    };

    const handleStockClick = () => {
        if (isStockUnlocked) {
            setActiveTab("STOCK");
        } else {
            const input = window.prompt("Enter Stock Access Code:");
            if (input === "5465") {
                setIsStockUnlocked(true);
                setActiveTab("STOCK");
            } else if (input !== null) {
                alert("Incorrect Code");
            }
        }
    };

    const handleTabClick = (tab: string) => {
        if (tab === "STOCK") {
            handleStockClick();
        } else {
            setActiveTab(tab);
        }
    };


    // Handle Passcode Input
    const handleKeypress = (num: string) => {
        if (passcode.length < 4) {
            const newPasscode = passcode + num;
            setPasscode(newPasscode);
            if (newPasscode === "1234") {
                setTimeout(() => setIsAuthenticated(true), 300);
            }
        }
    };

    const handleDelete = () => {
        setPasscode(passcode.slice(0, -1));
    };

    if (!isAuthenticated) {
        return (
            <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden">
                {/* Background Glow - Forced to the bottom */}
                <div
                    className="fixed inset-0 bg-red-900/5 rounded-full blur-[120px] pointer-events-none"
                    style={{ zIndex: -1, transform: 'translate(-50%, -50%)', top: '50%', left: '50%', width: '100vw', height: '100vw' }}
                />

                <div className="relative z-50 flex flex-col items-center w-full max-w-xs">
                    {/* Back to Home Icon */}
                    <Link href="/" className="absolute -top-16 left-0 text-zinc-600 hover:text-white transition-colors p-2">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>

                    <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center mb-12 shadow-2xl relative">
                        <Shield className="text-red-500 w-8 h-8" />
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                    </div>

                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-black italic tracking-tighter transform -skew-x-6 mb-1 uppercase text-white">Staff Access</h1>
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-zinc-500">NFC Relay Command Center</p>
                    </div>

                    {/* Passcode Dots */}
                    <div className="flex gap-4 mb-12">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-full border border-zinc-800 transition-all duration-300 ${passcode.length > i ? "bg-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-125" : ""
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-3 w-full mb-12 relative z-60">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => {
                                    console.log("Pressed:", num);
                                    handleKeypress(num.toString());
                                }}
                                className="h-16 rounded-2xl bg-zinc-900/80 border border-white/5 text-2xl font-bold hover:bg-zinc-800 hover:border-red-500/50 transition-all active:scale-90 cursor-pointer flex items-center justify-center shadow-lg active:bg-red-500/10"
                            >
                                {num}
                            </button>
                        ))}
                        <div />
                        <button
                            type="button"
                            onClick={() => handleKeypress("0")}
                            className="h-16 rounded-2xl bg-zinc-900/80 border border-white/5 text-2xl font-bold hover:bg-zinc-800 hover:border-red-500/50 transition-all active:scale-90 cursor-pointer flex items-center justify-center p-0 m-0 shadow-lg active:bg-red-500/10"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="h-16 rounded-2xl bg-zinc-900/80 border border-white/5 text-[0.6rem] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 hover:text-white hover:border-red-500/50 transition-all active:scale-90 cursor-pointer flex items-center justify-center shadow-lg active:bg-red-500/10"
                        >
                            DEL
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setPasscode("")}
                        className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-red-500 transition-colors cursor-pointer py-2 px-4"
                    >
                        Reset Terminal
                    </button>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 font-sans">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-100 px-6 flex items-center justify-between z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-black italic tracking-tighter text-sm">N</div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[0.6rem] font-black uppercase text-red-500 tracking-widest">NFC Resto</span>
                            <span className="text-lg font-black italic tracking-tighter uppercase mr-2 transform -skew-x-6">Staff Hub</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <button
                            onClick={() => handleTabClick("ORDERS")}
                            className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "ORDERS" ? "text-red-500" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Orders
                        </button>
                        <button
                            onClick={() => handleTabClick("TABLES")}
                            className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "TABLES" ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            <TableIcon className="w-4 h-4" />
                            Tables
                        </button>
                        <button
                            onClick={() => handleTabClick("STOCK")}
                            className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "STOCK" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            <Package className="w-4 h-4" />
                            Stock
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => {
                                setActiveTab("TABLES");
                                // Maybe filter or scroll to attention tables later
                            }}
                            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors relative cursor-pointer"
                        >
                            <Bell className="w-5 h-5 text-zinc-400" />
                            {tables.filter(t => t.status?.toLowerCase() === "calling bill").length > 0 && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                    {tables.filter(t => t.status?.toLowerCase() === "calling bill").length}
                                </div>
                            )}
                        </button>
                    </div>
                    <button
                        onClick={() => setIsAuthenticated(false)}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                {activeTab === "TABLES" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {tables.map((table) => {
                            const isAttention = table.status?.toLowerCase() === "calling bill";
                            const isOccupied = table.status?.toLowerCase() === "occupied" || isAttention;

                            return (
                                <div
                                    key={table.id}
                                    className={`group relative bg-white border-2 rounded-4xl p-6 transition-all duration-300 ${isAttention
                                        ? "border-amber-100 shadow-[0_20px_40px_-15px_rgba(245,158,11,0.1)]"
                                        : isOccupied
                                            ? "border-red-100 shadow-[0_20px_40px_-15px_rgba(239,68,68,0.05)]"
                                            : "border-zinc-50 hover:border-emerald-100 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.05)]"
                                        }`}
                                >
                                    {/* Status Header */}
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <h3 className="text-4xl font-black italic tracking-tighter transform -skew-x-6 mb-1 uppercase">
                                                {table.table_number}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isAttention ? "bg-amber-500 animate-pulse" : isOccupied ? "bg-red-500" : "bg-emerald-500"}`} />
                                                <span className={`text-[0.65rem] font-black uppercase tracking-widest ${isAttention ? "text-amber-500" : isOccupied ? "text-red-500" : "text-emerald-500"}`}>
                                                    {table.status || 'available'}
                                                </span>
                                            </div>
                                        </div>
                                        {isAttention && (
                                            <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl">
                                                <Bell className="w-5 h-5 text-amber-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Table Body Content */}
                                    <div className="mb-8">
                                        {isOccupied && table.current_session_token ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                                        <Clock className="w-3 h-3" />
                                                        <span className="text-[0.6rem] font-bold uppercase tracking-widest">Dining Station</span>
                                                    </div>
                                                    {table.session_started_at && (
                                                        <span className="text-[0.6rem] font-black tabular-nums text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 animate-pulse">
                                                            {getDuration(table.session_started_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-start gap-2 bg-zinc-50 p-3 rounded-2xl">
                                                    <UserPlus className="w-4 h-4 text-zinc-400 mt-1 shrink-0" />
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[0.55rem] font-black uppercase tracking-widest text-zinc-400">Active Session</span>
                                                        <span className="text-[0.65rem] font-mono break-all text-zinc-600 leading-tight">
                                                            {table.current_session_token}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center text-zinc-300 gap-3">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-100 flex items-center justify-center">
                                                    <TableIcon className="w-5 h-5" />
                                                </div>
                                                <span className="text-[0.65rem] font-bold italic uppercase tracking-widest">Awaiting guests...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {isOccupied ? (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(table.id, 'available')}
                                                    className="flex-1 h-12 bg-zinc-50 text-zinc-400 border border-zinc-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-zinc-100 hover:text-zinc-600 transition-all active:scale-95"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Close
                                                </button>
                                                <button
                                                    onClick={isAttention ? () => handleStatusUpdate(table.id, 'occupied') : () => handleBillClick(table)}
                                                    className={`flex-[1.5] h-12 ${isAttention ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_10px_20px_-5px_rgba(245,158,11,0.3)]' : 'bg-red-500 hover:bg-red-600 shadow-[0_10px_20px_-5px_rgba(239,68,68,0.3)]'} text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all active:scale-95`}
                                                >
                                                    {isAttention ? <CheckCircle2 className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                                                    {isAttention ? 'Handled' : '$ Bill'}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusUpdate(table.id, 'occupied')}
                                                className="w-full h-12 bg-white border-2 border-zinc-100 text-zinc-400 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 hover:bg-red-50/30 transition-all active:scale-95"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Open Table
                                            </button>
                                        )}
                                    </div>

                                    {/* Footer View Link */}
                                    <div className="mt-6 pt-4 border-t border-zinc-50 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/table/${table.table_number}${table.current_session_token ? `?s=${table.current_session_token}` : '?s=staff-override'}`}
                                            className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <LayoutDashboard className="w-3 h-3" />
                                            Staff View
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === "ORDERS" && <LiveMonitor />}

                {activeTab === "STOCK" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex justify-between items-center bg-white p-8 rounded-4xl border border-zinc-100 shadow-sm mb-8">
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter transform -skew-x-6 uppercase flex items-center gap-3">
                                    <Package className="w-8 h-8 text-black" />
                                    Stock Management
                                </h2>
                                <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Inventory Control System</p>
                            </div>
                            <button className="h-12 px-8 bg-zinc-900 text-white rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg">
                                Add Supply
                            </button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product: any) => (
                                <div key={product.id} className="bg-white border-2 border-zinc-50 rounded-4xl p-6 hover:border-zinc-200 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 group-hover:bg-white group-hover:border-zinc-200 transition-colors">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-10 h-10 object-contain" />
                                            ) : (
                                                <Package className="w-6 h-6 text-zinc-300" />
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[0.6rem] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-xl">
                                                In Stock
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tighter uppercase transform -skew-x-3 mb-1">{product.name}</h3>
                                    <p className="text-[0.55rem] font-bold uppercase text-zinc-400 tracking-widest mb-6">{product.category}</p>

                                    <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                                        <div className="flex flex-col">
                                            <span className="text-[0.5rem] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Price</span>
                                            <span className="text-lg font-black italic tracking-tighter text-zinc-900">${product.price}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[0.5rem] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Quantity</span>
                                            <span className="text-lg font-black italic tracking-tighter text-zinc-900">48 Units</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bill Modal */}
                {isBillOpen && selectedTableForBill && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-zinc-950/40 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                            <div className="p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/50">
                                <div>
                                    <h2 className="text-4xl font-black italic tracking-tighter uppercase transform -skew-x-6">
                                        Table {selectedTableForBill.table_number}
                                    </h2>
                                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Order Summary & Bill</p>
                                </div>
                                <button
                                    onClick={() => setIsBillOpen(false)}
                                    className="w-12 h-12 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 max-h-[60vh] overflow-y-auto">
                                {billItems.length > 0 ? (
                                    <div className="space-y-6">
                                        {billItems.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center group">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-[0.65rem] font-black group-hover:bg-white group-hover:border-red-100 transition-colors">
                                                        x{item.quantity}
                                                    </div>
                                                    <div>
                                                        <p className="font-black italic uppercase tracking-tight text-zinc-900">{item.product_name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[0.6rem] font-bold uppercase text-zinc-400 tracking-widest">{item.note || 'No special requests'}</p>
                                                            <span className={`text-[0.5rem] font-black uppercase px-1.5 py-0.5 rounded ${item.status === 'served' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="font-black italic text-zinc-900 transform -skew-x-3">
                                                    ${(item.quantity * Number(item.product_price || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-zinc-300 flex flex-col items-center gap-4">
                                        <Receipt className="w-12 h-12 opacity-20" />
                                        <p className="text-[0.65rem] font-bold uppercase tracking-widest italic">No orders found for this session</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 space-y-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[0.6rem] font-black uppercase text-zinc-400 tracking-widest mb-1">Total Bill</p>
                                        <p className="text-5xl font-black italic tracking-tighter transform -skew-x-6 text-zinc-900">
                                            ${billItems.reduce((acc: number, item: any) => acc + (item.quantity * Number(item.product_price || 0)), 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[0.55rem] font-black uppercase text-zinc-400 tracking-widest mb-2">Reference Token</span>
                                        <span className="text-[0.65rem] font-mono bg-zinc-900 text-white px-3 py-1.5 rounded-lg">
                                            {selectedTableForBill.current_session_token}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {billItems.some((i: any) => i.status !== 'served') && (
                                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-amber-500 animate-spin" />
                                            <p className="text-[0.65rem] font-bold text-amber-700 uppercase tracking-widest">
                                                Some items are still being prepared. Serve all items before closing the table.
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex gap-4">
                                        <button
                                            disabled={billItems.some((i: any) => i.status !== 'served')}
                                            onClick={() => {
                                                handleStatusUpdate(selectedTableForBill.id, 'available');
                                                setIsBillOpen(false);
                                            }}
                                            className="flex-1 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-zinc-900/10 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Close Table
                                        </button>
                                        <button
                                            disabled={billItems.some((i: any) => i.status !== 'served')}
                                            onClick={() => {
                                                handleStatusUpdate(selectedTableForBill.id, 'available'); // Close table automatically on paid
                                                setIsBillOpen(false);
                                            }}
                                            className="px-8 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/10 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Paid
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
        </div>
    );
}
