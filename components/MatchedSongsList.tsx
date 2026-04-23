"use client";

import Image from "next/image";

interface MatchedSong {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  previewUrl: string | null;
  spotifyUrl: string;
}

export function MatchedSongsList({
  matches,
  playlistUrl,
}: {
  matches: MatchedSong[];
  playlistUrl: string | null;
}) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">🎵</div>
        <p className="text-gray-400 font-medium">No matches yet</p>
        <p className="text-gray-600 text-sm mt-1">Keep swiping to find songs you both love</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {playlistUrl && (
        <a
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all"
        >
          <span>🎧</span> Open Playlist in Spotify
        </a>
      )}
      <p className="text-gray-500 text-sm text-center">{matches.length} matched songs</p>
      <div className="flex flex-col gap-3">
        {matches.map((song) => (
          <a
            key={song.id}
            href={song.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 rounded-xl p-3 transition-colors"
          >
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
              {song.albumArt ? (
                <Image src={song.albumArt} alt={song.name} fill className="object-cover" sizes="56px" />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-2xl">🎵</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium line-clamp-1">{song.name}</p>
              <p className="text-gray-400 text-sm line-clamp-1">{song.artist}</p>
            </div>
            <span className="text-green-400 text-lg">💚</span>
          </a>
        ))}
      </div>
    </div>
  );
}
