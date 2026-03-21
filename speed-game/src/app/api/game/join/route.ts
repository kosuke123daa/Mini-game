import { NextRequest, NextResponse } from "next/server";
import { joinRoom, getRoom, getGame, setGame } from "@/lib/store";
import { createGame } from "@/lib/game";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, playerId } = body;

  if (!roomId || !playerId) {
    return NextResponse.json({ error: "roomId and playerId required" }, { status: 400 });
  }

  const upperRoomId = roomId.toUpperCase();

  const result = await joinRoom(upperRoomId, playerId);
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const room = await getRoom(upperRoomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Start game if both players are in and game hasn't started yet
  if (room.player1Id && room.player2Id && !(await getGame(upperRoomId))) {
    const game = createGame(upperRoomId, room.player1Id, room.player2Id);
    await setGame(upperRoomId, game);
  }

  return NextResponse.json({
    success: true,
    roomId: upperRoomId,
    isPlayer1: result.isPlayer1,
    gameStarted: !!(room.player1Id && room.player2Id),
  });
}
