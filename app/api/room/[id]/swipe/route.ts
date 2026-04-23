import { NextRequest, NextResponse } from "next/server";
import { getRoom, updateRoom, getRoomSafe, MatchedSong } from "@/lib/store";
import { addTrackToPlaylist } from "@/lib/spotify";
import { pusherServer, roomChannel, EVENTS } from "@/lib/pusher";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { slot, trackId, liked, trackData } = await req.json();

  const room = getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const swipesKey = slot === "A" ? "swipesA" : "swipesB";
  const updatedSwipes = { ...room[swipesKey], [trackId]: liked };

  updateRoom(params.id, { [swipesKey]: updatedSwipes });
  const updatedRoom = getRoom(params.id)!;

  const otherSwipes = slot === "A" ? updatedRoom.swipesB : updatedRoom.swipesA;

  let matched = false;

  // Check if both swiped right
  if (liked && otherSwipes[trackId] === true) {
    matched = true;

    const matchedSong: MatchedSong = {
      id: trackData.id,
      name: trackData.name,
      artist: trackData.artist,
      albumArt: trackData.albumArt,
      previewUrl: trackData.previewUrl,
      spotifyUrl: trackData.spotifyUrl,
    };

    const newMatches = [...updatedRoom.matches, matchedSong];
    updateRoom(params.id, { matches: newMatches });

    // Add to Spotify playlist
    if (updatedRoom.playlistId) {
      const token = updatedRoom.userA?.accessToken;
      if (token) {
        addTrackToPlaylist(token, updatedRoom.playlistId, trackData.uri).catch(
          console.error
        );
      }
    }

    const finalRoom = getRoom(params.id)!;
    await pusherServer.trigger(roomChannel(params.id), EVENTS.MATCH, {
      song: matchedSong,
      room: getRoomSafe(finalRoom),
    });
  }

  await pusherServer.trigger(roomChannel(params.id), EVENTS.SWIPE, {
    slot,
    trackId,
    liked,
    room: getRoomSafe(getRoom(params.id)!),
  });

  return NextResponse.json({ matched });
}
