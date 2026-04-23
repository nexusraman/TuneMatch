import { NextRequest, NextResponse } from "next/server";
import { getRoom, updateRoom, getRoomSafe, MatchedSong } from "@/lib/store";
import { addTrackToPlaylist } from "@/lib/spotify";
import { pusherServer, roomChannel, EVENTS } from "@/lib/pusher";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { slot, trackId, liked, trackData } = await req.json();

  const room = await getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const swipesKey = slot === "A" ? "swipesA" : "swipesB";
  const updatedSwipes = { ...room[swipesKey], [trackId]: liked };

  await updateRoom(params.id, { [swipesKey]: updatedSwipes });
  const updatedRoom = (await getRoom(params.id))!;

  const otherSwipes = slot === "A" ? updatedRoom.swipesB : updatedRoom.swipesA;

  let matched = false;

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
    await updateRoom(params.id, { matches: newMatches });

    if (updatedRoom.playlistId) {
      const token = updatedRoom.userA?.accessToken;
      if (token) {
        addTrackToPlaylist(token, updatedRoom.playlistId, trackData.uri).catch(
          console.error
        );
      }
    }

    const finalRoom = (await getRoom(params.id))!;
    await pusherServer.trigger(roomChannel(params.id), EVENTS.MATCH, {
      song: matchedSong,
      room: getRoomSafe(finalRoom),
    });
  }

  await pusherServer.trigger(roomChannel(params.id), EVENTS.SWIPE, {
    slot,
    trackId,
    liked,
    room: getRoomSafe((await getRoom(params.id))!),
  });

  return NextResponse.json({ matched });
}
