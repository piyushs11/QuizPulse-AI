
"use client";
import Link from "next/link";
import styles from './page.module.css';

export default function Home() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.title}>AI Quiz Builder</h1>
        <p className={styles.heroSubtitle}>
          Create engaging quizzes in seconds with AI-powered generation. Share with friends and compete on the leaderboard.
        </p>
        
        <div className={styles.heroButtons}>
          <Link href="/create" className="btn btn-primary btn-lg">
            <span>✨</span> Create a Quiz
          </Link>
          <Link href="/join" className="btn btn-secondary btn-lg">
            Join Quiz
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className={styles.features}>
        <div className="card">
          <div className={styles.featureIcon}>🤖</div>
          <h3>AI-Powered</h3>
          <p>Instantly generate quizzes on any topic using OpenAI.</p>
        </div>
        <div className="card">
          <div className={styles.featureIcon}>⚡</div>
          <h3>Real-Time</h3>
          <p>Live updates and instant feedback with WebSocket technology.</p>
        </div>
        <div className="card">
          <div className={styles.featureIcon}>🏆</div>
          <h3>Leaderboard</h3>
          <p>Track scores and compete with friends in real-time.</p>
        </div>
      </div>
    </section>
  );
}
