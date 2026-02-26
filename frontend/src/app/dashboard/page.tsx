"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.push("/staff");
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="animate-pulse font-black italic tracking-tighter text-2xl">
                REDIRECTING TO COMMAND CENTER...
            </div>
        </div>
    );
}
