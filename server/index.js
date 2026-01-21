// 1. Importaciones modernas (ESM)
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { appDb } from "../server/db/db.js";
import { getRedis } from "./redis.js";

// Importa tus rutas de auth (ajusta la ruta según tu carpeta real)
import authRoutes from "./routes/auth.routes.js"; 
import academicoRoutes from "./routes/academico.routes.js";
import dotenv from 'dotenv';
dotenv.config();
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 3. Rutas de la API
app.use("/auth", authRoutes);
app.use("/academico", academicoRoutes);

// --- Endpoints de Health Check (T5) ---

app.get("/health", (req, res) => {
  res.json({ ok: true, name: "tuchat-server" });
});

// Verifica conexión a la base de datos local (Supabase App)
app.get("/health/db", async (req, res) => {
  try {
    const result = await appDb.query("SELECT 1 AS ok");
    res.json({ ok: true, db: result.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Verifica conexión a Redis (Docker)
app.get("/health/redis", async (req, res) => {
  try {
    const redis = getRedis();
    await redis.set("tuchat:ping", "pong", "EX", 10);
    const val = await redis.get("tuchat:ping");
    res.json({ ok: true, redis: val });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Configuración de Servidor HTTP y WebSockets ---

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, credentials: true },
});

io.on("connection", (socket) => {
  console.log("🚀 Socket conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket desconectado:", socket.id);
  });

  socket.on("chat:send", (payload) => {
    io.emit("chat:message", payload);
  });
});

// --- Inicio del servidor ---

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});