"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

interface ServiceButtonProps {
    tableId: string | number;
}

export default function ServiceButton({ tableId }: ServiceButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'called'>('idle');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const callStaff = async () => {
        if (status !== 'idle') return;
        setStatus('loading');
        try {
            const res = await fetch(`${apiUrl}/table/${tableId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "calling bill",
                }),
            });
            if (res.ok) {
                setStatus('called');
                setTimeout(() => setStatus('idle'), 30000); // Reset after 30s
            } else {
                setStatus('idle');
            }
        } catch (err) {
            console.error(err);
            setStatus('idle');
        }
    };

    return (
        <button
            onClick={callStaff}
            disabled={status !== 'idle'}
            className={`p-4 rounded-2xl transition-all active:scale-95 shadow-xl cursor-pointer border ${status === 'called'
                ? "bg-amber-500 border-amber-400 text-white animate-pulse"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <Bell className={`w-6 h-6 ${status === 'loading' ? 'animate-spin' : ''}`} />
        </button>
    );
}

