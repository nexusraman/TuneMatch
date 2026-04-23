const SPOTIFY_API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  return res.json();
}

export async function getTopTracks(accessToken: string) {
  const res = await fetch(
    `${SPOTIFY_API}/me/top/tracks?limit=20&time_range=medium_term`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return (data.items ?? []) as SpotifyTrack[];
}

export async function getTopArtists(accessToken: string) {
  const res = await fetch(
    `${SPOTIFY_API}/me/top/artists?limit=10&time_range=medium_term`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return (data.items ?? []) as SpotifyArtist[];
}

export async function getRecommendations(
  accessToken: string,
  seedTracks: string[],
  seedArtists: string[]
) {
  const params = new URLSearchParams({
    limit: "50",
    seed_tracks: seedTracks.slice(0, 2).join(","),
    seed_artists: seedArtists.slice(0, 3).join(","),
  });
  const res = await fetch(`${SPOTIFY_API}/recommendations?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return (data.tracks ?? []) as SpotifyTrack[];
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string
) {
  const res = await fetch(`${SPOTIFY_API}/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description: "Songs you both love — created by TuneMatch 💚",
      public: false,
    }),
  });
  return res.json() as Promise<SpotifyPlaylist>;
}

export async function addTrackToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string
) {
  await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [trackUri] }),
  });
}

export async function getMe(accessToken: string) {
  const res = await fetch(`${SPOTIFY_API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json() as Promise<SpotifyUser>;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  preview_url: string | null;
  external_urls: { spotify: string };
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  artists: { id: string; name: string }[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyPlaylist {
  id: string;
  external_urls: { spotify: string };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
}
