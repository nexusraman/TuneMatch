# TuneMatch Setup Guide

## 1. Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Copy **Client ID** and **Client Secret**

## 2. Pusher

1. Go to https://pusher.com and create a free account
2. Create a new **Channels** app
3. Copy App ID, Key, Secret, Cluster

## 3. Environment Variables

Edit `.env.local`:

```
SPOTIFY_CLIENT_ID=<from Spotify dashboard>
SPOTIFY_CLIENT_SECRET=<from Spotify dashboard>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
PUSHER_APP_ID=<from Pusher>
PUSHER_KEY=<from Pusher>
PUSHER_SECRET=<from Pusher>
PUSHER_CLUSTER=<from Pusher e.g. eu, us2>
NEXT_PUBLIC_PUSHER_KEY=<same as PUSHER_KEY>
NEXT_PUBLIC_PUSHER_CLUSTER=<same as PUSHER_CLUSTER>
```

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000

## Usage

1. Click **Create a Room** — you get a shareable link
2. Copy and send it to your partner via WhatsApp/iMessage
3. Both connect Spotify accounts
4. Swipe right (♥) to like, left (✕) to skip
5. When you both swipe right → **Match!** 🎉
6. All matches are added to a shared Spotify playlist automatically

## Keyboard Shortcuts

- `→` Arrow Right = Like
- `←` Arrow Left = Skip

## Notes

- Room state is in-memory (resets on server restart). For production, swap `lib/store.ts` with Upstash Redis.
- Spotify preview URLs (30-second clips) are only available for some tracks.
