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

export type GameStatus = "waiting" | "playing" | "finished";

export interface GameState {
  roomId: string;
  players: PlayerState[];
  centerPiles: Card[][];  // 2 center piles
  speedPiles: Card[][];   // 2 speed piles (flipped when stuck)
  status: GameStatus;
  winner?: string;       // player id
  lastUpdated: number;
  pendingSpeedVotes: string[]; // player ids who voted for speed
}

export interface PlayCardAction {
  roomId: string;
  playerId: string;
  cardId: string;
  pileIndex: number; // 0 or 1
}

export interface SpeedAction {
  roomId: string;
  playerId: string;
}
