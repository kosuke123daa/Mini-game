import { NextRequest, NextResponse } from "next/server";
import { getGame, getRoom } from "@/lib/store";
import { getPlayerView } from "@/lib/game";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const playerId = searchParams.get("playerId");

  if (!roomId || !playerId) {
    return NextResponse.json({ error: "roomId and playerId required" }, { status: 400 });
  }

  const room = getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const game = getGame(roomId);
  if (!game) {
    // Game not started yet - waiting for opponent
    return NextResponse.json({
      status: "waiting",
      roomId,
      player1Joined: !!room.player1Id,
      player2Joined: !!room.player2Id,
    });
  }

  const view = getPlayerView(game, playerId);
  if (!view) {
    return NextResponse.json({ error: "Player not in game" }, { status: 403 });
  }

  return NextResponse.json(view);
}
