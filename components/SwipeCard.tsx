"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

interface Track {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl: string | null;
  spotifyUrl: string;
}

interface SwipeCardProps {
  track: Track;
  onSwipe: (liked: boolean) => void;
  iHaveSwiped: boolean;
  partnerHasSwiped: boolean;
  queueIndex: number;
  queueLength: number;
}

export function SwipeCard({
  track,
  onSwipe,
  iHaveSwiped,
  partnerHasSwiped,
  queueIndex,
  queueLength,
}: SwipeCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [track.id]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return;
    setDragX(e.touches[0].clientX - startX.current);
  }

  function onTouchEnd() {
    setDragging(false);
    if (Math.abs(dragX) > 80) {
      onSwipe(dragX > 0);
    }
    setDragX(0);
  }

  const rotation = dragging ? dragX * 0.08 : 0;
  const opacity = iHaveSwiped ? 0.5 : 1;
  const likeOpacity = Math.max(0, Math.min(1, dragX / 80));
  const skipOpacity = Math.max(0, Math.min(1, -dragX / 80));

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Progress */}
      <div className="w-full flex items-center gap-2">
        <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${((queueIndex + 1) / queueLength) * 100}%` }}
          />
        </div>
        <span className="text-gray-500 text-xs">{queueIndex + 1}/{queueLength}</span>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="relative w-full rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
        style={{
          transform: `rotate(${rotation}deg) translateX(${dragX * 0.3}px)`,
          opacity,
          transition: dragging ? "none" : "transform 0.3s ease",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Like / Skip overlays */}
        <div
          className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-4 border-green-400 text-green-400 font-black text-2xl rotate-[-20deg]"
          style={{ opacity: likeOpacity }}
        >
          LIKE
        </div>
        <div
          className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-4 border-red-400 text-red-400 font-black text-2xl rotate-[20deg]"
          style={{ opacity: skipOpacity }}
        >
          SKIP
        </div>

        {/* Album art */}
        <div className="relative w-full aspect-square bg-gray-900">
          {track.albumArt ? (
            <Image
              src={track.albumArt}
              alt={track.name}
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🎵</div>
          )}
        </div>

        {/* Info + preview */}
        <div className="bg-gray-900 p-5">
          <h2 className="text-white font-bold text-xl leading-tight line-clamp-1">{track.name}</h2>
          <p className="text-gray-400 text-sm mt-1 line-clamp-1">{track.artist}</p>

          {track.previewUrl && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center text-black transition-all flex-shrink-0"
              >
                {playing ? "⏸" : "▶"}
              </button>
              <div className="flex-1 h-1 bg-gray-700 rounded-full">
                <div className="h-full bg-green-500 rounded-full w-0" />
              </div>
              <span className="text-gray-500 text-xs">0:30</span>
              <audio
                ref={audioRef}
                src={track.previewUrl}
                onEnded={() => setPlaying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Partner status */}
      {iHaveSwiped && !partnerHasSwiped && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span className="animate-pulse">⏳</span>
          Waiting for partner...
        </div>
      )}

      {/* Action buttons */}
      {!iHaveSwiped && (
        <div className="flex items-center gap-6 w-full justify-center mt-2">
          <button
            onClick={() => onSwipe(false)}
            className="w-16 h-16 rounded-full bg-gray-800 hover:bg-red-500/20 border-2 border-gray-700 hover:border-red-500 flex items-center justify-center text-2xl transition-all active:scale-95"
            title="Skip (←)"
          >
            ✕
          </button>
          <a
            href={track.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm transition-all"
            title="Open in Spotify"
          >
            ↗
          </a>
          <button
            onClick={() => onSwipe(true)}
            className="w-16 h-16 rounded-full bg-gray-800 hover:bg-green-500/20 border-2 border-gray-700 hover:border-green-500 flex items-center justify-center text-2xl transition-all active:scale-95"
            title="Like (→)"
          >
            ♥
          </button>
        </div>
      )}
    </div>
  );
}
