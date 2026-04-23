import { supabaseAdmin } from "./supabase";

export interface RoomUser {
  spotifyId: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface Swipe {
  songId: string;
  liked: boolean;
}

export interface MatchedSong {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl: string | null;
  spotifyUrl: string;
}

export interface Room {
  id: string;
  createdAt: number;
  userA: RoomUser | null;
  userB: RoomUser | null;
  playlistId: string | null;
  playlistUrl: string | null;
  songQueue: string[];
  swipesA: Record<string, boolean>;
  swipesB: Record<string, boolean>;
  matches: MatchedSong[];
  currentSongIndex: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: Record<string, any>): Room {
  return {
    id: row.id,
    createdAt: row.created_at,
    userA: row.user_a ?? null,
    userB: row.user_b ?? null,
    playlistId: row.playlist_id ?? null,
    playlistUrl: row.playlist_url ?? null,
    songQueue: row.song_queue ?? [],
    swipesA: row.swipes_a ?? {},
    swipesB: row.swipes_b ?? {},
    matches: row.matches ?? [],
    currentSongIndex: row.current_song_index ?? 0,
  };
}

export async function createRoom(id: string): Promise<Room> {
  const room: Room = {
    id,
    createdAt: Date.now(),
    userA: null,
    userB: null,
    playlistId: null,
    playlistUrl: null,
    songQueue: [],
    swipesA: {},
    swipesB: {},
    matches: [],
    currentSongIndex: 0,
  };
  const { error } = await supabaseAdmin.from("rooms").insert({
    id: room.id,
    created_at: room.createdAt,
    user_a: null,
    user_b: null,
    playlist_id: null,
    playlist_url: null,
    song_queue: [],
    swipes_a: {},
    swipes_b: {},
    matches: [],
    current_song_index: 0,
  });
  if (error) throw new Error(error.message);
  return room;
}

export async function getRoom(id: string): Promise<Room | null> {
  const { data, error } = await supabaseAdmin
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return fromRow(data);
}

export async function updateRoom(
  id: string,
  updates: Partial<Room>
): Promise<Room | null> {
  const row: Record<string, unknown> = {};
  if (updates.userA !== undefined) row.user_a = updates.userA;
  if (updates.userB !== undefined) row.user_b = updates.userB;
  if (updates.playlistId !== undefined) row.playlist_id = updates.playlistId;
  if (updates.playlistUrl !== undefined) row.playlist_url = updates.playlistUrl;
  if (updates.songQueue !== undefined) row.song_queue = updates.songQueue;
  if (updates.swipesA !== undefined) row.swipes_a = updates.swipesA;
  if (updates.swipesB !== undefined) row.swipes_b = updates.swipesB;
  if (updates.matches !== undefined) row.matches = updates.matches;
  if (updates.currentSongIndex !== undefined)
    row.current_song_index = updates.currentSongIndex;

  const { data, error } = await supabaseAdmin
    .from("rooms")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return fromRow(data);
}

export function getRoomSafe(room: Room) {
  return {
    id: room.id,
    hasUserA: !!room.userA,
    hasUserB: !!room.userB,
    userAName: room.userA?.displayName ?? null,
    userBName: room.userB?.displayName ?? null,
    playlistId: room.playlistId,
    playlistUrl: room.playlistUrl,
    songQueue: room.songQueue,
    swipesA: room.swipesA,
    swipesB: room.swipesB,
    matches: room.matches,
    currentSongIndex: room.currentSongIndex,
  };
}
