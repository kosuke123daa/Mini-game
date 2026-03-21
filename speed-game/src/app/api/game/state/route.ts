import { NextRequest, NextResponse } from "next/server";
import { getGame, getRoom, setGame } from "@/lib/store";
import { getPlayerView, isStuck, autoFlipFromHands } from "@/lib/game";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const playerId = searchParams.get("playerId");

  if (!roomId || !playerId) {
    return NextResponse.json({ error: "roomId and playerId required" }, { status: 400 });
  }

  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  let game = await getGame(roomId);
  if (!game) {
    return NextResponse.json({
      status: "waiting",
      roomId,
      player1Joined: !!room.player1Id,
      player2Joined: !!room.player2Id,
    });
  }

  // Auto-flip if stuck (debounce: only if last flip was >2s ago)
  if (isStuck(game)) {
    const now = Date.now();
    const lastFlip = game.lastAutoFlipAt ?? 0;
    if (now - lastFlip > 2000) {
      game = autoFlipFromHands(game);
      await setGame(roomId, game);
    }
  }

  const view = getPlayerView(game, playerId);
  if (!view) {
    return NextResponse.json({ error: "Player not in game" }, { status: 403 });
  }

  return NextResponse.json(view);
}
