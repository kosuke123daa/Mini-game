export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];      // cards in hand (up to 4)
  stock: Card[];     // face-down pile
}

export type GameStatus = "waiting" | "playing" | "stuck" | "finished";

export interface GameState {
  roomId: string;
  players: PlayerState[];
  centerPiles: Card[][];  // 2 center piles
  status: GameStatus;
  winner?: string;       // player id
  lastUpdated: number;
  lastAutoFlipAt?: number;     // timestamp of last auto-flip (stuck detection)
  centerPileLastPlayerId: (string | null)[]; // last player who placed on each pile
}

export interface PlayCardAction {
  roomId: string;
  playerId: string;
  cardId: string;
  pileIndex: number; // 0 or 1
}
