import { NextRequest, NextResponse } from "next/server";
import { getGame, setGame } from "@/lib/store";
import { playCard } from "@/lib/game";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, playerId, cardId, pileIndex } = body;

  if (!roomId || !playerId || !cardId || pileIndex === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const game = await getGame(roomId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const result = playCard(game, playerId, cardId, pileIndex);
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  await setGame(roomId, result.state);
  return NextResponse.json({ success: true });
}
