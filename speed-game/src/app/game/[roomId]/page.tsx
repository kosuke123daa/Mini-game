"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Card {
  id: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: number;
}

interface PileView {
  topCard: Card | null;
  count: number;
  lastPlayer: string | null;
}

interface GameView {
  roomId: string;
  status: "waiting" | "playing" | "stuck" | "finished";
  winner?: string;
  centerPiles: PileView[];
  myHand: Card[];
  myStockCount: number;
  opponentHandCount: number;
  opponentStockCount: number;
  myId: string;
  isPlayer1: boolean;
  myName: string;
  opponentName: string;
  lastUpdated: number;
  lastAutoFlipAt?: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const RANK_LABELS: Record<number, string> = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
};

function rankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank);
}

function isRed(suit: string): boolean {
  return suit === "hearts" || suit === "diamonds";
}

function CardComponent({
  card,
  selected,
  faceDown = false,
  onClick,
  small = false,
}: {
  card?: Card;
  selected?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  const w = small ? 44 : 60;
  const h = small ? 62 : 84;

  if (!card && !faceDown) {
    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 8,
          border: "2px dashed #334155",
          background: "transparent",
        }}
      />
    );
  }

  if (faceDown) {
    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 8,
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
          border: "2px solid #2d4a7a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: small ? 16 : 22,
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
      >
        🂠
      </div>
    );
  }

  if (!card) return null;

  const color = isRed(card.suit) ? "#dc2626" : "#1e293b";

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        background: selected
          ? "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)"
          : "#f8fafc",
        border: selected ? "3px solid #60a5fa" : "2px solid #cbd5e1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px",
        cursor: onClick ? "pointer" : "default",
        boxShadow: selected
          ? "0 0 20px rgba(59,130,246,0.6), 0 4px 12px rgba(0,0,0,0.4)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "all 0.15s ease",
        transform: selected ? "translateY(-8px)" : "translateY(0)",
      }}
      onClick={onClick}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "2px",
        }}
      >
        <span
          style={{
            fontSize: small ? 11 : 14,
            fontWeight: "800",
            color: selected ? "#fff" : color,
            lineHeight: 1,
          }}
        >
          {rankLabel(card.rank)}
        </span>
        <span style={{ fontSize: small ? 9 : 11, color: selected ? "#93c5fd" : color }}>
          {SUIT_SYMBOLS[card.suit]}
        </span>
      </div>
      <span
        style={{
          fontSize: small ? 20 : 28,
          color: selected ? "#bfdbfe" : color,
          lineHeight: 1,
        }}
      >
        {SUIT_SYMBOLS[card.suit]}
      </span>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "2px",
          transform: "rotate(180deg)",
        }}
      >
        <span
          style={{
            fontSize: small ? 11 : 14,
            fontWeight: "800",
            color: selected ? "#fff" : color,
            lineHeight: 1,
          }}
        >
          {rankLabel(card.rank)}
        </span>
        <span style={{ fontSize: small ? 9 : 11, color: selected ? "#93c5fd" : color }}>
          {SUIT_SYMBOLS[card.suit]}
        </span>
      </div>
    </div>
  );
}

function EmptyPile({ onClick }: { onClick?: () => void }) {
  return (
    <div
      style={{
        width: 72,
        height: 100,
        borderRadius: 10,
        border: "2px dashed #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        color: "#475569",
        fontSize: 24,
      }}
      onClick={onClick}
    >
      +
    </div>
  );
}

