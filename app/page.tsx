"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function createRoom() {
    setLoading(true);
    try {
      const res = await fetch("/api/room/create", { method: "POST" });
      const { roomId } = await res.json();
      router.push(`/room/${roomId}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-8 slide-up">
        <div className="text-6xl mb-4">🎵</div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent mb-3">
          TuneMatch
        </h1>
        <p className="text-gray-400 text-lg max-w-xs">
          Find the songs you both love. Swipe together, discover your sound.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs slide-up">
        <button
          onClick={createRoom}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
        >
          {loading ? "Creating room..." : "Create a Room"}
        </button>

        <p className="text-gray-500 text-sm">
          Share the link with your partner and start matching songs together
        </p>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-6 text-center max-w-sm">
        {[
          { icon: "🔗", label: "Share link" },
          { icon: "👆", label: "Swipe songs" },
          { icon: "💚", label: "Get matched" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-gray-500 text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
