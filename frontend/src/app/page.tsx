"use client";

import Link from "next/link";
import { Shield, Zap, Circle, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white selection:bg-red-500/30 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl">
        {/* Top Tagline */}
        <div className="flex items-center gap-2 mb-8 animate-fade-in">
          <span className="text-amber-400 text-[0.65rem] font-black uppercase tracking-[0.4em]">✨ Next Generation Dining</span>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col mb-12">
          <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter leading-[0.8] mb-2 transform -skew-x-6">
            NFC
          </h1>
          <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter leading-[0.8] transform -skew-x-6 bg-gradient-to-r from-red-600 to-rose-400 bg-clip-text text-transparent">
            EXPERIENCE
          </h1>
        </div>

        <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed">
          Revolutionizing hospitality with zero-friction, real-time
          <br className="hidden md:block" /> ordering systems.
        </p>

        {/* Trusted By */}
        <div className="flex items-center gap-6 mb-20 opacity-40 grayscale group hover:opacity-100 transition-opacity">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800" />
            ))}
          </div>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Trusted by 50+ Premium Venues</span>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
          {/* Operations Card */}
          <Link href="/staff" className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-zinc-950/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] text-left transition-transform group-hover:-translate-y-1">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="text-red-500 w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tight mb-4 transform -skew-x-3">Operations</h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8 font-medium">
                Comprehensive dashboard for staff. Manage orders, tables, and stock with zero latency.
              </p>
              <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest">
                Enter Command Center <ArrowRight className="w-4 h-4" />
              </div>

              {/* Decorative Shield Icon in bg */}
              <Shield className="absolute bottom-6 right-6 text-white/[0.02] w-24 h-24 pointer-events-none" />
            </div>
          </Link>

          {/* Customer Card */}
          <Link href="/table/1" className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-zinc-950/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] text-left transition-transform group-hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="text-blue-500 w-6 h-6 fill-blue-500/20" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tight mb-4 transform -skew-x-3">Customer</h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8 font-medium">
                Intuitive mobile-first experience. Seamless ordering directly from the table.
              </p>
              <div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest">
                Explore Interface <ArrowRight className="w-4 h-4" />
              </div>

              {/* Decorative App Icon in bg */}
              <div className="absolute bottom-6 right-6 w-24 h-24 border-2 border-white/[0.02] rounded-3xl pointer-events-none rotate-[15deg]">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/[0.02] rounded-full" />
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="absolute bottom-8 left-0 w-full px-12 hidden md:flex items-center justify-between text-[0.6rem] font-bold tracking-widest text-zinc-600 uppercase">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span>NFC Restaurant V2.0</span>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Circle className="w-2 h-2 text-rose-500 fill-rose-500" />
            <span>Rust Core</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-2 h-2 text-blue-500 fill-blue-500" />
            <span>Next.js App</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-2 h-2 text-emerald-500 fill-emerald-500" />
            <span>Docker Ready</span>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
