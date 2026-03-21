import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame } from "@/lib/store";
import { autoFlipFromHands } from "@/lib/game";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, playerId } = body;

  if (!roomId || !playerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const game = await getGame(roomId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "stuck") {
    return NextResponse.json({ error: "Game is not stuck" }, { status: 400 });
  }

  // Only player 1 (index 0) can resume
  if (game.players[0].id !== playerId) {
    return NextResponse.json({ error: "Only player 1 can resume" }, { status: 403 });
  }

  const newState = autoFlipFromHands({ ...game, status: "playing" });
  await setGame(roomId, newState);
  return NextResponse.json({ success: true });
}
