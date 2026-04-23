import { NextRequest, NextResponse } from "next/server";
import { getRoom, getRoomSafe } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const room = getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ room: getRoomSafe(room) });
}
