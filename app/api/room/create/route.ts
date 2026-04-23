import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createRoom } from "@/lib/store";

export async function POST() {
  try {
    const id = uuidv4().split("-")[0];
    await createRoom(id);
    return NextResponse.json({ roomId: id });
  } catch (e) {
    console.error("createRoom error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create room" },
      { status: 500 }
    );
  }
}
