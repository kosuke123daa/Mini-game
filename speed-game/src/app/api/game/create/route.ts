import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { playerId } = body;

  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }

  const roomId = await createRoom(playerId);
  return NextResponse.json({ roomId });
}
