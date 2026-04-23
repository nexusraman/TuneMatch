import { createClient } from "@supabase/supabase-js";

// Server-side: broadcast an event to a room channel via Supabase Realtime REST API
export async function broadcastToRoom(
  roomId: string,
  event: string,
  payload: object
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `realtime:${roomChannel(roomId)}`,
            event,
            payload,
          },
        ],
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase broadcast failed: ${text}`);
  }
}

// Shim matching the old pusherServer.trigger(...) call signature used in API routes
export const pusherServer = {
  trigger: (channel: string, event: string, payload: object) => {
    const roomId = channel.replace(/^room-/, "");
    return broadcastToRoom(roomId, event, payload);
  },
};

// Client-side Supabase instance (singleton)
let clientInstance: ReturnType<typeof createClient> | null = null;

export function getPusherClient() {
  if (!clientInstance) {
    clientInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return clientInstance;
}

export function roomChannel(roomId: string) {
  return `room-${roomId}`;
}

export const EVENTS = {
  USER_JOINED: "user-joined",
  SWIPE: "swipe",
  MATCH: "match",
  QUEUE_READY: "queue-ready",
  ROOM_UPDATE: "room-update",
} as const;
