import { kv } from "@vercel/kv";
import { GameState } from "./types";

const ROOM_TTL = 3600; // 1 hour
const GAME_TTL = 3600;

interface RoomData {
  player1Id: string;
  player2Id?: string;
}

function generateId(length = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function createRoom(playerId: string): Promise<string> {
  const roomId = generateId(4);
  await kv.set(`room:${roomId}`, { player1Id: playerId }, { ex: ROOM_TTL });
  return roomId;
}

export async function joinRoom(
  roomId: string,
  playerId: string
): Promise<{ success: boolean; message?: string; isPlayer1: boolean }> {
  const room = await kv.get<RoomData>(`room:${roomId}`);
  if (!room) {
    return { success: false, message: "Room not found", isPlayer1: false };
  }
  if (room.player1Id === playerId) {
    return { success: true, isPlayer1: true };
  }
  if (room.player2Id) {
    if (room.player2Id === playerId) {
      return { success: true, isPlayer1: false };
    }
    return { success: false, message: "Room is full", isPlayer1: false };
  }
  await kv.set(`room:${roomId}`, { ...room, player2Id: playerId }, { ex: ROOM_TTL });
  return { success: true, isPlayer1: false };
}

export async function getRoom(roomId: string): Promise<RoomData | null> {
  return kv.get<RoomData>(`room:${roomId}`);
}

export async function getGame(roomId: string): Promise<GameState | undefined> {
  const data = await kv.get<GameState>(`game:${roomId}`);
  return data ?? undefined;
}

export async function setGame(roomId: string, state: GameState): Promise<void> {
  await kv.set(`game:${roomId}`, state, { ex: GAME_TTL });
}

export async function deleteGame(roomId: string): Promise<void> {
  await kv.del(`game:${roomId}`, `room:${roomId}`);
}
