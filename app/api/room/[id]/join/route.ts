import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getRoom, updateRoom, getRoomSafe } from "@/lib/store";
import {
  getTopTracks,
  getTopArtists,
  getRecommendations,
  createPlaylist,
  getMe,
} from "@/lib/spotify";
import { pusherServer, roomChannel, EVENTS } from "@/lib/pusher";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get tokens from request body (passed from client)
  const { accessToken, refreshToken, expiresAt, spotifyId } = await req.json();

  const room = getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const me = await getMe(accessToken);

  const userInfo = {
    spotifyId,
    displayName: me.display_name || me.email || "Partner",
    accessToken,
    refreshToken,
    expiresAt,
  };

  let slot: "A" | "B";

  if (!room.userA) {
    slot = "A";
  } else if (room.userA.spotifyId === spotifyId) {
    slot = "A"; // rejoin
  } else if (!room.userB) {
    slot = "B";
  } else if (room.userB.spotifyId === spotifyId) {
    slot = "B"; // rejoin
  } else {
    return NextResponse.json({ error: "Room is full" }, { status: 400 });
  }

  const updates: Parameters<typeof updateRoom>[1] = {};
  if (slot === "A") updates.userA = userInfo;
  else updates.userB = userInfo;

  let updatedRoom = updateRoom(params.id, updates)!;

  // If this is User A joining for the first time, create playlist
  if (slot === "A" && !updatedRoom.playlistId) {
    try {
      const date = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const playlist = await createPlaylist(
        accessToken,
        spotifyId,
        `TuneMatch — ${date}`
      );
      updatedRoom = updateRoom(params.id, {
        playlistId: playlist.id,
        playlistUrl: playlist.external_urls.spotify,
      })!;
    } catch (e) {
      console.error("Failed to create playlist", e);
    }
  }

  // If both users are now present and no queue yet, generate recommendations
  if (updatedRoom.userA && updatedRoom.userB && updatedRoom.songQueue.length === 0) {
    try {
      await generateQueue(params.id, updatedRoom.userA.accessToken, updatedRoom.userB.accessToken);
    } catch (e) {
      console.error("Failed to generate queue", e);
    }
  }

  const finalRoom = getRoom(params.id)!;

  await pusherServer.trigger(roomChannel(params.id), EVENTS.USER_JOINED, {
    slot,
    user: userInfo.displayName,
    room: getRoomSafe(finalRoom),
  });

  return NextResponse.json({ slot, room: getRoomSafe(finalRoom) });
}

async function generateQueue(roomId: string, tokenA: string, tokenB: string) {
  const [tracksA, tracksB, artistsA, artistsB] = await Promise.all([
    getTopTracks(tokenA),
    getTopTracks(tokenB),
    getTopArtists(tokenA),
    getTopArtists(tokenB),
  ]);

  // Mix seeds from both users
  const seedTracks = [
    tracksA[0]?.id,
    tracksA[1]?.id,
    tracksB[0]?.id,
    tracksB[1]?.id,
  ].filter(Boolean) as string[];

  const seedArtists = [
    artistsA[0]?.id,
    artistsB[0]?.id,
    artistsA[1]?.id,
  ].filter(Boolean) as string[];

  const recs = await getRecommendations(tokenA, seedTracks.slice(0, 2), seedArtists.slice(0, 3));

  // Deduplicate and shuffle
  const seen = new Set<string>();
  const trackIds: string[] = [];
  for (const t of recs) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      trackIds.push(t.id);
    }
  }

  // Store full track data alongside IDs
  const trackMap: Record<string, object> = {};
  for (const t of recs) {
    trackMap[t.id] = {
      id: t.id,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      albumArt: t.album.images[0]?.url ?? "",
      previewUrl: t.preview_url,
      spotifyUrl: t.external_urls.spotify,
      uri: t.uri,
    };
  }

  updateRoom(roomId, { songQueue: trackIds });

  const room = getRoom(roomId)!;
  await pusherServer.trigger(roomChannel(roomId), EVENTS.QUEUE_READY, {
    trackIds,
    trackMap,
    room: getRoomSafe(room),
  });
}
