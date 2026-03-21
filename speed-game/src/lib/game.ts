import { Card, GameState, PlayerState, Rank, Suit } from "./types";

function createDeck(): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const cards: Card[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({
        id: `${suit}-${rank}`,
        suit,
        rank: rank as Rank,
      });
    }
  }
  return cards;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function canPlayCard(card: Card, topCard: Card | undefined): boolean {
  if (!topCard) return true;
  const diff = Math.abs(card.rank - topCard.rank);
  return diff === 1 || diff === 12; // 12 handles A-K wrap
}

export function createGame(roomId: string, player1Id: string, player2Id: string): GameState {
  const allCards = createDeck();

  // Player 1 gets red cards (hearts + diamonds), Player 2 gets black cards (clubs + spades)
  const redCards = shuffle(allCards.filter((c) => c.suit === "hearts" || c.suit === "diamonds"));
  const blackCards = shuffle(allCards.filter((c) => c.suit === "clubs" || c.suit === "spades"));

  const player1Cards = redCards;   // 26 red cards
  const player2Cards = blackCards; // 26 black cards

  const player1: PlayerState = {
    id: player1Id,
    name: "Player 1",
    hand: player1Cards.slice(0, 4),
    stock: player1Cards.slice(4),
  };

  const player2: PlayerState = {
    id: player2Id,
    name: "Player 2",
    hand: player2Cards.slice(0, 4),
    stock: player2Cards.slice(4),
  };

  // Each player contributes 5 cards to their speed pile (for stuck situations)
  // Center piles start with 1 card each (taken from player stocks)
  const centerCard1 = player1.stock.pop()!;
  const centerCard2 = player2.stock.pop()!;

  return {
    roomId,
    players: [player1, player2],
    centerPiles: [[centerCard1], [centerCard2]],
    status: "playing",
    lastUpdated: Date.now(),
    centerPileLastPlayerId: [null, null],
  };
}

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
  pileIndex: number
): { success: boolean; state: GameState; message?: string } {
  if (state.status !== "playing") {
    return { success: false, state, message: "Game is not in progress" };
  }

  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  if (playerIdx === -1) {
    return { success: false, state, message: "Player not found" };
  }

  const player = state.players[playerIdx];
  const cardIdx = player.hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) {
    return { success: false, state, message: "Card not in hand" };
  }

  const card = player.hand[cardIdx];
  const pile = state.centerPiles[pileIndex];
  const topCard = pile[pile.length - 1];

  if (!canPlayCard(card, topCard)) {
    return { success: false, state, message: "Cannot play this card here" };
  }

  // Deep clone state to avoid mutations
  const newState: GameState = JSON.parse(JSON.stringify(state));
  const newPlayer = newState.players[playerIdx];

  // Remove card from hand
  newPlayer.hand.splice(cardIdx, 1);

  // Add card to pile and record who placed it
  newState.centerPiles[pileIndex].push(card);
  newState.centerPileLastPlayerId[pileIndex] = playerId;

  // Draw from stock if available - insert at the same position as the played card
  if (newPlayer.stock.length > 0 && newPlayer.hand.length < 4) {
    newPlayer.hand.splice(cardIdx, 0, newPlayer.stock.pop()!);
  }

  // Check win condition: no cards left in hand AND stock
  if (newPlayer.hand.length === 0 && newPlayer.stock.length === 0) {
    newState.status = "finished";
    newState.winner = playerId;
  }

  newState.lastUpdated = Date.now();

  return { success: true, state: newState };
}


export function canPlayerPlay(player: PlayerState, centerPiles: Card[][]): boolean {
  for (const card of player.hand) {
    for (const pile of centerPiles) {
      const topCard = pile[pile.length - 1];
      if (canPlayCard(card, topCard)) return true;
    }
  }
  return false;
}

export function isStuck(state: GameState): boolean {
  if (state.status !== "playing") return false;
  return state.players.every((p) => !canPlayerPlay(p, state.centerPiles));
}

export function autoFlipFromHands(state: GameState): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(state));

  for (let i = 0; i < 2; i++) {
    const player = newState.players[i];
    if (player.hand.length > 0) {
      const randomIdx = Math.floor(Math.random() * player.hand.length);
      const [card] = player.hand.splice(randomIdx, 1);
      newState.centerPiles[i].push(card);
      // Draw from stock to refill hand
      if (player.stock.length > 0 && player.hand.length < 4) {
        player.hand.push(player.stock.pop()!);
      }
      // Check win condition
      if (player.hand.length === 0 && player.stock.length === 0) {
        newState.status = "finished";
        newState.winner = player.id;
      }
    }
  }

  newState.lastAutoFlipAt = Date.now();
  newState.lastUpdated = Date.now();
  return newState;
}

export function getPlayerView(state: GameState, playerId: string) {
  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  const opponentIdx = playerIdx === 0 ? 1 : 0;

  if (playerIdx === -1) return null;

  const player = state.players[playerIdx];
  const opponent = state.players[opponentIdx];

  return {
    roomId: state.roomId,
    status: state.status,
    winner: state.winner,
    centerPiles: state.centerPiles.map((pile, i) => ({
      topCard: pile[pile.length - 1] ?? null,
      count: pile.length,
      lastPlayer: (state.centerPileLastPlayerId?.[i] ?? null) === null
        ? null
        : state.centerPileLastPlayerId[i] === playerId
        ? "あなた"
        : (opponent?.name ?? "相手"),
    })),
    myHand: player.hand,
    myStockCount: player.stock.length,
    opponentHandCount: opponent?.hand.length ?? 0,
    opponentStockCount: opponent?.stock.length ?? 0,
    myId: playerId,
    isPlayer1: playerIdx === 0,
    myName: player.name,
    opponentName: opponent?.name ?? "Waiting...",
    lastUpdated: state.lastUpdated,
    lastAutoFlipAt: state.lastAutoFlipAt,
  };
}
