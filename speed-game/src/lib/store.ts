import { GameState } from "./types";

// In-memory store for game states
// Works for development and single-server deployments
const games = new Map<string, GameState>();
const rooms = new Map<string, { player1Id: string; player2Id?: string }>(); // roomId -> playerIds

function generateId(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function createRoom(playerId: string): string {
  const roomId = generateId(4);
  rooms.set(roomId, { player1Id: playerId });
  return roomId;
}

export function joinRoom(
  roomId: string,
  playerId: string
): { success: boolean; message?: string; isPlayer1: boolean } {
  const room = rooms.get(roomId);
  if (!room) {
    return { success: false, message: "Room not found", isPlayer1: false };
  }
  if (room.player1Id === playerId) {
    return { success: true, isPlayer1: true }; // already in room
  }
  if (room.player2Id) {
    if (room.player2Id === playerId) {
      return { success: true, isPlayer1: false }; // already in room as P2
    }
    return { success: false, message: "Room is full", isPlayer1: false };
  }
  room.player2Id = playerId;
  return { success: true, isPlayer1: false };
}

export function getRoom(roomId: string) {
  return rooms.get(roomId);
}

export function getGame(roomId: string): GameState | undefined {
  return games.get(roomId);
}

export function setGame(roomId: string, state: GameState): void {
  games.set(roomId, state);
}

export function deleteGame(roomId: string): void {
  games.delete(roomId);
  rooms.delete(roomId);
}