function CenterPile({
  pile,
  selected,
  onClick,
}: {
  pile: PileView;
  selected: boolean;
  onClick: () => void;
}) {
  const isMe = pile.lastPlayer === "あなた";
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
      onClick={onClick}
    >
      <div
        style={{
          position: "relative",
          width: 72,
          height: 100,
          cursor: "pointer",
        }}
      >
        {pile.topCard ? (
          <div style={{ transform: selected ? "scale(1.05)" : "scale(1)", transition: "transform 0.15s" }}>
            <CardComponent card={pile.topCard} small={false} />
          </div>
        ) : (
          <EmptyPile />
        )}
        {selected && (
          <div
            style={{
              position: "absolute",
              inset: -3,
              borderRadius: 12,
              border: "3px solid #22c55e",
              pointerEvents: "none",
              boxShadow: "0 0 15px rgba(34,197,94,0.5)",
            }}
          />
        )}
        {pile.lastPlayer && (
          <div
            style={{
              position: "absolute",
              top: -20,
              left: "50%",
              transform: "translateX(-50%)",
              background: isMe ? "#1d4ed8" : "#7c3aed",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {pile.lastPlayer}
          </div>
        )}
      </div>
      <span style={{ color: "#64748b", fontSize: 11 }}>{pile.count}枚</span>
    </div>
  );
}

export default function GamePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerId = searchParams.get("playerId") || "";

  const [gameView, setGameView] = useState<GameView | null>(null);
  const [waitingStatus, setWaitingStatus] = useState<{
    player1Joined: boolean;
    player2Joined: boolean;
  } | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedPile, setSelectedPile] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdatedRef = useRef<number>(0);
  const lastAutoFlipRef = useRef<number>(0);

  const showMessage = useCallback((msg: string, duration = 1500) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  }, []);

  const fetchState = useCallback(async () => {
    if (!roomId || !playerId) return;
    try {
      const res = await fetch(
        `/api/game/state?roomId=${roomId}&playerId=${playerId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "waiting") {
        setWaitingStatus({
          player1Joined: data.player1Joined,
          player2Joined: data.player2Joined,
        });
        setGameView(null);
      } else {
        if (data.lastUpdated !== lastUpdatedRef.current) {
          lastUpdatedRef.current = data.lastUpdated;
          // Detect auto-flip and show notification
          if (data.lastAutoFlipAt && data.lastAutoFlipAt !== lastAutoFlipRef.current) {
            lastAutoFlipRef.current = data.lastAutoFlipAt;
            showMessage("🔀 動けない！手札から補充しました", 2500);
          }
          setGameView(data);
          setWaitingStatus(null);
        }
      }
    } catch {
      // ignore network errors
    }
  }, [roomId, playerId]);

  useEffect(() => {
    if (!playerId) {
      router.push("/");
      return;
    }
    fetchState();
    pollingRef.current = setInterval(fetchState, 500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchState, playerId, router]);

  async function handlePlayCard(cardId: string) {
    if (playing || gameView?.status !== "playing") return;

    // If no card selected, select this card
    if (selectedCard !== cardId) {
      setSelectedCard(cardId);
      setSelectedPile(null);
      return;
    }

    // Card already selected - deselect
    setSelectedCard(null);
  }

  async function handlePlayToPile(pileIndex: number) {
    if (!selectedCard || playing) return;

    setPlaying(true);
    try {
      const res = await fetch("/api/game/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          playerId,
          cardId: selectedCard,
          pileIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage("そこには置けません");
      } else {
        setSelectedCard(null);
        await fetchState();
      }
    } catch {
      showMessage("エラーが発生しました");
    } finally {
      setPlaying(false);
    }
  }

  async function handleResume() {
    if (playing) return;
    setPlaying(true);
    try {
      await fetch("/api/game/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerId }),
      });
      await fetchState();
    } catch {
      // ignore
    } finally {
      setPlaying(false);
    }
  }

  // Waiting screen
  if (waitingStatus) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0f172a 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>⏳</div>
          <h2
            style={{
              color: "#fff",
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "16px",
            }}
          >
            対戦相手を待っています
          </h2>
          <div
            style={{
              background: "#1e293b",
              borderRadius: "16px",
              padding: "24px 32px",
              marginBottom: "24px",
              border: "1px solid #334155",
            }}
          >
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px" }}>
              ルームコード
            </p>
            <p
              style={{
                color: "#3b82f6",
                fontSize: "48px",
                fontWeight: "800",
                letterSpacing: "8px",
                fontFamily: "monospace",
              }}
            >
              {roomId}
            </p>
          </div>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            このコードを相手に伝えてください
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              marginTop: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#22c55e",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              プレイヤー1 接続済み
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: waitingStatus.player2Joined ? "#22c55e" : "#64748b",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: waitingStatus.player2Joined ? "#22c55e" : "#64748b",
                  display: "inline-block",
                }}
              />
              プレイヤー2{" "}
              {waitingStatus.player2Joined ? "接続済み" : "待機中..."}
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: "32px",
              padding: "12px 24px",
              background: "transparent",
              color: "#64748b",
              border: "1px solid #334155",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // Finished screen
  if (gameView?.status === "finished") {
    const iWon = gameView.winner === gameView.myId;
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: iWon
            ? "linear-gradient(135deg, #0f2744 0%, #064e3b 100%)"
            : "linear-gradient(135deg, #0f172a 0%, #450a0a 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "72px", marginBottom: "16px" }}>
            {iWon ? "🎉" : "😢"}
          </div>
          <h2
            style={{
              color: "#fff",
              fontSize: "36px",
              fontWeight: "800",
              marginBottom: "8px",
            }}
          >
            {iWon ? "あなたの勝ち！" : "相手の勝ち..."}
          </h2>
          <p style={{ color: iWon ? "#86efac" : "#fca5a5", fontSize: "16px" }}>
            {iWon ? "おめでとうございます！" : "次は頑張ろう！"}
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: "40px",
              padding: "16px 40px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            もう一度遊ぶ
          </button>
        </div>
      </div>
    );
  }

  if (!gameView) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#94a3b8",
        }}
      >
        読み込み中...
      </div>
    );
  }

  const { centerPiles, myHand, myStockCount, opponentHandCount, opponentStockCount } = gameView;

  return (
    <div
      style={{
        minHeight: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #0f172a 0%, #1a2744 50%, #0f172a 100%)",
        position: "relative",
      }}
    >
      {/* Toast message */}
      {message && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(15,23,42,0.95)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            zIndex: 100,
            border: "1px solid #334155",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          {message}
        </div>
      )}

      {/* Opponent area (top) */}
      <div
        style={{
          padding: "12px 16px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(30,41,59,0.6)",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600" }}>
            {gameView.opponentName}
          </span>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ color: "#64748b", fontSize: "12px" }}>
            手札 <span style={{ color: "#f1f5f9", fontWeight: "700" }}>{opponentHandCount}</span>
          </span>
          <span style={{ color: "#64748b", fontSize: "12px" }}>
            山 <span style={{ color: "#f1f5f9", fontWeight: "700" }}>{opponentStockCount}</span>
          </span>
        </div>
      </div>

      {/* Opponent hand placeholder */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          padding: "12px 16px",
          minHeight: "78px",
          alignItems: "center",
        }}
      >
        {Array.from({ length: opponentHandCount }).map((_, i) => (
          <CardComponent key={i} faceDown card={undefined} small />
        ))}
        {opponentHandCount === 0 && (
          <span style={{ color: "#475569", fontSize: "12px" }}>手札なし</span>
        )}
      </div>

      {/* Center area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Center piles */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "40px",
            padding: "8px",
          }}
        >
          {centerPiles.map((pile, idx) => (
            <CenterPile
              key={idx}
              pile={pile}
              selected={selectedPile === idx}
              onClick={() => {
                if (selectedCard) {
                  handlePlayToPile(idx);
                } else {
                  setSelectedPile(selectedPile === idx ? null : idx);
                }
              }}
            />
          ))}
        </div>

        {/* Stuck state */}
        {gameView.status === "stuck" && (
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <p style={{ color: "#f59e0b", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
              動けない！
            </p>
            {gameView.isPlayer1 ? (
              <button
                onClick={handleResume}
                disabled={playing}
                style={{
                  padding: "10px 28px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: playing ? "not-allowed" : "pointer",
                  opacity: playing ? 0.7 : 1,
                }}
              >
                再開
              </button>
            ) : (
              <p style={{ color: "#64748b", fontSize: "12px" }}>プレイヤー1の操作を待っています...</p>
            )}
          </div>
        )}

        {/* Hint */}
        {gameView.status === "playing" && selectedCard && (
          <p
            style={{
              textAlign: "center",
              color: "#22c55e",
              fontSize: "13px",
              marginTop: "8px",
              fontWeight: "600",
            }}
          >
            ↑ 置きたい山をタップ
          </p>
        )}
        {gameView.status === "playing" && !selectedCard && (
          <p style={{ textAlign: "center", color: "#334155", fontSize: "11px", marginTop: "8px" }}>
            カードを選んで山に置こう
          </p>
        )}
      </div>

      {/* My hand */}
      <div style={{ padding: "8px 16px" }}>
        {/* My hand label */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>
            あなたの手札
          </span>
          <span style={{ color: "#64748b", fontSize: "12px" }}>
            山 <span style={{ color: "#f1f5f9", fontWeight: "700" }}>{myStockCount}</span>枚
          </span>
        </div>

        {/* Hand cards */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "12px",
            minHeight: "88px",
            alignItems: "flex-end",
          }}
        >
          {myHand.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              selected={selectedCard === card.id}
              onClick={() => handlePlayCard(card.id)}
            />
          ))}
          {myHand.length === 0 && myStockCount === 0 && (
            <span style={{ color: "#22c55e", fontSize: "14px", fontWeight: "600" }}>
              全部使った！
            </span>
          )}
          {myHand.length === 0 && myStockCount > 0 && (
            <span style={{ color: "#f59e0b", fontSize: "13px" }}>
              山からドロー中...
            </span>
          )}
        </div>

        {/* Room code */}
        <p style={{ textAlign: "center", color: "#334155", fontSize: "11px" }}>
          ルーム: {roomId}
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
