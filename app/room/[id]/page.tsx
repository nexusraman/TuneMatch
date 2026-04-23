"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useParams } from "next/navigation";
import { getPusherClient, roomChannel, EVENTS } from "@/lib/pusher";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { SwipeCard } from "@/components/SwipeCard";
import { MatchAnimation } from "@/components/MatchAnimation";
import { MatchedSongsList } from "@/components/MatchedSongsList";
import { ShareLink } from "@/components/ShareLink";

interface TrackData {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl: string | null;
  spotifyUrl: string;
  uri: string;
}

interface MatchedSong {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl: string | null;
  spotifyUrl: string;
}

interface RoomState {
  id: string;
  hasUserA: boolean;
  hasUserB: boolean;
  userAName: string | null;
  userBName: string | null;
  playlistId: string | null;
  playlistUrl: string | null;
  songQueue: string[];
  swipesA: Record<string, boolean>;
  swipesB: Record<string, boolean>;
  matches: MatchedSong[];
  currentSongIndex: number;
}

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const { data: session, status } = useSession();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [slot, setSlot] = useState<"A" | "B" | null>(null);
  const [tracks, setTracks] = useState<Record<string, TrackData>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [matchedSong, setMatchedSong] = useState<MatchedSong | null>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [tab, setTab] = useState<"swipe" | "matches">("swipe");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const hasJoinedRef = useRef(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const joinRoom = useCallback(async () => {
    if (hasJoinedRef.current || !session) return;
    hasJoinedRef.current = true;
    setJoining(true);

    try {
      const res = await fetch(`/api/room/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
          spotifyId: session.spotifyId,
        }),
      });
      const data = await res.json();
      if (data.slot) {
        setSlot(data.slot);
        setRoom(data.room);
        setJoined(true);
        // Fetch tracks if queue already ready
        if (data.room.songQueue.length > 0) {
          const tRes = await fetch(`/api/room/${roomId}/tracks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackIds: data.room.songQueue, accessToken: session.accessToken }),
          });
          const tData = await tRes.json();
          const map: Record<string, TrackData> = {};
          for (const t of tData.tracks ?? []) map[t.id] = t;
          setTracks(map);
        }
      }
    } finally {
      setJoining(false);
    }
  }, [session, roomId]);

  // Set up Supabase Realtime
  useEffect(() => {
    const supabase = getPusherClient();
    const channel = supabase.channel(roomChannel(roomId));
    channelRef.current = channel;

    channel
      .on("broadcast", { event: EVENTS.USER_JOINED }, ({ payload }: { payload: { room: RoomState } }) => {
        setRoom(payload.room);
      })
      .on("broadcast", { event: EVENTS.QUEUE_READY }, ({ payload }: { payload: { trackIds: string[]; trackMap: Record<string, TrackData>; room: RoomState } }) => {
        setRoom(payload.room);
        setTracks(payload.trackMap);
      })
      .on("broadcast", { event: EVENTS.SWIPE }, ({ payload }: { payload: { room: RoomState } }) => {
        setRoom(payload.room);
        setCurrentIdx((idx) => {
          const trackId = payload.room.songQueue[idx];
          if (!trackId) return idx;
          const aS = payload.room.swipesA[trackId];
          const bS = payload.room.swipesB[trackId];
          if (aS !== undefined && bS !== undefined) return idx + 1;
          return idx;
        });
      })
      .on("broadcast", { event: EVENTS.MATCH }, ({ payload }: { payload: { song: MatchedSong; room: RoomState } }) => {
        setRoom(payload.room);
        setMatchedSong(payload.song);
        setShowMatches(true);
        setTimeout(() => setShowMatches(false), 3500);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  // Auto-join once session is ready
  useEffect(() => {
    if (status === "authenticated" && !joined && !joining) {
      joinRoom();
    }
  }, [status, joined, joining, joinRoom]);

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") handleSwipe(true);
      if (e.key === "ArrowLeft") handleSwipe(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function handleSwipe(liked: boolean) {
    if (!room || !slot || !session) return;
    const currentTrackId = room.songQueue[currentIdx];
    if (!currentTrackId) return;

    const mySwipes = slot === "A" ? room.swipesA : room.swipesB;
    if (mySwipes[currentTrackId] !== undefined) return; // already swiped

    const trackData = tracks[currentTrackId];
    if (!trackData) return;

    await fetch(`/api/room/${roomId}/swipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, trackId: currentTrackId, liked, trackData }),
    });

    // Advance optimistically on skip; on like we wait for partner via Pusher
    if (!liked) {
      setCurrentIdx((i) => i + 1);
    }
  }

  if (status === "loading" || joining) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4 heartbeat">🎵</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-6">
        <div className="text-5xl mb-2">🎵</div>
        <h1 className="text-3xl font-bold text-white">Join TuneMatch Room</h1>
        <p className="text-gray-400 max-w-xs">
          Connect your Spotify account to start matching songs with your partner.
        </p>
        <button
          onClick={() => signIn("spotify", { callbackUrl: `/room/${roomId}` })}
          className="px-8 py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-lg transition-all shadow-lg shadow-green-500/30"
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  const bothConnected = room?.hasUserA && room?.hasUserB;
  const queueReady = (room?.songQueue.length ?? 0) > 0;
  const currentTrackId = room?.songQueue[currentIdx];
  const currentTrack = currentTrackId ? tracks[currentTrackId] : null;
  const mySwipes = slot === "A" ? room?.swipesA : room?.swipesB;
  const otherSwipes = slot === "A" ? room?.swipesB : room?.swipesA;
  const iHaveSwiped = currentTrackId ? mySwipes?.[currentTrackId] !== undefined : false;
  const partnerHasSwiped = currentTrackId ? otherSwipes?.[currentTrackId] !== undefined : false;
  const queueDone = currentIdx >= (room?.songQueue.length ?? 0);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto px-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
          TuneMatch
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className={`w-2 h-2 rounded-full ${room?.hasUserA ? "bg-green-400" : "bg-gray-600"}`} />
          <span className={`w-2 h-2 rounded-full ${room?.hasUserB ? "bg-green-400" : "bg-gray-600"}`} />
          <span>{room?.hasUserA && room?.hasUserB ? "Both connected" : "Waiting..."}</span>
        </div>
      </div>

      {/* Share link (if partner not connected) */}
      {!room?.hasUserB && slot === "A" && (
        <ShareLink roomId={roomId} appUrl={appUrl} />
      )}

      {/* Tabs */}
      {bothConnected && (
        <div className="flex rounded-xl overflow-hidden border border-gray-800 mb-4">
          {(["swipe", "matches"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-green-500 text-black"
                  : "bg-gray-900 text-gray-400 hover:text-white"
              }`}
            >
              {t === "matches" ? `Matches (${room?.matches.length ?? 0})` : "Swipe"}
            </button>
          ))}
        </div>
      )}

      {/* Match animation */}
      {showMatches && matchedSong && (
        <MatchAnimation song={matchedSong} onClose={() => setShowMatches(false)} />
      )}

      {/* Main content */}
      {tab === "swipe" && (
        <div className="flex-1 flex flex-col items-center justify-center">
          {!bothConnected && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-300 font-medium mb-2">Waiting for your partner...</p>
              <p className="text-gray-500 text-sm">Share the link below so they can join</p>
              {slot === "B" && (
                <ShareLink roomId={roomId} appUrl={appUrl} />
              )}
            </div>
          )}

          {bothConnected && !queueReady && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 heartbeat">🎵</div>
              <p className="text-gray-300 font-medium">Building your playlist...</p>
              <p className="text-gray-500 text-sm mt-1">Analyzing both your tastes</p>
            </div>
          )}

          {bothConnected && queueReady && queueDone && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-300 font-medium mb-2">All done!</p>
              <p className="text-gray-500 text-sm mb-4">You matched {room?.matches.length} songs together</p>
              {room?.playlistUrl && (
                <a
                  href={room.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all"
                >
                  Open Playlist in Spotify
                </a>
              )}
            </div>
          )}

          {bothConnected && queueReady && !queueDone && (
            <>
              {currentTrack ? (
                <SwipeCard
                  track={currentTrack}
                  onSwipe={handleSwipe}
                  iHaveSwiped={iHaveSwiped}
                  partnerHasSwiped={partnerHasSwiped}
                  queueIndex={currentIdx}
                  queueLength={room?.songQueue.length ?? 0}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3 heartbeat">🎵</div>
                  <p className="text-gray-400">Loading track...</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "matches" && (
        <MatchedSongsList
          matches={room?.matches ?? []}
          playlistUrl={room?.playlistUrl ?? null}
        />
      )}
    </div>
  );
}
