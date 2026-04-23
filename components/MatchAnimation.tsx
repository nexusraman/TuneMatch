"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface MatchedSong {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export function MatchAnimation({
  song,
  onClose,
}: {
  song: MatchedSong;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      angle: number;
      av: number;
    }[] = [];

    const colors = ["#22c55e", "#10b981", "#34d399", "#ffffff", "#4ade80", "#86efac"];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        angle: 0,
        av: (Math.random() - 0.5) * 0.2,
      });
    }

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.av;
        p.vy += 0.05;
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      <div className="relative z-10 text-center px-6 slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-2 match-pulse">💚</div>
        <h2 className="text-3xl font-black text-white mb-1">It&apos;s a Match!</h2>
        <p className="text-green-400 text-sm mb-6">You both love this song 💚</p>
        <div className="flex items-center gap-4 bg-gray-900/90 rounded-2xl p-4 max-w-xs mx-auto">
          {song.albumArt && (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={song.albumArt} alt={song.name} fill className="object-cover" sizes="64px" />
            </div>
          )}
          <div className="text-left">
            <p className="text-white font-bold line-clamp-1">{song.name}</p>
            <p className="text-gray-400 text-sm line-clamp-1">{song.artist}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-8 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all"
        >
          Keep Swiping
        </button>
      </div>
    </div>
  );
}
