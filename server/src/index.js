
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { prisma } from "./db.js";
import { router as quizRouter, attachSocket } from "./routes/quiz.js";

dotenv.config();

const corsOrigins = process.env.CLIENT_ORIGIN?.split(",").map(origin => origin.trim()) || ["http://localhost:3000"];

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Health
app.get("/health", (_, res) => res.json({ ok: true }));

// HTTP server + WebSocket
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: corsOrigins }
});
attachSocket(io);

// Routes
app.use("/api", quizRouter);

// Start
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
