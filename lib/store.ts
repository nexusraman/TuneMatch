// Simple in-memory store for room state (replace with Redis for production)
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
  songQueue: string[]; // track IDs
  swipesA: Record<string, boolean>; // trackId -> liked
  swipesB: Record<string, boolean>;
  matches: MatchedSong[];
  currentSongIndex: number;
}

const rooms = new Map<string, Room>();

export function createRoom(id: string): Room {
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
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | null {
  return rooms.get(id) ?? null;
}

export function updateRoom(id: string, updates: Partial<Room>): Room | null {
  const room = rooms.get(id);
  if (!room) return null;
  const updated = { ...room, ...updates };
  rooms.set(id, updated);
  return updated;
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
