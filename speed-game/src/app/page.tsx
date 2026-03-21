"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("playerId");
  if (!id) {
    id = generatePlayerId();
    sessionStorage.setItem("playerId", id);
  }
  return id;
}

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Ensure player ID exists
    getOrCreatePlayerId();
  }, []);

  async function handleCreate() {
    setLoading("create");
    setError("");
    const playerId = getOrCreatePlayerId();
    try {
      const res = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/game/${data.roomId}?playerId=${playerId}`);
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  async function handleJoin() {
    if (!roomCode.trim()) {
      setError("ルームコードを入力してください");
      return;
    }
    setLoading("join");
    setError("");
    const playerId = getOrCreatePlayerId();
    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: roomCode.toUpperCase(), playerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "参加できませんでした");
        return;
      }
      router.push(`/game/${data.roomId}?playerId=${playerId}`);
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

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
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{ fontSize: "64px", marginBottom: "8px" }}>🃏</div>
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "800",
            color: "#fff",
            letterSpacing: "-1px",
            textShadow: "0 0 30px rgba(59,130,246,0.5)",
          }}
        >
          スピード
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px" }}>
          2人対戦カードゲーム
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "360px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          border: "1px solid #334155",
        }}
      >
        {/* Create Room */}
        <button
          onClick={handleCreate}
          disabled={loading !== null}
          style={{
            width: "100%",
            padding: "16px",
            background: loading === "create" ? "#1d4ed8" : "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: loading !== null ? "not-allowed" : "pointer",
            marginBottom: "16px",
            transition: "background 0.2s",
            opacity: loading !== null ? 0.7 : 1,
          }}
        >
          {loading === "create" ? "作成中..." : "ゲームを作成"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#334155" }} />
          <span style={{ color: "#64748b", fontSize: "12px" }}>または</span>
          <div style={{ flex: 1, height: "1px", background: "#334155" }} />
        </div>

        {/* Join Room */}
        <input
          type="text"
          placeholder="ルームコード (例: A3B2)"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          maxLength={4}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #334155",
            borderRadius: "12px",
            fontSize: "20px",
            textAlign: "center",
            letterSpacing: "8px",
            fontWeight: "700",
            marginBottom: "12px",
            outline: "none",
          }}
        />
        <button
          onClick={handleJoin}
          disabled={loading !== null}
          style={{
            width: "100%",
            padding: "16px",
            background: "transparent",
            color: "#3b82f6",
            border: "2px solid #3b82f6",
            borderRadius: "12px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: loading !== null ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            opacity: loading !== null ? 0.7 : 1,
          }}
        >
          {loading === "join" ? "参加中..." : "ゲームに参加"}
        </button>

        {error && (
          <p
            style={{
              color: "#ef4444",
              textAlign: "center",
              marginTop: "16px",
              fontSize: "14px",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Rules */}
      <div
        style={{
          marginTop: "32px",
          maxWidth: "360px",
          width: "100%",
          background: "rgba(30,41,59,0.5)",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #1e293b",
        }}
      >
        <h3 style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>
          遊び方
        </h3>
        <ul style={{ color: "#64748b", fontSize: "12px", lineHeight: "1.8", paddingLeft: "0", listStyle: "none" }}>
          <li>• 手札から中央の山に1つ数字が違うカードを置く</li>
          <li>• A は K の隣として扱う（A-2, K-A）</li>
          <li>• 先に全てのカードを使い切った方が勝ち！</li>
          <li>• 置けない場合は「スピード！」ボタンで同時に追加</li>
        </ul>
      </div>
    </div>
  );
}
