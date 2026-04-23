import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/lib/store";

// Fetch full track details via Spotify for a list of IDs
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { trackIds, accessToken } = await req.json();
  const room = getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  if (!trackIds?.length) return NextResponse.json({ tracks: [] });

  const res = await fetch(
    `https://api.spotify.com/v1/tracks?ids=${trackIds.join(",")}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();

  interface SpotifyTrackRaw { id: string; name: string; uri: string; preview_url: string | null; external_urls: { spotify: string }; album: { images: { url: string }[] }; artists: { name: string }[] }
  const tracks = (data.tracks ?? []).map((t: SpotifyTrackRaw) => ({
    id: t.id,
    name: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    albumArt: t.album.images[0]?.url ?? "",
    previewUrl: t.preview_url,
    spotifyUrl: t.external_urls.spotify,
    uri: t.uri,
  }));

  return NextResponse.json({ tracks });
}
