
"use client";
import { useState } from "react";
import { io } from "socket.io-client";
import styles from './join.module.css';

export default function JoinPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const server = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

  function connectSocket() {
    const s = io(server);
    s.on("connect", () => {
      s.emit("join_room", { joinCode, name });
    });
    s.on("quiz_start", (payload: any) => {
      setSessionId(payload.sessionId);
      setQuestions(payload.questions);
      setCurrentIdx(0);
    });
    s.on("leaderboardUpdate", (lb: any) => setLeaderboard(lb));
    return s;
  }

  async function handleJoin() {
    const res = await fetch(`${server}/api/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
    const data = await res.json();
    setUser(data);
    connectSocket();
    setJoined(true);
  }

  async function submitAnswer(idx: number) {
    const s = io(server);
    s.emit("answer", {
      joinCode,
      sessionId,
      userId: user?.userId,
      questionId: questions[currentIdx].id,
      selectedIndex: idx,
      timeTakenMs: 1000
    });
    setCurrentIdx(i => Math.min(i + 1, questions.length - 1));
  }

  return (
    <div className={styles.container}>
      {!joined ? (
        <div className={styles.joinCard}>
          <h2>Join a Quiz</h2>
          <p className={styles.subtitle}>Enter the code shared by the host to join the quiz</p>

          <div className="input-group">
            <label htmlFor="name">Your Name *</label>
            <input 
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name} 
              onChange={e=>setName(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email (Optional)</label>
            <input 
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label htmlFor="joinCode">Join Code *</label>
            <input 
              id="joinCode"
              type="text"
              placeholder="e.g., ABC123"
              value={joinCode} 
              onChange={e=>setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>

          <button 
            className="btn btn-primary btn-lg" 
            onClick={handleJoin} 
            disabled={!name || !joinCode}
            style={{ width: '100%' }}
          >
            Join Quiz →
          </button>
        </div>
      ) : (
        <div className={styles.quizContainer}>
          {questions.length === 0 ? (
            <div className={styles.waitingCard}>
              <div className={styles.spinner}></div>
              <h3>Waiting for host to start...</h3>
              <p>Be ready! Quiz starts soon.</p>
            </div>
          ) : (
            <div className={styles.quizContent}>
              <div className={styles.questionCard}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progress}
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                </div>

                <h3 className={styles.questionText}>{questions[currentIdx].questionText}</h3>

                <div className={styles.options}>
                  {questions[currentIdx].options.map((opt: string, idx: number) => (
                    <button 
                      key={idx} 
                      className={styles.optionBtn}
                      onClick={() => submitAnswer(idx)}
                    >
                      <span className={styles.optionLabel}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.leaderboardCard}>
                <h4>🏆 Leaderboard</h4>
                <div className={styles.leaderboard}>
                  {leaderboard.length > 0 ? (
                    leaderboard.map((row: any, idx: number) => (
                      <div key={row.userId} className={styles.leaderboardRow}>
                        <span className={styles.rank}>#{idx + 1}</span>
                        <span className={styles.playerName}>{row.name}</span>
                        <span className={styles.score}>{row.score}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyLeaderboard}>No scores yet...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
