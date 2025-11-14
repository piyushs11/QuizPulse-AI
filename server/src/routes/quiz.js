
import { Router } from "express";
import { prisma } from "../db.js";
import { generateQuiz } from "../openai.js";
import crypto from "crypto";

export const router = Router();
let ioRef = null;

export function attachSocket(io) {
  ioRef = io;
  io.on("connection", (socket) => {
    // Join room
    socket.on("join_room", async ({ joinCode, name }) => {
      const quiz = await prisma.quiz.findUnique({ where: { joinCode } });
      if (!quiz) {
        socket.emit("error_message", "Invalid code");
        return;
      }
      socket.join(joinCode);
      socket.data.name = name?.slice(0, 40) || "Player";
      io.to(joinCode).emit("lobby_update", { player: socket.data.name, action: "joined" });
    });

    // Player answers
    socket.on("answer", async ({ joinCode, sessionId, userId, questionId, selectedIndex, timeTakenMs }) => {
      try {
        const q = await prisma.question.findUnique({ where: { id: questionId } });
        if (!q) return;
        const isCorrect = selectedIndex === q.correctIndex;
        await prisma.response.create({
          data: {
            userId,
            questionId,
            selectedIndex,
            isCorrect,
            timeTakenMs: Math.max(0, Math.min(300000, Number(timeTakenMs) || 0))
          }
        });
        // Update score
        const base = isCorrect ? 10 : 0;
        const speedBonus = isCorrect ? Math.max(0, 5 - Math.floor((timeTakenMs || 0) / 1000)) : 0;
        const delta = base + speedBonus;

        await prisma.score.upsert({
          where: { sessionId_userId: { sessionId, userId } },
          create: { sessionId, userId, score: delta },
          update: { score: { increment: delta } }
        });

        // Broadcast leaderboard
        const leaderboard = await prisma.score.findMany({
          where: { sessionId },
          include: { user: true },
          orderBy: { score: "desc" }
        });
        io.to(joinCode).emit("leaderboardUpdate", leaderboard.map(s => ({
          userId: s.userId, name: s.user.name, score: s.score
        })));
      } catch (e) {
        console.error(e);
      }
    });

    socket.on("disconnect", () => {
      // no-op
    });
  });
}

function randomJoinCode() {
  // Uppercase alphanum, 6 chars
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[crypto.randomInt(0, alphabet.length)];
  return code;
}

// Create quiz -> generates via OpenAI
router.post("/quiz", async (req, res) => {
  try {
    const { topic, title, createdByName, email } = req.body || {};
    if (!topic) return res.status(400).json({ error: "topic required" });

    // Ensure user exists (lightweight)
    const user = await prisma.user.upsert({
      where: { email: email || `${crypto.randomUUID()}@guest.local` },
      create: { name: createdByName || "Host", email: email || `${crypto.randomUUID()}@guest.local` },
      update: { name: createdByName || "Host" }
    });

    const joinCode = randomJoinCode();
    const quiz = await prisma.quiz.create({
      data: {
        title: title || `Quiz: ${topic}`,
        topic,
        joinCode,
        createdBy: user.id,
        status: "DRAFT"
      }
    });

    const items = await generateQuiz(topic);
    const questionsData = items.map(it => ({
      quizId: quiz.id,
      questionText: String(it.question).slice(0, 500),
      options: it.options.map(o => String(o).slice(0, 200)),
      correctIndex: Math.max(0, Math.min(3, Number(it.answerIndex) || 0)),
      explanation: it.explanation ? String(it.explanation).slice(0, 800) : null
    }));

    if (questionsData.length) {
      await prisma.question.createMany({ data: questionsData });
    }

    // Create a session
    const session = await prisma.session.create({ data: { quizId: quiz.id } });

    res.json({ quizId: quiz.id, joinCode, sessionId: session.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed_to_create_quiz" });
  }
});

// Start quiz (set LIVE and broadcast)
router.post("/quiz/:joinCode/start", async (req, res) => {
  try {
    const { joinCode } = req.params;
    const quiz = await prisma.quiz.update({
      where: { joinCode },
      data: { status: "LIVE" }
    });
    const session = await prisma.session.findFirst({ where: { quizId: quiz.id, isActive: true } });
    const questions = await prisma.question.findMany({ where: { quizId: quiz.id } });
    // broadcast
    ioRef?.to(joinCode).emit("quiz_start", { sessionId: session.id, questions: questions.map(q => ({
      id: q.id, questionText: q.questionText, options: q.options
    })) });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed_to_start" });
  }
});

// End quiz
router.post("/quiz/:joinCode/end", async (req, res) => {
  try {
    const { joinCode } = req.params;
    const quiz = await prisma.quiz.update({
      where: { joinCode },
      data: { status: "ENDED" }
    });
    const session = await prisma.session.findFirst({ where: { quizId: quiz.id, isActive: true } });
    if (session) {
      await prisma.session.update({ where: { id: session.id }, data: { isActive: false, endedAt: new Date() } });
    }
    ioRef?.to(joinCode).emit("quiz_end", { message: "Quiz ended" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed_to_end" });
  }
});

// Join helper: create or fetch user
router.post("/join", async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const user = await prisma.user.upsert({
      where: { email: email || `${crypto.randomUUID()}@guest.local` },
      create: { name: name || "Player", email: email || `${crypto.randomUUID()}@guest.local` },
      update: { name: name || "Player" }
    });
    res.json({ userId: user.id, name: user.name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed_to_join" });
  }
});

// Fetch leaderboard for a session
router.get("/leaderboard/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const scores = await prisma.score.findMany({
    where: { sessionId },
    include: { user: true },
    orderBy: { score: "desc" }
  });
  res.json(scores.map(s => ({ userId: s.userId, name: s.user.name, score: s.score })));
});

export default router;
