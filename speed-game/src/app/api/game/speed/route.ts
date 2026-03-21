import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame } from "@/lib/store";
import { requestSpeed } from "@/lib/game";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, playerId } = body;

  if (!roomId || !playerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const game = getGame(roomId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const result = requestSpeed(game, playerId);
  setGame(roomId, result.state);

  return NextResponse.json({ success: true, flipped: result.flipped });
}
