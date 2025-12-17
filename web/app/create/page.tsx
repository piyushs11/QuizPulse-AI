
"use client";
import { useState } from "react";
import styles from './create.module.css';

export default function CreatePage() {
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const server = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

  async function handleCreate() {
    setLoading(true);
    const res = await fetch(`${server}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, title, createdByName: name, email })
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className={styles.container} style={{ justifyContent: 'space-around' }}>
      <div className={styles.formCard}>
        <h2>Create Your Quiz</h2>
        <p className={styles.subtitle}>Let AI generate engaging questions based on your topic</p>

        <div className="input-group">
          <label htmlFor="name">Your Name (Host) *</label>
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
          <label htmlFor="topic">Quiz Topic *</label>
          <input 
            id="topic"
            type="text"
            placeholder="e.g., History of Ancient Rome, Quantum Physics..."
            value={topic} 
            onChange={e=>setTopic(e.target.value)} 
          />
        </div>

        <div className="input-group">
          <label htmlFor="title">Quiz Title (Optional)</label>
          <input 
            id="title"
            type="text"
            placeholder="Give your quiz a catchy name"
            value={title} 
            onChange={e=>setTitle(e.target.value)} 
          />
        </div>

        <button 
          className="btn btn-primary btn-lg" 
          onClick={handleCreate} 
          disabled={loading || !topic}
          style={{ width: '100%' }}
        >
          {loading ? '✨ Generating Quiz...' : '✨ Create & Generate'}
        </button>
      </div>

      {result && result.joinCode && (
        <div className={styles.successCard}>
          <div className={styles.successHeader}>
            <span className={styles.successIcon}>🎉</span>
            <h3>Quiz Created Successfully!</h3>
          </div>
          
          <div className={styles.codeSection}>
            <label>Share this code with players:</label>
            <div className={styles.codeDisplay}>{result.joinCode}</div>
            <p className={styles.sessionId}>Session ID: {result.sessionId}</p>
          </div>

          <a href={`/host/${result.joinCode}?sessionId=${result.sessionId}`} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Open Host Lobby →
          </a>
        </div>
      )}
    </div>
  );
}
