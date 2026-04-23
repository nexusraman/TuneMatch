import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createRoom } from "@/lib/store";

export async function POST() {
  const id = uuidv4().split("-")[0]; // short 8-char ID
  createRoom(id);
  return NextResponse.json({ roomId: id });
}
