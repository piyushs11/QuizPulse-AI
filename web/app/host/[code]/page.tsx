
"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { io } from "socket.io-client";
import styles from './host.module.css';

export default function HostRoom() {
  const params = useParams();
  const search = useSearchParams();
  const joinCode = params?.code as string;
  const sessionId = search.get("sessionId") || "";
  const server = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

  const [players, setPlayers] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = io(server);
    s.on("connect", () => {
      s.emit("join_room", { joinCode, name: "Host" });
    });
    s.on("lobby_update", (evt: any) => {
      if (evt?.player && evt?.action === "joined") {
        setPlayers(p => Array.from(new Set([...p, evt.player])));
      }
    });
    s.on("leaderboardUpdate", (lb: any) => setLeaderboard(lb));
    s.on("quiz_start", () => setStarted(true));
    s.on("quiz_end", () => setStarted(false));
    return () => { s.disconnect(); };
  }, [joinCode, server]);

  async function startQuiz() {
    setLoading(true);
    await fetch(`${server}/api/quiz/${joinCode}/start`, { method: "POST" });
    setLoading(false);
  }
  async function endQuiz() {
    setLoading(true);
    await fetch(`${server}/api/quiz/${joinCode}/end`, { method: "POST" });
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Host Lobby</h2>
        <div className={styles.headerInfo}>
          <div className={styles.codeBox}>
            <span className={styles.label}>Join Code:</span>
            <span className={styles.code}>{joinCode}</span>
          </div>
          <div className={styles.codeBox}>
            <span className={styles.label}>Session ID:</span>
            <span className={styles.sessionId} title={sessionId}>{sessionId.substring(0, 8)}...</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Players Section */}
        <div className={styles.playersSection}>
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h3>👥 Players ({players.length})</h3>
            </div>
            <div className={styles.playersList}>
              {players.length > 0 ? (
                players.map(p => (
                  <div key={p} className={styles.playerItem}>
                    <span className={styles.playerIcon}>👤</span>
                    <span className={styles.playerName}>{p}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>Waiting for players to join...</p>
              )}
            </div>

            <div className={styles.actions}>
              <button 
                className="btn btn-primary btn-lg"
                onClick={startQuiz} 
                disabled={started || loading || players.length === 0}
                style={{ width: '100%' }}
              >
                {loading ? '⏳ Starting...' : '▶️ Start Quiz'}
              </button>
              <button 
                className="btn btn-secondary btn-lg"
                onClick={endQuiz} 
                disabled={!started || loading}
                style={{ width: '100%' }}
              >
                {loading ? '⏳ Ending...' : '⏹️ End Quiz'}
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className={styles.leaderboardSection}>
          <div className="card card-dark" style={{ height: '100%' }}>
            <h3 style={{ color: 'var(--color-white)' }}>🏆 Leaderboard</h3>
            <div className={styles.leaderboardList}>
              {leaderboard.length > 0 ? (
                leaderboard.map((row: any, idx: number) => (
                  <div key={row.userId} className={styles.leaderboardItem}>
                    <span className={styles.rank}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span className={styles.name}>{row.name}</span>
                    <span className={styles.scoreValue}>{row.score}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyLeaderboard}>Quiz hasn't started yet...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {started && (
        <div className={styles.liveIndicator}>
          <span className={styles.liveBadge}>● LIVE</span>
          Quiz is in progress
        </div>
      )}
    </div>
  );
}
