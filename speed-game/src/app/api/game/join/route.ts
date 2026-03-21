import { NextRequest, NextResponse } from "next/server";
import { joinRoom, getRoom, getGame, setGame } from "@/lib/store";
import { createGame } from "@/lib/game";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, playerId } = body;

  if (!roomId || !playerId) {
    return NextResponse.json({ error: "roomId and playerId required" }, { status: 400 });
  }

  const result = joinRoom(roomId.toUpperCase(), playerId);
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const room = getRoom(roomId.toUpperCase());
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Start game if both players are in
  if (room.player1Id && room.player2Id && !getGame(roomId.toUpperCase())) {
    const game = createGame(roomId.toUpperCase(), room.player1Id, room.player2Id);
    setGame(roomId.toUpperCase(), game);
  }

  return NextResponse.json({
    success: true,
    roomId: roomId.toUpperCase(),
    isPlayer1: result.isPlayer1,
    gameStarted: !!(room.player1Id && room.player2Id),
  });
}
